import type { Config } from '@sveltejs/adapter-vercel';
import { json, type RequestHandler } from '@sveltejs/kit';
import { authorizeCron, publicOrigin } from '$lib/server/security/cron';
import { runNewsletterQueue } from '$lib/server/utils/newsletter-mail';

export const config: Config = { maxDuration: 60 };

const QUEUE_BUDGET_MS = 45_000;

const drain: RequestHandler = async ({ request, url }) => {
	authorizeCron(request);

	return json(await runNewsletterQueue(publicOrigin(url), QUEUE_BUDGET_MS));
};

export const GET = drain;
export const POST = drain;
