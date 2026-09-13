import { fail } from '@sveltejs/kit';
import { revokeNewsletterConsent, userExists } from '$lib/server/database/newsletter';
import { verifyUnsubscribe } from '$lib/server/security/hash';
import type { Actions, PageServerLoad } from './$types';

function readLink(source: URLSearchParams | FormData) {
	const userId = String(source.get('u') ?? '');
	const signature = String(source.get('s') ?? '');

	return userId && signature && verifyUnsubscribe(userId, signature) ? { userId, signature } : null;
}

export const load: PageServerLoad = ({ url }) => {
	const link = readLink(url.searchParams);

	return link ? { status: 'confirm' as const, ...link } : { status: 'invalid' as const };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const link = readLink(await request.formData());

		if (!link) {
			return fail(400, { done: false });
		}

		if (await userExists(link.userId)) {
			await revokeNewsletterConsent(link.userId);
		}

		return { done: true };
	}
};
