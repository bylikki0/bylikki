import type { DiscountKind } from '$prisma/enums';
import {
	claimDeliveries,
	finalizeIssue,
	findIssueProducts,
	findNewsletterDiscount,
	findSendingIssue,
	listDueIssueIds,
	listSendingIssueIds,
	listSubscribedUserIds,
	markDeliveriesSkipped,
	markDeliveryFailed,
	markDeliverySent,
	startIssue
} from '../database/newsletter';
import NewsletterEmail from '../emails/Newsletter.svelte';
import { signUnsubscribe } from '../security/hash';
import { renderEmail, sendMail } from './mailer';

export type NewsletterSource = {
	subject: string;
	preheader: string;
	body: string;
	heroImageUrl: string | null;
	ctaLabel: string | null;
	ctaUrl: string | null;
	productIds: string[];
	discountId: string | null;
};

const BATCH_SIZE = 25;

const dayFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

const formatAmount = (cents: number, currency: string) =>
	new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100);

const absolute = (url: string, origin: string) => (url.startsWith('/') ? `${origin}${url}` : url);

function describeDiscount(discount: { kind: DiscountKind; value: number; expiresAt: Date | null }) {
	const amount =
		discount.kind === 'PERCENTAGE'
			? `-${discount.value} %`
			: discount.kind === 'FIXED_AMOUNT'
				? `-${formatAmount(discount.value, 'EUR')}`
				: 'Livraison offerte';

	return discount.expiresAt
		? `${amount}, jusqu’au ${dayFormatter.format(discount.expiresAt)}`
		: amount;
}

export async function composeNewsletter(source: NewsletterSource, origin: string) {
	const [products, discount] = await Promise.all([
		findIssueProducts(source.productIds),
		findNewsletterDiscount(source.discountId)
	]);

	return {
		subject: source.subject,
		preheader: source.preheader,
		paragraphs: source.body
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean),
		heroImageUrl: source.heroImageUrl ? absolute(source.heroImageUrl, origin) : null,
		cta:
			source.ctaLabel && source.ctaUrl
				? { label: source.ctaLabel, href: absolute(source.ctaUrl, origin) }
				: null,
		products: products
			.filter((product) => product.status === 'PUBLISHED')
			.map((product) => ({
				name: product.name,
				href: `${origin}/${product.slug}`,
				price: formatAmount(product.basePriceCents, product.currency),
				imageUrl: product.images[0] ? absolute(product.images[0].url, origin) : null
			})),
		discount: discount
			? { code: discount.code, label: discount.label, detail: describeDiscount(discount) }
			: null
	};
}

export type ComposedNewsletter = Awaited<ReturnType<typeof composeNewsletter>>;

export function renderNewsletter(
	content: ComposedNewsletter,
	origin: string,
	recipientId: string | null
) {
	const signedQuery = recipientId
		? `?u=${encodeURIComponent(recipientId)}&s=${signUnsubscribe(recipientId)}`
		: '';
	const rendered = renderEmail(NewsletterEmail, {
		title: content.subject,
		preheader: content.preheader,
		paragraphs: content.paragraphs,
		heroImageUrl: content.heroImageUrl,
		cta: content.cta,
		products: content.products,
		discount: content.discount,
		unsubscribeUrl: `${origin}/desinscription${signedQuery}`,
		origin
	});

	return {
		subject: content.subject,
		...rendered,
		headers: recipientId
			? {
					'List-Unsubscribe': `<${origin}/api/newsletter/desinscription${signedQuery}>`,
					'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
				}
			: undefined
	};
}

export async function processIssueBatch(issueId: string, origin: string, budgetMs: number) {
	const issue = await findSendingIssue(issueId);

	if (!issue) {
		return null;
	}

	const content = await composeNewsletter(issue, origin);
	const deadline = Date.now() + budgetMs;

	while (Date.now() < deadline) {
		const batch = await claimDeliveries(issueId, BATCH_SIZE);

		if (batch.length === 0) {
			break;
		}

		const subscribed = await listSubscribedUserIds(batch.map((delivery) => delivery.userId));
		const unsubscribed = batch.filter((delivery) => !subscribed.has(delivery.userId));

		if (unsubscribed.length > 0) {
			await markDeliveriesSkipped(unsubscribed.map((delivery) => delivery.id));
		}

		for (const delivery of batch.filter((candidate) => subscribed.has(candidate.userId))) {
			try {
				await sendMail({
					to: delivery.email,
					...renderNewsletter(content, origin, delivery.userId)
				});
				await markDeliverySent(delivery.id);
			} catch (cause) {
				await markDeliveryFailed(
					delivery.id,
					delivery.attempts,
					cause instanceof Error ? cause.message : String(cause)
				);
			}
		}
	}

	return finalizeIssue(issueId);
}

export async function runNewsletterQueue(origin: string, budgetMs: number, now = new Date()) {
	const deadline = Date.now() + budgetMs;
	const started: string[] = [];

	for (const { id } of await listDueIssueIds(now)) {
		if (await startIssue(id, now)) {
			started.push(id);
		}
	}

	const progress: ({ id: string } & Awaited<ReturnType<typeof finalizeIssue>>)[] = [];

	for (const { id } of await listSendingIssueIds()) {
		const remaining = deadline - Date.now();

		if (remaining <= 0) {
			break;
		}

		const result = await processIssueBatch(id, origin, remaining);

		if (result) {
			progress.push({ id, ...result });
		}
	}

	return { started, progress };
}
