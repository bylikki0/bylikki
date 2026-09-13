import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { CarrierCode } from '$lib/client/validation/shipping';
import type { CarrierAdapter } from '../types';
import { createChronopost } from './chronopost';
import { createColissimo } from './colissimo';
import { createDemoCarrier } from './demo';
import { createLaPoste } from './laposte';
import { createMondialRelay } from './mondial-relay';

export type CarrierMode = 'live' | 'demo' | 'off';

function liveAdapter(carrier: CarrierCode): CarrierAdapter | null {
	switch (carrier) {
		case 'MONDIAL_RELAY':
			return env.MONDIAL_RELAY_ENSEIGNE &&
				env.MONDIAL_RELAY_PRIVATE_KEY &&
				env.MONDIAL_RELAY_LOGIN &&
				env.MONDIAL_RELAY_PASSWORD
				? createMondialRelay({
						enseigne: env.MONDIAL_RELAY_ENSEIGNE,
						privateKey: env.MONDIAL_RELAY_PRIVATE_KEY,
						login: env.MONDIAL_RELAY_LOGIN,
						password: env.MONDIAL_RELAY_PASSWORD
					})
				: null;
		case 'COLISSIMO':
			return env.COLISSIMO_CONTRACT && env.COLISSIMO_PASSWORD
				? createColissimo({
						contractNumber: env.COLISSIMO_CONTRACT,
						password: env.COLISSIMO_PASSWORD,
						okapiKey: env.LAPOSTE_OKAPI_KEY
					})
				: null;
		case 'CHRONOPOST':
			return env.CHRONOPOST_ACCOUNT && env.CHRONOPOST_PASSWORD
				? createChronopost({
						accountNumber: env.CHRONOPOST_ACCOUNT,
						password: env.CHRONOPOST_PASSWORD,
						okapiKey: env.LAPOSTE_OKAPI_KEY
					})
				: null;
		case 'LA_POSTE':
			return env.LAPOSTE_OKAPI_KEY ? createLaPoste({ okapiKey: env.LAPOSTE_OKAPI_KEY }) : null;
	}
}

const demoAllowed = () => dev || env.SHIPPING_DEMO === 'true';

export function carrierMode(carrier: CarrierCode): CarrierMode {
	if (liveAdapter(carrier)) {
		return 'live';
	}

	return demoAllowed() ? 'demo' : 'off';
}

export function carrierFor(carrier: CarrierCode): CarrierAdapter | null {
	return liveAdapter(carrier) ?? (demoAllowed() ? createDemoCarrier(carrier) : null);
}
