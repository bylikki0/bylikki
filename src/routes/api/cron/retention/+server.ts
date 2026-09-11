import { error, json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { safeEqual } from '$lib/server/security/hash';
import { runRetentionPurge } from '$lib/server/utils/retention';
import { sendReviewReminders } from '$lib/server/utils/review-reminder';

const purge: RequestHandler = async ({ request, url }) => {
	const expected = env.CRON_SECRET;

	if (!expected) {
		error(503, "La tâche planifiée n'est pas configurée.");
	}

	const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';

	if (!safeEqual(provided, expected)) {
		error(401, 'Jeton invalide.');
	}

	const purged = await runRetentionPurge();
	const reviewReminders = await sendReviewReminders(env.PUBLIC_ORIGIN ?? url.origin);

	return json({ ...purged, rappelsAvis: reviewReminders });
};

export const GET = purge;
export const POST = purge;
