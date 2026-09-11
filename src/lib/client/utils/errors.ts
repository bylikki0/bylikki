import { dev } from '$app/environment';

export function toMessage(error: unknown, fallback: string) {
	if (error && typeof error === 'object' && 'body' in error) {
		const body = (error as { body?: { message?: unknown } }).body;

		if (body && typeof body.message === 'string' && body.message !== '') {
			return body.message;
		}
	}

	if (dev && error instanceof Error && error.message !== '') {
		return `${fallback} (${error.message})`;
	}

	return fallback;
}
