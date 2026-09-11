import { getSiteSettings } from '$lib/server/database/settings';
import { listWishlistProductIds } from '$lib/server/database/wishlist';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const [settings, wishlist] = await Promise.all([
		getSiteSettings(),
		locals.user ? listWishlistProductIds(locals.user.id) : Promise.resolve([])
	]);

	return {
		signedIn: locals.user !== null,
		wishlist: wishlist.map((item) => item.productId),
		isAdmin: locals.user?.role === 'ADMIN',
		announcement: settings.announcement,
		vacation: settings.vacation,
		shipping: settings.shipping
	};
};
