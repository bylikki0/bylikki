import { CarrierError, type CarrierAdapter, type FetchLike } from '../types';
import { createOkapiTracker } from './okapi';

export function createLaPoste(config: { okapiKey: string; fetch?: FetchLike }): CarrierAdapter {
	const trackWithOkapi = createOkapiTracker({ apiKey: config.okapiKey, fetch: config.fetch });

	return {
		carrier: 'LA_POSTE',
		demo: false,

		async searchRelays() {
			return [];
		},

		async createLabel() {
			throw new CarrierError(
				'La lettre suivie s’affranchit depuis l’espace La Poste : saisis ensuite son numéro à la main.'
			);
		},

		track: ({ trackingNumber }) => trackWithOkapi(trackingNumber)
	};
}
