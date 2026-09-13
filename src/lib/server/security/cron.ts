import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { safeEqual } from './hash';

export function authorizeCron(request: Request) {
	const expected = env.CRON_SECRET;

	if (!expected) {
		error(503, "La tâche planifiée n'est pas configurée.");
	}

	const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';

	if (!safeEqual(provided, expected)) {
		error(401, 'Jeton invalide.');
	}
}

export function publicOrigin(url: URL) {
	return env.PUBLIC_ORIGIN ?? url.origin;
}
