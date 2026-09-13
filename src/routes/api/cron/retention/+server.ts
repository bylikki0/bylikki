import { json, type RequestHandler } from '@sveltejs/kit';
import { authorizeCron, publicOrigin } from '$lib/server/security/cron';
import { runRetentionPurge } from '$lib/server/utils/retention';
import { sendReviewReminders } from '$lib/server/utils/review-reminder';

const purge: RequestHandler = async ({ request, url }) => {
	authorizeCron(request);

	const purged = await runRetentionPurge();
	const reviewReminders = await sendReviewReminders(publicOrigin(url));

	return json({ ...purged, rappelsAvis: reviewReminders });
};

export const GET = purge;
export const POST = purge;
