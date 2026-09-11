import { listPendingAlerts, markAlertsNotified } from '../database/restock';
import RestockAlertEmail from '../emails/RestockAlert.svelte';
import { renderEmail, sendMailQuietly } from './mailer';

export async function notifyRestock(variantId: string, origin: string) {
	const alerts = await listPendingAlerts(variantId);

	if (alerts.length === 0) {
		return 0;
	}

	await markAlertsNotified(alerts.map((alert) => alert.id));

	for (const alert of alerts) {
		await sendMailQuietly({
			to: alert.user.email,
			subject: `${alert.variant.product.name} est de retour — Bylikki`,
			...renderEmail(RestockAlertEmail, {
				productName: alert.variant.product.name,
				variantLabel: alert.variant.label,
				slug: alert.variant.product.slug,
				origin
			})
		});
	}

	return alerts.length;
}
