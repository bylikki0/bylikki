import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import {
	issueDraftSchema,
	scheduleSchema,
	segmentSchema,
	type IssueDraft
} from '$lib/client/validation/newsletter';
import { listDiscounts } from '$lib/server/database/discount';
import {
	countAudience,
	deleteIssue,
	findIssueProducts,
	listIssues,
	saveIssueDraft,
	scheduleIssue as scheduleIssueRecord,
	startIssue,
	unscheduleIssue as unscheduleIssueRecord
} from '$lib/server/database/newsletter';
import { publicOrigin } from '$lib/server/security/cron';
import { requireAdmin } from '$lib/server/security/guard';
import { consumeRateLimit } from '$lib/server/security/rate-limit';
import { sendMail } from '$lib/server/utils/mailer';
import {
	composeNewsletter,
	processIssueBatch,
	renderNewsletter,
	type NewsletterSource
} from '$lib/server/utils/newsletter-mail';

const identifierSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(80));
const SEND_BUDGET_MS = 8_000;
const MIN_SCHEDULE_DELAY_MS = 60_000;

const origin = () => publicOrigin(getRequestEvent().url);

const toSource = (draft: IssueDraft): NewsletterSource => ({
	subject: draft.subject,
	preheader: draft.preheader,
	body: draft.body,
	heroImageUrl: draft.heroImageUrl || null,
	ctaLabel: draft.ctaLabel || null,
	ctaUrl: draft.ctaUrl || null,
	productIds: draft.productIds,
	discountId: draft.discountId
});

export const getIssues = query(async () => {
	requireAdmin();

	return listIssues();
});

export const getNewsletterDiscounts = query(async () => {
	requireAdmin();

	const discounts = await listDiscounts();

	return discounts
		.filter((discount) => discount.active)
		.map(({ id, code, label }) => ({ id, code, label }));
});

export const getNewsletterProducts = query(
	v.pipe(v.array(identifierSchema), v.maxLength(8)),
	async (ids) => {
		requireAdmin();

		const products = await findIssueProducts(ids);

		return products.map(({ id, name }) => ({ id, name }));
	}
);

export const getAudienceCount = query(segmentSchema, async (segment) => {
	requireAdmin();

	return countAudience(segment);
});

export const saveIssue = command(issueDraftSchema, async (draft) => {
	requireAdmin();

	const saved = await saveIssueDraft(draft);

	if (!saved) {
		error(409, 'Cette lettre est déjà partie : elle ne peut plus être modifiée.');
	}

	await getIssues().refresh();

	return saved;
});

export const previewIssue = command(issueDraftSchema, async (draft) => {
	requireAdmin();

	const content = await composeNewsletter(toSource(draft), origin());

	return { html: renderNewsletter(content, origin(), null).html };
});

export const sendTestIssue = command(issueDraftSchema, async (draft) => {
	const admin = requireAdmin();

	const quota = await consumeRateLimit({
		bucket: 'newsletter-test',
		subject: admin.id,
		limit: 20
	});

	if (!quota.allowed) {
		error(429, 'Trop d’envois de test coup sur coup. Réessaie dans une heure.');
	}

	const mail = renderNewsletter(
		await composeNewsletter(toSource(draft), origin()),
		origin(),
		admin.id
	);

	try {
		await sendMail({ ...mail, to: admin.email, subject: `[Test] ${mail.subject}` });
	} catch {
		error(502, "L'e-mail de test n'a pas pu partir : vérifie la configuration SMTP.");
	}

	return { sentTo: admin.email };
});

export const scheduleIssue = command(scheduleSchema, async ({ id, scheduledAt }) => {
	requireAdmin();

	const at = new Date(scheduledAt);

	if (at.getTime() < Date.now() + MIN_SCHEDULE_DELAY_MS) {
		error(400, 'Choisis un moment dans le futur.');
	}

	const updated = await scheduleIssueRecord(id, at);

	if (updated.count === 0) {
		error(409, 'Cette lettre ne peut plus être programmée.');
	}

	await getIssues().refresh();

	return { scheduledAt: at };
});

export const unscheduleIssue = command(identifierSchema, async (id) => {
	requireAdmin();

	const updated = await unscheduleIssueRecord(id);

	if (updated.count === 0) {
		error(409, 'Cette lettre n’est pas programmée.');
	}

	await getIssues().refresh();

	return { unscheduled: true };
});

export const sendIssueNow = command(identifierSchema, async (id) => {
	requireAdmin();

	const started = await startIssue(id);

	if (!started) {
		error(409, 'Cette lettre est déjà en cours d’envoi ou envoyée.');
	}

	const progress = await processIssueBatch(id, origin(), SEND_BUDGET_MS);

	await getIssues().refresh();

	return { recipientCount: started.recipientCount, ...progress };
});

export const continueIssue = command(identifierSchema, async (id) => {
	requireAdmin();

	const progress = await processIssueBatch(id, origin(), SEND_BUDGET_MS);

	if (!progress) {
		error(409, 'Cette lettre n’est pas en cours d’envoi.');
	}

	await getIssues().refresh();

	return progress;
});

export const removeIssue = command(identifierSchema, async (id) => {
	requireAdmin();

	const deleted = await deleteIssue(id);

	if (deleted.count === 0) {
		error(409, 'Une lettre en cours d’envoi ou envoyée ne peut plus être supprimée.');
	}

	await getIssues().refresh();

	return { deleted: true };
});
