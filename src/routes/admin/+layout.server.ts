import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/sign');
	}

	if (locals.user.role !== 'ADMIN') {
		error(403, "Cet espace est reserve a l'administration de la boutique.");
	}

	return { admin: { email: locals.user.email } };
};
