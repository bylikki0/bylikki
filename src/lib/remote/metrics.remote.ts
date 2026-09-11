import { command, getRequestEvent } from '$app/server';
import { countEvent } from '$lib/server/database/metrics';
import { hashClientAddress } from '$lib/server/security/hash';
import { consumeRateLimit } from '$lib/server/security/rate-limit';

export const trackCartAdd = command(async () => {
	const quota = await consumeRateLimit({
		bucket: 'metric-cart-add',
		subject: hashClientAddress(getRequestEvent()),
		limit: 200
	});

	if (quota.allowed) {
		await countEvent('cart_add');
	}

	return { counted: quota.allowed };
});
