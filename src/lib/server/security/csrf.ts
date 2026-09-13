const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const FORM_CONTENT_TYPES = [
	'application/x-www-form-urlencoded',
	'multipart/form-data',
	'text/plain'
];

export const CSRF_EXEMPT_PATHS = ['/api/newsletter/desinscription'];

export function isCrossSiteFormSubmission(request: {
	method: string;
	contentType: string | null;
	origin: string | null;
	pathname: string;
	ownOrigin: string;
}) {
	if (!UNSAFE_METHODS.includes(request.method.toUpperCase())) {
		return false;
	}

	const type = request.contentType?.split(';', 1)[0]?.trim().toLowerCase() ?? '';

	if (!FORM_CONTENT_TYPES.includes(type) || CSRF_EXEMPT_PATHS.includes(request.pathname)) {
		return false;
	}

	return request.origin !== request.ownOrigin;
}
