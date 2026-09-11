import { revokeNewsletterConsent } from '$lib/server/database/newsletter';
import { verifyUnsubscribe } from '$lib/server/security/hash';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const userId = url.searchParams.get('u') ?? '';
	const signature = url.searchParams.get('s') ?? '';

	if (!userId || !signature || !verifyUnsubscribe(userId, signature)) {
		return { status: 'invalid' as const };
	}

	await revokeNewsletterConsent(userId);

	return { status: 'done' as const };
};
