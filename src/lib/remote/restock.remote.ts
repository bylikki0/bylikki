import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { command, query } from '$app/server';
import {
	cancelRestockAlert,
	listAlertedVariantIds,
	requestRestockAlert
} from '$lib/server/database/restock';
import { listConsents } from '$lib/server/database/user';
import { getSessionUser, requireUser } from '$lib/server/security/guard';

const variantSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(80));

export const getMyRestockAlerts = query(async () => {
	const user = getSessionUser();

	if (!user) {
		return [] as string[];
	}

	const alerts = await listAlertedVariantIds(user.id);

	return alerts.map((alert) => alert.variantId);
});

export const watchVariant = command(variantSchema, async (variantId) => {
	const user = requireUser();
	const consents = await listConsents(user.id);
	const granted = consents.some((consent) => consent.type === 'RESTOCK_ALERT' && consent.granted);

	if (!granted) {
		error(
			409,
			'Active « Retour en stock » dans les préférences de ton compte pour recevoir cette alerte.'
		);
	}

	await requestRestockAlert(user.id, variantId);
	await getMyRestockAlerts().refresh();

	return { watching: true };
});

export const unwatchVariant = command(variantSchema, async (variantId) => {
	const user = requireUser();
	await cancelRestockAlert(user.id, variantId);
	await getMyRestockAlerts().refresh();

	return { watching: false };
});
