import { invalid } from '@sveltejs/kit';
import { form, getRequestEvent } from '$app/server';
import { trackingSchema } from '$lib/client/validation/tracking';
import { findPublicOrder } from '$lib/server/database/tracking';
import { hashClientAddress } from '$lib/server/security/hash';
import { consumeRateLimit } from '$lib/server/security/rate-limit';

export const trackOrder = form(trackingSchema, async ({ reference, email }, issue) => {
	const quota = await consumeRateLimit({
		bucket: 'order-tracking',
		subject: hashClientAddress(getRequestEvent()),
		limit: 20
	});

	if (!quota.allowed) {
		invalid(issue.reference('Trop de recherches. Reviens dans une heure.'));
	}

	const order = await findPublicOrder(reference, email);

	if (!order) {
		invalid(
			issue.reference('Aucune commande ne correspond à cette référence et à cette adresse e-mail.')
		);
	}

	return { order };
});
