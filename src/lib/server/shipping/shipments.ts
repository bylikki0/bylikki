import { error } from '@sveltejs/kit';
import {
	isShippingMethod,
	parcelWeightGrams,
	SHIPPING_METHODS,
	type CarrierCode,
	type ShippingMethodKey,
	type ShippingSettings
} from '$lib/client/validation/shipping';
import { prisma } from '../database/client';
import { getSetting } from '../database/settings';
import { carrierFor } from './carriers';
import { CarrierError, type Party } from './types';

const RETURN_METHODS: Partial<Record<CarrierCode, ShippingMethodKey>> = {
	MONDIAL_RELAY: 'mondial-relay-relais',
	COLISSIMO: 'colissimo-domicile',
	CHRONOPOST: 'chronopost-domicile'
};

export async function withCarrierErrors<T>(action: () => Promise<T>) {
	try {
		return await action();
	} catch (cause) {
		if (cause instanceof CarrierError) {
			error(502, cause.message);
		}

		throw cause;
	}
}

export function shopParty(settings: ShippingSettings): Party {
	const { sender } = settings;

	if (!sender.name || !sender.line1 || !sender.postalCode || !sender.city) {
		error(
			400,
			'Renseigne l’adresse d’expédition de la boutique dans Paramètres avant de créer une étiquette.'
		);
	}

	return {
		name: sender.name,
		line1: sender.line1,
		line2: sender.line2 || null,
		postalCode: sender.postalCode,
		city: sender.city,
		country: sender.country,
		email: sender.email || null,
		phone: sender.phone || null
	};
}

export function labelResponse(label: Uint8Array, filename: string) {
	return new Response(new Uint8Array(label), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'private, no-store'
		}
	});
}

export async function createOutboundShipment(reference: string, weightGrams: number) {
	const order = await prisma.order.findUnique({
		where: { reference },
		select: {
			id: true,
			reference: true,
			paymentStatus: true,
			contactEmail: true,
			shippingMethod: true,
			relayPointId: true,
			shippingFullName: true,
			shippingLine1: true,
			shippingLine2: true,
			shippingPostalCode: true,
			shippingCity: true,
			shippingCountry: true,
			shipments: { where: { direction: 'OUTBOUND' }, select: { id: true } }
		}
	});

	if (!order) {
		error(404, 'Cette commande est introuvable.');
	}

	if (order.paymentStatus !== 'PAID') {
		error(409, 'Seule une commande payée peut être expédiée.');
	}

	if (order.shipments.length > 0) {
		error(409, 'Une étiquette existe déjà pour cette commande.');
	}

	const method: ShippingMethodKey = isShippingMethod(order.shippingMethod)
		? order.shippingMethod
		: 'colissimo-domicile';
	const definition = SHIPPING_METHODS[method];
	const adapter = carrierFor(definition.carrier);

	if (!adapter) {
		error(503, 'Ce transporteur n’est pas configuré sur la boutique.');
	}

	const settings = await getSetting('shipping');
	const label = await withCarrierErrors(() =>
		adapter.createLabel({
			reference: order.reference,
			method,
			direction: 'OUTBOUND',
			weightGrams,
			sender: shopParty(settings),
			recipient: {
				name: order.shippingFullName,
				line1: order.shippingLine1,
				line2: order.shippingLine2,
				postalCode: order.shippingPostalCode,
				city: order.shippingCity,
				country: order.shippingCountry,
				email: order.contactEmail,
				phone: null
			},
			relayPointId: order.relayPointId
		})
	);

	const shipment = await prisma.shipment.create({
		data: {
			orderId: order.id,
			direction: 'OUTBOUND',
			carrier: definition.carrier,
			service: method,
			trackingNumber: label.trackingNumber,
			label: new Uint8Array(label.pdf),
			weightGrams,
			demo: adapter.demo,
			status: 'LABEL_CREATED',
			lastTrackedAt: new Date()
		},
		select: { id: true, carrier: true, trackingNumber: true }
	});

	return { shipment, order };
}

export async function createReturnShipment(returnId: string) {
	const request = await prisma.returnRequest.findUnique({
		where: { id: returnId },
		select: {
			id: true,
			status: true,
			shipments: { select: { id: true } },
			items: {
				select: {
					quantity: true,
					orderItem: { select: { variant: { select: { weightGrams: true } } } }
				}
			},
			order: {
				select: {
					reference: true,
					contactEmail: true,
					carrier: true,
					shippingFullName: true,
					shippingLine1: true,
					shippingLine2: true,
					shippingPostalCode: true,
					shippingCity: true,
					shippingCountry: true
				}
			}
		}
	});

	if (!request) {
		error(404, 'Cette demande de retour est introuvable.');
	}

	if (request.status !== 'ACCEPTED') {
		error(409, 'Accepte d’abord le retour avant de générer son étiquette.');
	}

	if (request.shipments.length > 0) {
		error(409, 'Une étiquette retour existe déjà pour cette demande.');
	}

	const candidates: CarrierCode[] = [
		...(request.order.carrier && RETURN_METHODS[request.order.carrier]
			? [request.order.carrier]
			: []),
		'COLISSIMO',
		'MONDIAL_RELAY',
		'CHRONOPOST'
	];
	const carrier = candidates.find((candidate) => carrierFor(candidate) !== null);
	const method = carrier ? RETURN_METHODS[carrier] : undefined;
	const adapter = carrier ? carrierFor(carrier) : null;

	if (!carrier || !method || !adapter) {
		error(503, 'Aucun transporteur n’est configuré pour les retours.');
	}

	const settings = await getSetting('shipping');
	const weightGrams = parcelWeightGrams(
		request.items.map((item) => ({
			quantity: item.quantity,
			weightGrams: item.orderItem.variant?.weightGrams ?? null
		})),
		settings
	);
	const label = await withCarrierErrors(() =>
		adapter.createLabel({
			reference: `${request.order.reference}-R`,
			method,
			direction: 'RETURN',
			weightGrams,
			sender: {
				name: request.order.shippingFullName,
				line1: request.order.shippingLine1,
				line2: request.order.shippingLine2,
				postalCode: request.order.shippingPostalCode,
				city: request.order.shippingCity,
				country: request.order.shippingCountry,
				email: request.order.contactEmail,
				phone: null
			},
			recipient: shopParty(settings),
			relayPointId: null
		})
	);

	const shipment = await prisma.shipment.create({
		data: {
			returnRequestId: request.id,
			direction: 'RETURN',
			carrier,
			service: method,
			trackingNumber: label.trackingNumber,
			label: new Uint8Array(label.pdf),
			weightGrams,
			demo: adapter.demo,
			status: 'LABEL_CREATED',
			lastTrackedAt: new Date()
		},
		select: { id: true, carrier: true, trackingNumber: true }
	});

	return { shipment, request };
}

export function findOrderLabel(reference: string, shipmentId: string | null) {
	return prisma.shipment.findFirst({
		where: {
			order: { reference },
			direction: 'OUTBOUND',
			...(shipmentId ? { id: shipmentId } : {}),
			label: { not: null }
		},
		orderBy: { createdAt: 'desc' },
		select: { label: true }
	});
}

export function findReturnLabel(returnId: string, userId: string) {
	return prisma.shipment.findFirst({
		where: {
			returnRequestId: returnId,
			direction: 'RETURN',
			returnRequest: { userId },
			label: { not: null }
		},
		orderBy: { createdAt: 'desc' },
		select: { label: true, returnRequest: { select: { order: { select: { reference: true } } } } }
	});
}
