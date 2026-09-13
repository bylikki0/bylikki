import type { NewsletterStatus } from '$prisma/enums';
import type { IssueDraft, Segment } from '$lib/client/validation/newsletter';
import { audienceWhere, columnsToSegment, segmentToColumns } from '../utils/newsletter-audience';
import { prisma } from './client';

const EDITABLE: NewsletterStatus[] = ['DRAFT', 'SCHEDULED'];
const STALE_CLAIM_MS = 10 * 60_000;

export const MAX_DELIVERY_ATTEMPTS = 3;

const contentSelect = {
	subject: true,
	preheader: true,
	body: true,
	heroImageUrl: true,
	ctaLabel: true,
	ctaUrl: true,
	productIds: true,
	discountId: true
} as const;

export async function listIssues() {
	const rows = await prisma.newsletterIssue.findMany({
		orderBy: { createdAt: 'desc' },
		take: 30,
		select: {
			id: true,
			...contentSelect,
			segment: true,
			segmentProductId: true,
			segmentInactiveDays: true,
			status: true,
			scheduledAt: true,
			startedAt: true,
			sentAt: true,
			recipientCount: true,
			sentCount: true,
			failedCount: true,
			createdAt: true
		}
	});

	return rows.map((row) => ({ ...row, audience: columnsToSegment(row) }));
}

function draftColumns(draft: IssueDraft) {
	return {
		subject: draft.subject,
		preheader: draft.preheader,
		body: draft.body,
		heroImageUrl: draft.heroImageUrl || null,
		ctaLabel: draft.ctaLabel || null,
		ctaUrl: draft.ctaUrl || null,
		productIds: draft.productIds,
		discountId: draft.discountId,
		...segmentToColumns(draft.segment)
	};
}

export async function saveIssueDraft(draft: IssueDraft) {
	if (!draft.id) {
		return prisma.newsletterIssue.create({ data: draftColumns(draft), select: { id: true } });
	}

	const updated = await prisma.newsletterIssue.updateMany({
		where: { id: draft.id, status: { in: EDITABLE } },
		data: draftColumns(draft)
	});

	return updated.count === 0 ? null : { id: draft.id };
}

export function deleteIssue(id: string) {
	return prisma.newsletterIssue.deleteMany({ where: { id, status: { in: EDITABLE } } });
}

export function countAudience(segment: Segment) {
	return prisma.user.count({ where: audienceWhere(segment) });
}

export function scheduleIssue(id: string, scheduledAt: Date) {
	return prisma.newsletterIssue.updateMany({
		where: { id, status: { in: EDITABLE } },
		data: { status: 'SCHEDULED', scheduledAt }
	});
}

export function unscheduleIssue(id: string) {
	return prisma.newsletterIssue.updateMany({
		where: { id, status: 'SCHEDULED' },
		data: { status: 'DRAFT', scheduledAt: null }
	});
}

export function listDueIssueIds(now: Date) {
	return prisma.newsletterIssue.findMany({
		where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
		orderBy: { scheduledAt: 'asc' },
		select: { id: true }
	});
}

export function listSendingIssueIds() {
	return prisma.newsletterIssue.findMany({
		where: { status: 'SENDING' },
		orderBy: { startedAt: 'asc' },
		select: { id: true }
	});
}

export function startIssue(id: string, now = new Date()) {
	return prisma.$transaction(
		async (transaction) => {
			const issue = await transaction.newsletterIssue.findFirst({
				where: { id, status: { in: EDITABLE } },
				select: { segment: true, segmentProductId: true, segmentInactiveDays: true }
			});
			const segment = issue ? columnsToSegment(issue) : null;

			if (!segment) {
				return null;
			}

			const claimed = await transaction.newsletterIssue.updateMany({
				where: { id, status: { in: EDITABLE } },
				data: { status: 'SENDING', startedAt: now }
			});

			if (claimed.count === 0) {
				return null;
			}

			const recipients = await transaction.user.findMany({
				where: audienceWhere(segment, now),
				select: { id: true, email: true }
			});

			if (recipients.length > 0) {
				await transaction.newsletterDelivery.createMany({
					data: recipients.map((recipient) => ({
						issueId: id,
						userId: recipient.id,
						email: recipient.email
					})),
					skipDuplicates: true
				});
			}

			await transaction.newsletterIssue.update({
				where: { id },
				data: { recipientCount: recipients.length }
			});

			return { recipientCount: recipients.length };
		},
		{ timeout: 30_000 }
	);
}

