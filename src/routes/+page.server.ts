import { getSetting } from '$lib/server/database/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ home: await getSetting('home') });
