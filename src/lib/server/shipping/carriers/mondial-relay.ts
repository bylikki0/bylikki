import { createHash } from 'node:crypto';
import { SHIPPING_METHODS, type ShipmentStatusCode } from '$lib/client/validation/shipping';
import {
	carrierRequest,
	escapeXml,
	listOf,
	parseXml,
	pick,
	soapEnvelope,
	textOf,
	xmlTree
} from '../http';
import {
	CarrierError,
	type CarrierAdapter,
	type FetchLike,
	type Label,
	type LabelRequest,
	type Party,
	type RelayPoint
} from '../types';
import { formatSlots, WEEK_DAYS } from './hours';

export type MondialRelayConfig = {
	enseigne: string;
	privateKey: string;
	login: string;
	password: string;
	fetch?: FetchLike;
};

const API1_URL = 'https://api.mondialrelay.com/Web_Services.asmx';
const API2_URL = 'https://connect-api.mondialrelay.com/api/Shipment';
const NAMESPACE = 'http://www.mondialrelay.fr/webservice/';
const NAME = 'Mondial Relay';

export function mondialRelaySecurity(values: string[], privateKey: string) {
	return createHash('md5')
		.update(values.join('') + privateKey)
		.digest('hex')
		.toUpperCase();
}

export function buildApi1Envelope(
	operation: string,
	fields: [string, string][],
	privateKey: string
) {
	const security = mondialRelaySecurity(
		fields.map(([, value]) => value),
		privateKey
	);

	return soapEnvelope(
		NAMESPACE,
		operation,
		xmlTree(Object.fromEntries([...fields, ['Security', security]])),
		true
	);
}

export function parseRelayPoints(result: unknown): RelayPoint[] {
	const status = textOf(pick(result, 'STAT'));

	if (status !== '0') {
		throw new CarrierError(`${NAME} n’a pas pu chercher de points relais (code ${status}).`);
	}

	return listOf(pick(result, 'PointsRelais', 'PointRelais_Details')).map((point) => {
		const distance = Number(textOf(pick(point, 'Distance')));
		const hours = WEEK_DAYS.map((day) =>
			formatSlots(day, listOf(pick(point, `Horaires_${day}`, 'string')).map(textOf))
		).filter((entry): entry is string => entry !== null);

		return {
			id: textOf(pick(point, 'Num')),
			name: textOf(pick(point, 'LgAdr1')),
			line1: textOf(pick(point, 'LgAdr3')),
			postalCode: textOf(pick(point, 'CP')),
			city: textOf(pick(point, 'Ville')),
			country: textOf(pick(point, 'Pays')),
			hours,
			distanceMeters: Number.isFinite(distance) && distance > 0 ? distance : null
		};
	});
}

function addressXml(party: Party) {
	return xmlTree({
		Title: '',
		Firstname: '',
		Lastname: party.name,
		Streetname: party.line1,
		HouseNo: '',
		CountryCode: party.country,
		PostCode: party.postalCode,
		City: party.city,
		AddressAdd1: '',
		AddressAdd2: party.line2 ?? '',
		AddressAdd3: '',
		PhoneNo: party.phone ?? '',
		MobileNo: '',
		Email: party.email ?? ''
	});
}

export function buildShipmentRequest(config: MondialRelayConfig, request: LabelRequest) {
	const outbound = request.direction === 'OUTBOUND';
	const relayLocation =
		outbound && request.relayPointId ? `${request.recipient.country}-${request.relayPointId}` : '';
	const deliveryMode = outbound ? '24R' : 'LCC';
	const collectionMode = outbound ? 'CCC' : 'REL';
	const weight = Math.max(1, Math.round(request.weightGrams));
	const context = xmlTree({
		Login: config.login,
		Password: config.password,
		CustomerId: config.enseigne,
		Culture: 'fr-FR',
		VersionAPI: '1.0'
	});

	return [
		'<?xml version="1.0" encoding="utf-8"?>',
		'<ShipmentCreationRequest xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.example.org/Request">',
		`<Context>${context}</Context>`,
		'<OutputOptions><OutputFormat>10x15</OutputFormat><OutputType>PdfUrl</OutputType></OutputOptions>',
		'<ShipmentsList><Shipment>',
		`<OrderNo>${escapeXml(request.reference)}</OrderNo><CustomerNo></CustomerNo><ParcelCount>1</ParcelCount>`,
		`<DeliveryMode Mode="${deliveryMode}" Location="${escapeXml(relayLocation)}" />`,
		`<CollectionMode Mode="${collectionMode}" Location="" />`,
		`<Parcels><Parcel><Content>Bijoux et accessoires</Content><Weight Value="${weight}" Unit="gr" /></Parcel></Parcels>`,
		'<DeliveryInstruction></DeliveryInstruction>',
		`<Sender><Address>${addressXml(request.sender)}</Address></Sender>`,
		`<Recipient><Address>${addressXml(request.recipient)}</Address></Recipient>`,
		'</Shipment></ShipmentsList></ShipmentCreationRequest>'
	].join('');
}

