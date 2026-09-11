import {
	priceWithDiscounts,
	tierFor,
	type DiscountRule,
	type PriceBreakdown
} from '$lib/client/utils/pricing';
import { prisma } from './client';
import { checkDiscount, listLoyaltyTiers, type DiscountVerdict } from './discount';
import { shippingCentsFor } from './order';
import { getSetting } from './settings';

export type PricedCheckout = PriceBreakdown & {
	discount: (DiscountRule & { id: string }) | null;
	discountIssue: Exclude<DiscountVerdict, { status: 'ok' }> | null;
	tier: { id: string; name: string; discountPercent: number; freeShipping: boolean } | null;
};

export async function priceCheckout(input: {
	subtotalCents: number;
	code: string | null;
	userId: string | null;
}): Promise<PricedCheckout> {
	const [shipping, loyaltySetting, tiers, spent] = await Promise.all([
		getSetting('shipping'),
		getSetting('loyalty'),
		listLoyaltyTiers(),
		input.userId
			? prisma.user.findUnique({
					where: { id: input.userId },
					select: { lifetimeSpentCents: true }
				})
			: null
	]);

	const shippingCents = shippingCentsFor(input.subtotalCents, shipping);
	const tier = tierFor(tiers, spent?.lifetimeSpentCents ?? 0);

	const verdict = input.code
		? await checkDiscount(input.code, input.userId, input.subtotalCents)
		: null;
	const discount = verdict?.status === 'ok' ? verdict.discount : null;

	const breakdown = priceWithDiscounts({
		subtotalCents: input.subtotalCents,
		shippingCents,
		discount,
		loyalty: tier
			? { name: tier.name, discountPercent: tier.discountPercent, freeShipping: tier.freeShipping }
			: null,
		stacksWithCode: loyaltySetting.stacksWithCode
	});

	return {
		...breakdown,
		discount,
		discountIssue: verdict && verdict.status !== 'ok' ? verdict : null,
		tier: tier
			? {
					id: tier.id,
					name: tier.name,
					discountPercent: tier.discountPercent,
					freeShipping: tier.freeShipping
				}
			: null
	};
}

export function adjustLifetimeSpent(userId: string, deltaCents: number) {
	return prisma.user.update({
		where: { id: userId },
		data: { lifetimeSpentCents: { increment: deltaCents } },
		select: { lifetimeSpentCents: true }
	});
}

export async function recomputeLifetimeSpent(userId: string) {
	const aggregate = await prisma.order.aggregate({
		where: { userId, paymentStatus: 'PAID' },
		_sum: { totalCents: true }
	});

	return prisma.user.update({
		where: { id: userId },
		data: { lifetimeSpentCents: aggregate._sum.totalCents ?? 0 },
		select: { lifetimeSpentCents: true }
	});
}
