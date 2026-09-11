import { page } from '$app/state';

export function stickyParam(name: string) {
	let last = page.params[name] ?? '';

	return () => {
		const current = page.params[name];

		if (current) {
			last = current;
		}

		return last;
	};
}
