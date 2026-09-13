import { offeredMethods, type ShippingSettings } from '$lib/client/validation/shipping';
import { carrierMode } from './carriers';

export function checkoutMethods(settings: ShippingSettings, country: string, subtotalCents: number) {
	return offeredMethods(settings, country, subtotalCents).filter(
		(method) => carrierMode(method.carrier) !== 'off'
	);
}
