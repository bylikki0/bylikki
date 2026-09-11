export function normalizeText(input: string) {
	return input
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

export function slugify(input: string) {
	return normalizeText(input).replace(/\s+/g, '-');
}

export function buildSearchText(parts: (string | null | undefined)[]) {
	return normalizeText(parts.filter(Boolean).join(' '));
}
