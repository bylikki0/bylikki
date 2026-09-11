import { error } from '@sveltejs/kit';
import { findProductIdBySlug } from '$lib/server/database/product';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const product = await findProductIdBySlug(params.slug);

	if (!product) {
		error(404, "Cette création n'existe pas ou n'est plus en ligne.");
	}

	return { slug: product.slug };
};
