import { createId } from '@paralleldrive/cuid2';

export function generateOrderReference(now = new Date()) {
	const year = now.getFullYear().toString().slice(-2);
	const suffix = createId().slice(0, 6).toUpperCase();

	return `BY-${year}${suffix}`;
}