export function findSendingIssue(id: string) {
	return prisma.newsletterIssue.findFirst({
		where: { id, status: 'SENDING' },
		select: contentSelect
	});
}

export function claimDeliveries(issueId: string, limit: number) {
	return prisma.$queryRaw<{ id: string; userId: string; email: string; attempts: number }[]>`
		UPDATE "NewsletterDelivery"
		SET "status" = 'CLAIMED', "claimedAt" = now(), "attempts" = "attempts" + 1
		WHERE "id" IN (
			SELECT "id" FROM "NewsletterDelivery"
			WHERE "issueId" = ${issueId}
				AND "attempts" < ${MAX_DELIVERY_ATTEMPTS}
				AND (
					"status" = 'PENDING'
					OR ("status" = 'CLAIMED' AND "claimedAt" < now() - interval '10 minutes')
				)
			ORDER BY "createdAt"
			LIMIT ${limit}
			FOR UPDATE SKIP LOCKED
		)
		RETURNING "id", "userId", "email", "attempts"`;
}

export function markDeliverySent(id: string) {
	return prisma.newsletterDelivery.update({
		where: { id },
		data: { status: 'SENT', sentAt: new Date(), error: null },
		select: { id: true }
	});
}

export function markDeliveryFailed(id: string, attempts: number, message: string) {
	return prisma.newsletterDelivery.update({
		where: { id },
		data: {
			status: attempts >= MAX_DELIVERY_ATTEMPTS ? 'FAILED' : 'PENDING',
			error: message.slice(0, 500)
		},
		select: { id: true }
	});
}

export function markDeliveriesSkipped(ids: string[]) {
	return prisma.newsletterDelivery.updateMany({
		where: { id: { in: ids } },
		data: { status: 'SKIPPED' }
	});
}

export async function listSubscribedUserIds(userIds: string[]) {
	const rows = await prisma.user.findMany({
		where: { id: { in: userIds }, ...audienceWhere({ kind: 'ALL' }) },
		select: { id: true }
	});

	return new Set(rows.map((row) => row.id));
}

export async function finalizeIssue(issueId: string, now = new Date()) {
	await prisma.newsletterDelivery.updateMany({
		where: {
			issueId,
			status: { in: ['PENDING', 'CLAIMED'] },
			attempts: { gte: MAX_DELIVERY_ATTEMPTS },
			OR: [{ status: 'PENDING' }, { claimedAt: { lt: new Date(now.getTime() - STALE_CLAIM_MS) } }]
		},
		data: { status: 'FAILED' }
	});

	const grouped = await prisma.newsletterDelivery.groupBy({
		by: ['status'],
		where: { issueId },
		_count: { _all: true }
	});
	const count = (status: string) =>
		grouped.find((entry) => entry.status === status)?._count._all ?? 0;

	const open = count('PENDING') + count('CLAIMED');
	const sent = count('SENT');
	const failed = count('FAILED');
	const done = open === 0;

	await prisma.newsletterIssue.updateMany({
		where: { id: issueId, status: 'SENDING' },
		data: {
			sentCount: sent,
			failedCount: failed,
			...(done ? { status: 'SENT' as const, sentAt: now } : {})
		}
	});

	return { open, sent, failed, done };
}

export async function findIssueProducts(ids: string[]) {
	if (ids.length === 0) {
		return [];
	}

	const rows = await prisma.product.findMany({
		where: { id: { in: ids } },
		select: {
			id: true,
			name: true,
			slug: true,
			status: true,
			basePriceCents: true,
			currency: true,
			images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 }
		}
	});
	const byId = new Map(rows.map((row) => [row.id, row]));

	return ids.flatMap((id) => {
		const row = byId.get(id);
		return row ? [row] : [];
	});
}

export function findNewsletterDiscount(id: string | null) {
	return id
		? prisma.discount.findUnique({
				where: { id },
				select: { code: true, label: true, kind: true, value: true, expiresAt: true }
			})
		: Promise.resolve(null);
}

export async function userExists(id: string) {
	return (await prisma.user.count({ where: { id } })) > 0;
}

export function revokeNewsletterConsent(userId: string) {
	return prisma.userConsent.upsert({
		where: { userId_type: { userId, type: 'NEWSLETTER' } },
		create: { userId, type: 'NEWSLETTER', granted: false },
		update: { granted: false },
		select: { id: true }
	});
}
