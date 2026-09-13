import type { Prisma } from '$prisma/client';
import type { NewsletterSegment } from '$prisma/enums';
import { INACTIVE_DAYS, type Segment } from '$lib/client/validation/newsletter';

export const PAID_ORDER_STATUSES = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] as const;

const DAY_MS = 86_400_000;

export function audienceWhere(segment: Segment, now = new Date()): Prisma.UserWhereInput {
	const subscribed: Prisma.UserWhereInput = {
		deletionRequestedAt: null,
		anonymizedAt: null,
		consents: { some: { type: 'NEWSLETTER', granted: true } }
	};
	const paid = { status: { in: [...PAID_ORDER_STATUSES] } };

	switch (segment.kind) {
		case 'ALL':
			return subscribed;
		case 'CUSTOMERS':
			return { ...subscribed, orders: { some: paid } };
		case 'WISHLISTED':
			return { ...subscribed, wishlist: { some: { productId: segment.productId } } };
		case 'RESTOCK':
			return {
				...subscribed,
				restockAlerts: { some: { notifiedAt: null, variant: { productId: segment.productId } } }
			};
		case 'INACTIVE':
			return {
				...subscribed,
				AND: [
					{ orders: { some: paid } },
					{
						orders: {
							none: { ...paid, createdAt: { gte: new Date(now.getTime() - segment.days * DAY_MS) } }
						}
					}
				]
			};
	}
}

export type SegmentColumns = {
	segment: NewsletterSegment;
	segmentProductId: string | null;
	segmentInactiveDays: number | null;
};

export function segmentToColumns(segment: Segment): SegmentColumns {
	return {
		segment: segment.kind,
		segmentProductId:
			segment.kind === 'WISHLISTED' || segment.kind === 'RESTOCK' ? segment.productId : null,
		segmentInactiveDays: segment.kind === 'INACTIVE' ? segment.days : null
	};
}

export function columnsToSegment(columns: SegmentColumns): Segment | null {
	switch (columns.segment) {
		case 'ALL':
		case 'CUSTOMERS':
			return { kind: columns.segment };
		case 'WISHLISTED':
		case 'RESTOCK':
			return columns.segmentProductId
				? { kind: columns.segment, productId: columns.segmentProductId }
				: null;
		case 'INACTIVE':
			return { kind: 'INACTIVE', days: columns.segmentInactiveDays ?? INACTIVE_DAYS.fallback };
	}
}
