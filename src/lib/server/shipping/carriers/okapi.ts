import type { ShipmentStatusCode } from '$lib/client/validation/shipping';
import { carrierRequest } from '../http';
import { CarrierError, type FetchLike, type TrackingUpdate } from '../types';

const SUIVI_URL = 'https://api.laposte.fr/suivi/v2/idships';

export function okapiStatus(code: string): ShipmentStatusCode {
	switch (code.slice(0, 2).toUpperCase()) {
		case 'DI':
			return 'DELIVERED';
		case 'AG':
			return 'AVAILABLE_AT_PICKUP';
		case 'MD':
			return 'OUT_FOR_DELIVERY';
		case 'RE':
			return 'RETURNED';
		case 'ND':
			return 'EXCEPTION';
		case 'DR':
			return 'LABEL_CREATED';
		default:
			return 'IN_TRANSIT';
	}
}

type OkapiPayload = {
	shipment?: { event?: { code?: string; label?: string; date?: string }[] };
};

export function createOkapiTracker(config: { apiKey: string | undefined; fetch?: FetchLike }) {
	const fetcher = config.fetch ?? fetch;

	return async function track(trackingNumber: string): Promise<TrackingUpdate> {
		if (!config.apiKey) {
			throw new CarrierError('La clé Okapi de La Poste est absente : le suivi est indisponible.');
		}

		const response = await carrierRequest(
			fetcher,
			'Le suivi La Poste',
			`${SUIVI_URL}/${encodeURIComponent(trackingNumber)}?lang=fr_FR`,
			{ headers: { Accept: 'application/json', 'X-Okapi-Key': config.apiKey } },
			[404]
		);

		if (response.status === 404) {
			return { status: 'LABEL_CREATED', event: null };
		}

		const payload = (await response.json()) as OkapiPayload;
		const events = [...(payload.shipment?.event ?? [])].sort((left, right) =>
			(right.date ?? '').localeCompare(left.date ?? '')
		);
		const latest = events[0];

		return latest
			? { status: okapiStatus(latest.code ?? ''), event: latest.label ?? null }
			: { status: 'LABEL_CREATED', event: null };
	};
}
