import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { isCrossSiteFormSubmission } from '$lib/server/security/csrf';
import { resolveSession } from '$lib/server/security/session';
import { checkEnvironment } from '$lib/server/utils/env';

checkEnvironment();

export const handle: Handle = async ({ event, resolve }) => {
	if (
		!dev &&
		isCrossSiteFormSubmission({
			method: event.request.method,
			contentType: event.request.headers.get('content-type'),
			origin: event.request.headers.get('origin'),
			pathname: event.url.pathname,
			ownOrigin: event.url.origin
		})
	) {
		return new Response(`Cross-site ${event.request.method} form submissions are forbidden`, {
			status: 403
		});
	}

	const session = await resolveSession(event);

	event.locals.session = session ? { id: session.id, expiresAt: session.expiresAt } : null;
	event.locals.user = session
		? {
				id: session.user.id,
				email: session.user.email,
				role: session.user.role,
				displayName: session.user.displayName
			}
		: null;

	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

	if (!dev) {
		response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
	}

	return response;
};