export function parseShipmentResponse(parsed: unknown) {
	const response = pick(parsed, 'ShipmentCreationResponse');
	const problem = listOf(pick(response, 'StatusList', 'Status')).find(
		(status) => textOf(pick(status, '@_Level')).toLowerCase() === 'error'
	);

	if (problem) {
		throw new CarrierError(
			`${NAME} a refusé l’étiquette : ${textOf(pick(problem, '@_Message')) || 'erreur inconnue'}.`
		);
	}

	const shipment = pick(response, 'ShipmentsList', 'Shipment');
	const trackingNumber = textOf(pick(shipment, '@_ShipmentNumber'));
	const labelUrl = textOf(pick(shipment, 'LabelList', 'Label', 'Output'));

	if (!trackingNumber || !labelUrl) {
		throw new CarrierError(`${NAME} n’a renvoyé ni numéro d’expédition ni étiquette.`);
	}

	return { trackingNumber, labelUrl };
}

export function mondialRelayStatus(
	status: string,
	delivery: 'home' | 'relay',
	current: ShipmentStatusCode
): ShipmentStatusCode {
	switch (status) {
		case '82':
			return 'DELIVERED';
		case '81':
			return delivery === 'relay' ? 'AVAILABLE_AT_PICKUP' : 'OUT_FOR_DELIVERY';
		case '80':
			return 'IN_TRANSIT';
		case '83':
			return 'EXCEPTION';
		default:
			return current;
	}
}

export function createMondialRelay(config: MondialRelayConfig): CarrierAdapter {
	const fetcher = config.fetch ?? fetch;

	async function callApi1(operation: string, fields: [string, string][]) {
		const response = await carrierRequest(fetcher, NAME, API1_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/xml; charset=utf-8',
				SOAPAction: `"${NAMESPACE}${operation}"`
			},
			body: buildApi1Envelope(operation, fields, config.privateKey)
		});

		return pick(
			parseXml(await response.text()),
			'Envelope',
			'Body',
			`${operation}Response`,
			`${operation}Result`
		);
	}

	return {
		carrier: 'MONDIAL_RELAY',
		demo: false,

		async searchRelays({ postalCode, country }) {
			const result = await callApi1('WSI4_PointRelais_Recherche', [
				['Enseigne', config.enseigne],
				['Pays', country],
				['NumPointRelais', ''],
				['Ville', ''],
				['CP', postalCode],
				['Latitude', ''],
				['Longitude', ''],
				['Taille', ''],
				['Poids', ''],
				['Action', '24R'],
				['DelaiEnvoi', '0'],
				['RayonRecherche', ''],
				['TypeActivite', ''],
				['NACE', ''],
				['NombreResultats', '10']
			]);

			return parseRelayPoints(result);
		},

		async createLabel(request): Promise<Label> {
			if (SHIPPING_METHODS[request.method].carrier !== 'MONDIAL_RELAY') {
				throw new CarrierError(`${NAME} ne gère pas ce mode de livraison.`);
			}

			const response = await carrierRequest(fetcher, NAME, API2_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'text/xml; charset=utf-8', Accept: 'application/xml' },
				body: buildShipmentRequest(config, request)
			});
			const { trackingNumber, labelUrl } = parseShipmentResponse(parseXml(await response.text()));
			const pdf = await carrierRequest(fetcher, NAME, labelUrl, { method: 'GET' });

			return { trackingNumber, pdf: new Uint8Array(await pdf.arrayBuffer()) };
		},

		async track({ trackingNumber, currentStatus, delivery }) {
			const result = await callApi1('WSI2_TracingColisDetaille', [
				['Enseigne', config.enseigne],
				['Expedition', trackingNumber],
				['Langue', 'FR']
			]);

			return {
				status: mondialRelayStatus(textOf(pick(result, 'STAT')), delivery, currentStatus),
				event: textOf(pick(result, 'Libelle01')) || null
			};
		}
	};
}
