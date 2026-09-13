export const WEEK_DAYS = [
	'Lundi',
	'Mardi',
	'Mercredi',
	'Jeudi',
	'Vendredi',
	'Samedi',
	'Dimanche'
] as const;

const toClock = (value: string) =>
	/^\d{4}$/.test(value) ? `${value.slice(0, 2)}:${value.slice(2)}` : value;

export function formatSlots(day: string, slots: string[]) {
	const ranges: string[] = [];

	for (let index = 0; index + 1 < slots.length; index += 2) {
		const open = slots[index] ?? '';
		const close = slots[index + 1] ?? '';

		if (open && close && open !== '0000' && close !== '0000') {
			ranges.push(`${toClock(open)}–${toClock(close)}`);
		}
	}

	return ranges.length > 0 ? `${day} ${ranges.join(', ')}` : null;
}
