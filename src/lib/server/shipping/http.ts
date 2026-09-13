import { XMLParser } from 'fast-xml-parser';
import { CarrierError, type FetchLike } from './types';

export const REQUEST_TIMEOUT_MS = 10_000;

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	removeNSPrefix: true,
	parseTagValue: false,
	parseAttributeValue: false,
	trimValues: true
});

export function escapeXml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export type XmlValue = string | number | null | undefined | XmlTree;
export type XmlTree = { [name: string]: XmlValue };

export function xmlTree(tree: XmlTree): string {
	return Object.entries(tree)
		.map(([name, value]) => {
			if (value !== null && typeof value === 'object') {
				return `<${name}>${xmlTree(value)}</${name}>`;
			}

			return `<${name}>${value === null || value === undefined ? '' : escapeXml(String(value))}</${name}>`;
		})
		.join('');
}

export function soapEnvelope(
	namespace: string,
	operation: string,
	body: string,
	qualified: boolean
) {
	const call = qualified
		? `<${operation} xmlns="${namespace}">${body}</${operation}>`
		: `<ns:${operation} xmlns:ns="${namespace}">${body}</ns:${operation}>`;

	return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>${call}</soap:Body></soap:Envelope>`;
}

export function parseXml(text: string): unknown {
	return parser.parse(text);
}

export function pick(value: unknown, ...keys: string[]): unknown {
	let current = value;

	for (const key of keys) {
		if (current === null || typeof current !== 'object') {
			return undefined;
		}

		current = (current as Record<string, unknown>)[key];
	}

	return current;
}

export function textOf(value: unknown): string {
	if (value === null || value === undefined) {
		return '';
	}

	if (typeof value === 'object') {
		return textOf((value as Record<string, unknown>)['#text']);
	}

	return String(value).trim();
}

export function listOf(value: unknown): unknown[] {
	if (value === null || value === undefined || value === '') {
		return [];
	}

	return Array.isArray(value) ? value : [value];
}

export async function carrierRequest(
	fetcher: FetchLike,
	carrierName: string,
	url: string,
	init: RequestInit,
	allowedStatuses: number[] = []
) {
	let response: Response;

	try {
		response = await fetcher(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
	} catch {
		throw new CarrierError(
			`${carrierName} ne répond pas pour le moment. Réessaie dans quelques minutes.`
		);
	}

	if (!response.ok && !allowedStatuses.includes(response.status)) {
		throw new CarrierError(`${carrierName} a refusé la demande (erreur ${response.status}).`);
	}

	return response;
}

export function splitMultipart(bytes: Uint8Array, contentType: string) {
	const boundary = /boundary="?([^";]+)"?/i.exec(contentType)?.[1];

	if (!boundary) {
		return [{ headers: contentType.toLowerCase(), body: bytes }];
	}

	const raw = Buffer.from(bytes).toString('latin1');

	return raw
		.split(`--${boundary}`)
		.map((part) => part.replace(/^\r?\n/, ''))
		.filter((part) => part.trim() !== '' && !part.startsWith('--'))
		.map((part) => {
			const separator = part.search(/\r?\n\r?\n/);
			const headers = separator === -1 ? '' : part.slice(0, separator);
			const body = separator === -1 ? part : part.slice(separator).replace(/^\r?\n\r?\n/, '');

			return {
				headers: headers.toLowerCase(),
				body: new Uint8Array(Buffer.from(body.replace(/\r?\n$/, ''), 'latin1'))
			};
		});
}

export function formatShippingDate(date: Date) {
	const pad = (value: number) => String(value).padStart(2, '0');

	return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}
