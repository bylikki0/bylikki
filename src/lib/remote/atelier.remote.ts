import { error } from '@sveltejs/kit';
import { command, getRequestEvent, query } from '$app/server';
import { designSchema, shareTokenSchema } from '$lib/client/validation/atelier';
import {
	findDesignByToken,
	listComponents,
	priceDesign,
	saveDesign
} from '$lib/server/database/design';
import { getSessionUser } from '$lib/server/security/guard';
import { hashClientAddress } from '$lib/server/security/hash';
import { consumeRateLimit } from '$lib/server/security/rate-limit';

export const getComponents = query(async () => listComponents());

export const priceMyDesign = query(designSchema, async ({ slots, claspKey }) =>
	priceDesign(slots, claspKey)
);

export const storeDesign = command(designSchema, async ({ slots, claspKey }) => {
	const user = getSessionUser();

	const quota = await consumeRateLimit({
		bucket: 'design-save',
		subject: user?.id ?? hashClientAddress(getRequestEvent()),
		limit: 60
	});

	if (!quota.allowed) {
		error(429, 'Trop de créations enregistrées coup sur coup. Reviens dans une heure.');
	}

	const priced = await priceDesign(slots, claspKey);

	if (priced.issues.length > 0) {
		return { status: 'invalid' as const, issues: priced.issues };
	}

	const design = await saveDesign({ userId: user?.id ?? null, slots, claspKey, priced });

	return { status: 'saved' as const, design };
});

export const getSharedDesign = query(shareTokenSchema, async (shareToken) => {
	const design = await findDesignByToken(shareToken);

	if (!design) {
		error(404, "Cette création n'existe pas ou plus.");
	}

	return design;
});
