import { SHIPPING_METHODS } from '$lib/client/validation/shipping';
import { carrierRequest, formatShippingDate, splitMultipart } from '../http';
import {
	CarrierError,
	type CarrierAdapter,
	type FetchLike,
	type LabelRequest,
	type RelayPoint
} from '../types';
import { WEEK_DAYS } from './hours';
import { createOkapiTracker } from './okapi';

export type ColissimoConfig = {
	contractNumber: string;
	password: string;
	okapiKey?: string;
	fetch?: FetchLike;
};

const RELAY_URL =
	'https://ws.colissimo.fr/pointretrait-ws-cxf/rest/v2/pointretrait/findRDVPointRetraitAcheminement';
const LABEL_URL = 'https://ws.colissimo.fr/sls-ws/SlsServiceWSRest/2.0/generateLabel';
const NAME = 'Colissimo';

type ColissimoPoint = {
	identifiant?: string;
	nom?: string;
	adresse1?: string;
	codePostal?: string;
	localite?: string;
	codePays?: string;
	distanceEnMetre?: number | string;
	typeDePoint?: string;
} & Record<string, unknown>;

const HOUR_KEYS = WEEK_DAYS.map((day) => `horairesOuverture${day}`);

export function encodeColissimoRelayId(type: string, identifier: string) {
	return `${type}|${identifier}`;
}

export function decodeColissimoRelayId(relayId: string) {
	const [type, identifier] = relayId.split('|');

	return { type: type ?? '', identifier: identifier ?? '' };
}

export function parseColissimoPoints(payload: {
	errorCode?: number;
	errorMessage?: string;
	listePointRetraitAcheminement?: ColissimoPoint[];
}): RelayPoint[] {
	if (payload.errorCode !== undefined && payload.errorCode !== 0) {
		throw new CarrierError(
			`${NAME} n’a pas pu chercher de points retrait : ${payload.errorMessage ?? `code ${payload.errorCode}`}.`
		);
	}

	return (payload.listePointRetraitAcheminement ?? []).map((point) => {
		const distance = Number(point.distanceEnMetre);

		return {
			id: encodeColissimoRelayId(point.typeDePoint ?? '', point.identifiant ?? ''),
			name: point.nom ?? '',
			line1: point.adresse1 ?? '',
			postalCode: point.codePostal ?? '',
			city: point.localite ?? '',
			country: point.codePays ?? '',
			hours: HOUR_KEYS.flatMap((key, index) => {
				const slots = String(point[key] ?? '')
					.split(' ')
					.filter((slot) => slot && slot !== '00:00-00:00');

				return slots.length > 0 ? [`${WEEK_DAYS[index]} ${slots.join(', ')}`] : [];
			}),
			distanceMeters: Number.isFinite(distance) && distance > 0 ? distance : null
		};
	});
}

export function colissimoProductCode(request: LabelRequest) {
	if (request.direction === 'RETURN') {
		return request.sender.country === 'FR' ? 'CORE' : 'CORI';
	}

	if (SHIPPING_METHODS[request.method].delivery === 'relay') {
		return decodeColissimoRelayId(request.relayPointId ?? '').type || 'A2P';
	}

	return request.recipient.country === 'FR' ? 'DOM' : 'COLI';
}

export function buildColissimoLabelRequest(
	config: ColissimoConfig,
	request: LabelRequest,
	now = new Date()
) {
	const relay =
		request.direction === 'OUTBOUND' && SHIPPING_METHODS[request.method].delivery === 'relay'
			? decodeColissimoRelayId(request.relayPointId ?? '').identifier
			: null;

	return {
		contractNumber: config.contractNumber,
		password: config.password,
		outputFormat: { x: 0, y: 0, outputPrintingType: 'PDF_10x15_300dpi' },
		letter: {
			service: {
				productCode: colissimoProductCode(request),
				depositDate: now.toISOString().slice(0, 10),
				orderNumber: request.reference,
				commercialName: request.sender.name
			},
			parcel: {
				weight: (Math.max(1, request.weightGrams) / 1000).toFixed(2),
				...(relay ? { pickupLocationId: relay } : {})
			},
			sender: {
				senderParcelRef: request.reference,
				address: {
					companyName: request.sender.name,
					line2: request.sender.line1,
					line3: request.sender.line2 ?? '',
					countryCode: request.sender.country,
					city: request.sender.city,
					zipCode: request.sender.postalCode,
					email: request.sender.email ?? '',
					phoneNumber: request.sender.phone ?? ''
				}
			},
			addressee: {
				addresseeParcelRef: request.reference,
				address: {
					lastName: request.recipient.name,
					line2: request.recipient.line1,
					line3: request.recipient.line2 ?? '',
					countryCode: request.recipient.country,
					city: request.recipient.city,
					zipCode: request.recipient.postalCode,
					email: request.recipient.email ?? '',
					mobileNumber: request.recipient.phone ?? ''
				}
			}
		}
	};
}

type LabelJson = {
	messages?: { type?: string; messageContent?: string }[];
	labelV2Response?: { parcelNumber?: string };
};

export function parseColissimoLabel(bytes: Uint8Array, contentType: string) {
	const parts = splitMultipart(bytes, contentType);
	const jsonPart = parts.find((part) => part.headers.includes('json'));
	const pdfPart = parts.find(
		(part) => Buffer.from(part.body.subarray(0, 5)).toString('latin1') === '%PDF-'
	);
	const json = jsonPart
		? (JSON.parse(Buffer.from(jsonPart.body).toString('utf8')) as LabelJson)
		: {};
	const problem = json.messages?.find((message) => message.type === 'ERROR');

	if (problem) {
		throw new CarrierError(
			`${NAME} a refusé l’étiquette : ${problem.messageContent ?? 'erreur inconnue'}.`
		);
	}

	const trackingNumber = json.labelV2Response?.parcelNumber;

	if (!trackingNumber || !pdfPart) {
		throw new CarrierError(`${NAME} n’a renvoyé ni numéro de colis ni étiquette.`);
	}

	return { trackingNumber, pdf: pdfPart.body };
}

export function createColissimo(config: ColissimoConfig): CarrierAdapter {
	const fetcher = config.fetch ?? fetch;
	const trackWithOkapi = createOkapiTracker({ apiKey: config.okapiKey, fetch: fetcher });

	return {
		carrier: 'COLISSIMO',
		demo: false,

		async searchRelays({ postalCode, country }) {
			const response = await carrierRequest(fetcher, NAME, RELAY_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({
					accountNumber: config.contractNumber,
					password: config.password,
					address: '',
					zipCode: postalCode,
					city: '',
					countryCode: country,
					weight: '500',
					shippingDate: formatShippingDate(new Date()),
					filterRelay: '1',
					requestId: String(Date.now()),
					lang: 'FR',
					optionInter: country === 'FR' ? '0' : '1'
				})
			});

			return parseColissimoPoints(await response.json());
		},

		async createLabel(request) {
			const response = await carrierRequest(fetcher, NAME, LABEL_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(buildColissimoLabelRequest(config, request))
			});

			return parseColissimoLabel(
				new Uint8Array(await response.arrayBuffer()),
				response.headers.get('content-type') ?? ''
			);
		},

		track: ({ trackingNumber }) => trackWithOkapi(trackingNumber)
	};
}
