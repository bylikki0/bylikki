import { redirect } from '@sveltejs/kit';
import { OTP_TTL_MINUTES, readPendingEmail } from '$lib/server/security/otp';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies }) => {
	const email = readPendingEmail(cookies);

	if (!email) {
		throw redirect(303, '/sign');
	}

	return { email, ttlMinutes: OTP_TTL_MINUTES };
};
