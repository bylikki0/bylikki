import {
	isShippingMethod,
	SHIPPING_METHODS,
	type CarrierCode,
	type ShipmentStatusCode
} from '$lib/client/validation/shipping';
import { prisma } from '../database/client';
import { carrierFor } from './carriers';
import { CarrierError } from './types';

const FINAL_STATUSES: ShipmentStatusCode[] = ['DELIVERED', 'RETURNED'];

const shipmentSelect = {
	id: true,
	carrier: true,
	service: true,
	trackingNumber: true,
	status: true,
	direction: true,
	orderId: true,
	returnRequestId: true
} as const;

type TrackedShipment = {
	id: string;
	carrier: CarrierCode;
	service: string;
	trackingNumber: string;
	status: ShipmentStatusCode;
	direction: 'OUTBOUND' | 'RETURN';
	orderId: string | null;
	returnRequestId: string | null;
};

export async function refreshShipment(shipment: TrackedShipment, now = new Date()) {
	const adapter = carrierFor(shipment.carrier);

	if (!adapter) {
		throw new CarrierError('Ce transporteur n’est pas configuré : le suivi est indisponible.');
	}

	const delivery = isShippingMethod(shipment.service)
		? SHIPPING_METHODS[shipment.service].delivery
		: 'home';
	const update = await adapter.track({
		trackingNumber: shipment.trackingNumber,
		currentStatus: shipment.status,
		delivery
	});
	const delivered = update.status === 'DELIVERED';

	await prisma.shipment.update({
		where: { id: shipment.id },
		data: {
			status: update.status,
			lastEvent: update.event,
			lastTrackedAt: now,
			...(delivered ? { deliveredAt: now } : {})
		},
		select: { id: true }
	});

	if (delivered && shipment.direction === 'OUTBOUND' && shipment.orderId) {
		await prisma.order.updateMany({
			where: { id: shipment.orderId, status: { in: ['PAID', 'PREPARING', 'SHIPPED'] } },
			data: { status: 'DELIVERED', deliveredAt: now }
		});
	}

	if (delivered && shipment.direction === 'RETURN' && shipment.returnRequestId) {
		await prisma.returnRequest.updateMany({
			where: { id: shipment.returnRequestId, status: 'ACCEPTED' },
			data: { status: 'RECEIVED', receivedAt: now }
		});
	}

	return update;
}

async function refreshMany(shipments: TrackedShipment[], deadline: number) {
	let updated = 0;
	const failures: string[] = [];

	for (const shipment of shipments) {
		if (Date.now() > deadline) {
			break;
		}

		try {
			await refreshShipment(shipment);
			updated += 1;
		} catch (cause) {
			if (!(cause instanceof CarrierError)) {
				throw cause;
			}

			failures.push(`${shipment.trackingNumber} : ${cause.message}`);
		}
	}

	return { updated, failures };
}

export async function refreshOrderShipments(reference: string, budgetMs = 15_000) {
	const shipments = await prisma.shipment.findMany({
		where: { order: { reference }, status: { notIn: FINAL_STATUSES } },
		select: shipmentSelect
	});

	return refreshMany(shipments, Date.now() + budgetMs);
}

export async function runTrackingQueue(budgetMs: number) {
	const shipments = await prisma.shipment.findMany({
		where: { status: { notIn: FINAL_STATUSES } },
		orderBy: { lastTrackedAt: { sort: 'asc', nulls: 'first' } },
		take: 200,
		select: shipmentSelect
	});

	return refreshMany(shipments, Date.now() + budgetMs);
}
