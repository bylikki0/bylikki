import type { RequestHandler } from '@sveltejs/kit';
import { revokeNewsletterConsent, userExists } from '$lib/server/database/newsletter';
import { verifyUnsubscribe } from '$lib/server/security/hash';

export const POST: RequestHandler = async ({ url }) => {
	const userId = url.searchParams.get('u') ?? '';
	const signature = url.searchParams.get('s') ?? '';

	if (!userId || !signature || !verifyUnsubscribe(userId, signature)) {
		return new Response('Lien de désinscription invalide.', { status: 400 });
	}

	if (await userExists(userId)) {
		await revokeNewsletterConsent(userId);
	}

	return new Response(null, { status: 200 });
};
