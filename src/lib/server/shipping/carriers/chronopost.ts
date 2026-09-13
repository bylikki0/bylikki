import { SHIPPING_METHODS } from '$lib/client/validation/shipping';
import {
	carrierRequest,
	formatShippingDate,
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
	type LabelRequest,
	type Party,
	type RelayPoint
} from '../types';
import { createOkapiTracker } from './okapi';

export type ChronopostConfig = {
	accountNumber: string;
	password: string;
	okapiKey?: string;
	fetch?: FetchLike;
};

const RELAY_URL = 'https://ws.chronopost.fr/recherchebt-ws-cxf/PointRelaisServiceWS';
const RELAY_NAMESPACE = 'http://cxf.rechercheBt.soap.chronopost.fr/';
const SHIPPING_URL = 'https://ws.chronopost.fr/shipping-cxf/ShippingServiceWS';
const SHIPPING_NAMESPACE = 'http://cxf.shipping.soap.chronopost.fr/';
const NAME = 'Chronopost';

export function chronopostProductCode(request: LabelRequest) {
	if (request.direction === 'RETURN') {
		return '4T';
	}

	return SHIPPING_METHODS[request.method].delivery === 'relay' ? '86' : '01';
}

export function parseChronopostPoints(parsed: unknown): RelayPoint[] {
	const result = pick(
		parsed,
		'Envelope',
		'Body',
		'recherchePointChronopostInterResponse',
		'return'
	);
	const errorCode = textOf(pick(result, 'errorCode'));

	if (errorCode !== '' && errorCode !== '0') {
		throw new CarrierError(
			`${NAME} n’a pas pu chercher de relais : ${textOf(pick(result, 'errorMessage')) || `code ${errorCode}`}.`
		);
	}

	return listOf(pick(result, 'listePointRelais')).map((point) => {
		const distance = Number(textOf(pick(point, 'distanceEnMetre')));

		return {
			id: textOf(pick(point, 'identifiant')),
			name: textOf(pick(point, 'nom')),
			line1: textOf(pick(point, 'adresse1')),
			postalCode: textOf(pick(point, 'codePostal')),
			city: textOf(pick(point, 'localite')),
			country: textOf(pick(point, 'codePays')),
			hours: listOf(pick(point, 'listeHoraireOuverture'))
				.map((slot) => textOf(pick(slot, 'horairesAsString')))
				.filter(Boolean),
			distanceMeters: Number.isFinite(distance) && distance > 0 ? distance : null
		};
	});
}

function partyFields(prefix: 'shipper' | 'customer' | 'recipient', party: Party) {
	return {
		[`${prefix}Adress1`]: party.line1,
		[`${prefix}Adress2`]: party.line2 ?? '',
		[`${prefix}City`]: party.city,
		[`${prefix}Civility`]: 'M',
		[`${prefix}ContactName`]: party.name,
		[`${prefix}Country`]: party.country,
		[`${prefix}Email`]: party.email ?? '',
		[`${prefix}Name`]: party.name,
		[`${prefix}Name2`]: '',
		[`${prefix}Phone`]: party.phone ?? '',
		[`${prefix}PreAlert`]: 0,
		[`${prefix}ZipCode`]: party.postalCode
	};
}

export function buildChronopostShipping(
	config: ChronopostConfig,
	request: LabelRequest,
	now = new Date()
) {
	return soapEnvelope(
		SHIPPING_NAMESPACE,
		'shippingMultiParcelV5',
		xmlTree({
			headerValue: {
				accountNumber: config.accountNumber,
				idEmit: 'CHRFR',
				identWebPro: '',
				subAccount: ''
			},
			shipperValue: { ...partyFields('shipper', request.sender), shipperType: 1 },
			customerValue: { ...partyFields('customer', request.sender), customerType: 1 },
			recipientValue: { ...partyFields('recipient', request.recipient), recipientType: 2 },
			refValue: {
				shipperRef: request.reference,
				recipientRef:
					request.direction === 'OUTBOUND' && request.relayPointId
						? request.relayPointId
						: request.reference,
				customerSkybillNumber: ''
			},
			skybillValue: {
				bulkNumber: 1,
				codCurrency: 'EUR',
				codValue: 0,
				evtCode: 'DC',
				insuredValue: 0,
				objectType: 'MAR',
				productCode: chronopostProductCode(request),
				service: '0',
				shipDate: now.toISOString(),
				shipHour: now.getHours(),
				weight: (Math.max(1, request.weightGrams) / 1000).toFixed(2),
				weightUnit: 'KGM',
				height: 0,
				length: 0,
				width: 0
			},
			skybillParamsValue: { mode: 'PDF', withReservation: 0 },
			password: config.password,
			modeRetour: '2',
			numberOfParcel: 1,
			version: '2.0',
			multiParcel: 'N'
		}),
		false
	);
}

export function parseChronopostShipping(parsed: unknown) {
	const result = pick(parsed, 'Envelope', 'Body', 'shippingMultiParcelV5Response', 'return');
	const errorCode = textOf(pick(result, 'errorCode'));

	if (errorCode !== '0') {
		throw new CarrierError(
			`${NAME} a refusé l’étiquette : ${textOf(pick(result, 'errorMessage')) || `code ${errorCode || 'inconnu'}`}.`
		);
	}

	const value = listOf(pick(result, 'resultMultiParcelValue'))[0];
	const trackingNumber = textOf(pick(value, 'skybillNumber'));
	const pdf = textOf(pick(value, 'pdfEtiquette'));

	if (!trackingNumber || !pdf) {
		throw new CarrierError(`${NAME} n’a renvoyé ni numéro de colis ni étiquette.`);
	}

	return { trackingNumber, pdf: new Uint8Array(Buffer.from(pdf, 'base64')) };
}

export function createChronopost(config: ChronopostConfig): CarrierAdapter {
	const fetcher = config.fetch ?? fetch;
	const trackWithOkapi = createOkapiTracker({ apiKey: config.okapiKey, fetch: fetcher });

	return {
		carrier: 'CHRONOPOST',
		demo: false,

		async searchRelays({ postalCode, country }) {
			const response = await carrierRequest(fetcher, NAME, RELAY_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '""' },
				body: soapEnvelope(
					RELAY_NAMESPACE,
					'recherchePointChronopostInter',
					xmlTree({
						accountNumber: config.accountNumber,
						password: config.password,
						address: '',
						zipCode: postalCode,
						city: '',
						countryCode: country,
						type: 'P',
						productCode: '86',
						service: 'L',
						weight: '1',
						shippingDate: formatShippingDate(new Date()),
						maxPointChronopost: '10',
						maxDistanceSearch: '10',
						holidayTolerant: '1',
						language: 'FR',
						version: '2.0'
					}),
					false
				)
			});

			return parseChronopostPoints(parseXml(await response.text()));
		},

		async createLabel(request) {
			const response = await carrierRequest(fetcher, NAME, SHIPPING_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '""' },
				body: buildChronopostShipping(config, request)
			});

			return parseChronopostShipping(parseXml(await response.text()));
		},

		track: ({ trackingNumber }) => trackWithOkapi(trackingNumber)
	};
}
