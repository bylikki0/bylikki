const formatter = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	minimumFractionDigits: 2
});

export function formatPrice(cents: number) {
	return formatter.format(cents / 100);
}

export function formatPriceRange(minCents: number, maxCents: number) {
	return minCents === maxCents ? formatPrice(minCents) : `dès ${formatPrice(minCents)}`;
}

export function toCents(value: string | number | null | undefined) {
	const parsed =
		typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').replace(',', '.'));

	return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function toInteger(value: string | number | null | undefined) {
	const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);

	return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}
