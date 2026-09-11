import { resolve } from '$app/paths';
import type { LinkTarget } from '$lib/client/validation/settings';

export function targetHref(target: LinkTarget) {
	switch (target.kind) {
		case 'category':
			return resolve(`/search?category=${encodeURIComponent(target.slug)}`);
		case 'search':
			return target.query
				? resolve(`/search?query=${encodeURIComponent(target.query)}`)
				: resolve('/search');
		case 'product':
			return resolve('/[slug]', { slug: target.slug });
		case 'atelier':
			return resolve('/atelier');
		case 'none':
			return null;
	}
}
