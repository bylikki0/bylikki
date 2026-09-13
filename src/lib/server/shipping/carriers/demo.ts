import { randomBytes } from 'node:crypto';
import {
	carrierLabels,
	SHIPPING_METHODS,
	type CarrierCode,
	type ShipmentStatusCode
} from '$lib/client/validation/shipping';
import type { CarrierAdapter, RelayPoint } from '../types';

const RELAY_NAMES = [
	'Mercerie des Lilas',
	'Librairie du Marché',
	'Tabac Presse de la Gare',
	'Fleuriste Pétale',
	'Épicerie du Coin'
];

const STREETS = [
	'rue des Tanneurs',
	'place du Marché',
	'avenue de la Gare',
	'rue Paul Bert',
	'quai de la Fosse'
];

export function specimenPdf(lines: string[]) {
	const ascii = (value: string) =>
		value
			.normalize('NFD')
			.replace(/\p{M}/gu, '')
			.replace(/[^ -~]/g, '?')
			.replace(/([()\\])/g, '\\$1');
	const content = [
		'BT',
		'/F1 12 Tf',
		'24 390 Td',
		'18 TL',
		...lines.map((line, index) => `${index === 0 ? '' : 'T* '}(${ascii(line)}) Tj`),
		'ET'
	].join('\n');
	const objects = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 283 425] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
		`<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
	];

	let pdf = '%PDF-1.4\n';
	const offsets: number[] = [];

	objects.forEach((object, index) => {
		offsets.push(pdf.length);
		pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
	});

	const xrefOffset = pdf.length;

	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
	pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

	return new TextEncoder().encode(pdf);
}

const PROGRESSION: Record<'home' | 'relay', ShipmentStatusCode[]> = {
	home: ['LABEL_CREATED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'],
	relay: ['LABEL_CREATED', 'IN_TRANSIT', 'AVAILABLE_AT_PICKUP', 'DELIVERED']
};

export function nextDemoStatus(current: ShipmentStatusCode, delivery: 'home' | 'relay') {
	const steps = PROGRESSION[delivery];
	const index = steps.indexOf(current);

	return index === -1 ? current : (steps[Math.min(index + 1, steps.length - 1)] ?? current);
}

export function createDemoCarrier(carrier: CarrierCode): CarrierAdapter {
	return {
		carrier,
		demo: true,

		async searchRelays({ postalCode, country }): Promise<RelayPoint[]> {
			return RELAY_NAMES.map((name, index) => ({
				id: `DEMO${index + 1}${postalCode}`,
				name,
				line1: `${(index + 1) * 7} ${STREETS[index]}`,
				postalCode,
				city: 'Ville de démonstration',
				country,
				hours: ['Lundi au samedi 09:00–19:00'],
				distanceMeters: 250 + index * 400
			}));
		},

		async createLabel(request) {
			const trackingNumber = `DEMO${carrier.slice(0, 2)}${randomBytes(5).toString('hex').toUpperCase()}`;
			const method = SHIPPING_METHODS[request.method];

			return {
				trackingNumber,
				pdf: specimenPdf([
					'SPECIMEN - etiquette de demonstration',
					`${carrierLabels[carrier]} - ${method.name}`,
					`Suivi : ${trackingNumber}`,
					`Commande : ${request.reference}`,
					request.direction === 'RETURN' ? 'Retour vers la boutique' : 'Envoi vers la cliente',
					`Destinataire : ${request.recipient.name}`,
					`${request.recipient.postalCode} ${request.recipient.city}`,
					`Poids : ${request.weightGrams} g`
				])
			};
		},

		async track({ currentStatus, delivery }) {
			const status = nextDemoStatus(currentStatus, delivery);

			return { status, event: `Démonstration : ${status.toLowerCase().replaceAll('_', ' ')}` };
		}
	};
}
