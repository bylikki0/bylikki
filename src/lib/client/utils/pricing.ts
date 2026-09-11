export type DiscountKind = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export type DiscountRule = {
	code: string;
	label: string;
	kind: DiscountKind;
	value: number;
	minSubtotalCents: number;
};

export type LoyaltyBenefit = {
	name: string;
	discountPercent: number;
	freeShipping: boolean;
};

export type PriceBreakdown = {
	subtotalCents: number;
	discountCents: number;
	shippingCents: number;
	totalCents: number;
	appliedFrom: 'code' | 'loyalty' | 'both' | 'none';
};

function percentOf(amountCents: number, percent: number) {
	return Math.round((amountCents * percent) / 100);
}

function effectOf(
	rule: { kind: DiscountKind; value: number },
	subtotalCents: number,
	shippingCents: number
) {
	if (rule.kind === 'PERCENTAGE') {
		return { onSubtotal: percentOf(subtotalCents, rule.value), onShipping: 0 };
	}

	if (rule.kind === 'FIXED_AMOUNT') {
		return { onSubtotal: Math.min(rule.value, subtotalCents), onShipping: 0 };
	}

	return { onSubtotal: 0, onShipping: shippingCents };
}

export type PriceInput = {
	subtotalCents: number;
	shippingCents: number;
	discount: DiscountRule | null;
	loyalty: LoyaltyBenefit | null;
	stacksWithCode: boolean;
};

export function priceWithDiscounts({
	subtotalCents,
	shippingCents,
	discount,
	loyalty,
	stacksWithCode
}: PriceInput): PriceBreakdown {
	const codeApplies = discount !== null && subtotalCents >= discount.minSubtotalCents;
	const codeEffect = codeApplies
		? effectOf(discount, subtotalCents, shippingCents)
		: { onSubtotal: 0, onShipping: 0 };

	const loyaltyEffect = loyalty
		? {
				onSubtotal: percentOf(subtotalCents, loyalty.discountPercent),
				onShipping: loyalty.freeShipping ? shippingCents : 0
			}
		: { onSubtotal: 0, onShipping: 0 };

	const codeTotal = codeEffect.onSubtotal + codeEffect.onShipping;
	const loyaltyTotal = loyaltyEffect.onSubtotal + loyaltyEffect.onShipping;

	let applied: { onSubtotal: number; onShipping: number };
	let appliedFrom: PriceBreakdown['appliedFrom'];

	if (stacksWithCode) {
		applied = {
			onSubtotal: codeEffect.onSubtotal + loyaltyEffect.onSubtotal,
			onShipping: Math.max(codeEffect.onShipping, loyaltyEffect.onShipping)
		};
		appliedFrom =
			codeTotal > 0 && loyaltyTotal > 0
				? 'both'
				: codeTotal > 0
					? 'code'
					: loyaltyTotal > 0
						? 'loyalty'
						: 'none';
	} else if (codeTotal >= loyaltyTotal && codeTotal > 0) {
		applied = codeEffect;
		appliedFrom = 'code';
	} else if (loyaltyTotal > 0) {
		applied = loyaltyEffect;
		appliedFrom = 'loyalty';
	} else {
		applied = { onSubtotal: 0, onShipping: 0 };
		appliedFrom = 'none';
	}

	const onSubtotal = Math.min(Math.max(applied.onSubtotal, 0), subtotalCents);
	const onShipping = Math.min(Math.max(applied.onShipping, 0), shippingCents);

	return {
		subtotalCents,
		discountCents: onSubtotal + onShipping,
		shippingCents: shippingCents - onShipping,
		totalCents: subtotalCents - onSubtotal + (shippingCents - onShipping),
		appliedFrom
	};
}

export function tierFor<Tier extends { thresholdCents: number }>(
	tiers: Tier[],
	lifetimeSpentCents: number
): Tier | null {
	return (
		[...tiers]
			.filter((tier) => lifetimeSpentCents >= tier.thresholdCents)
			.sort((left, right) => right.thresholdCents - left.thresholdCents)[0] ?? null
	);
}

export function nextTierFor<Tier extends { thresholdCents: number }>(
	tiers: Tier[],
	lifetimeSpentCents: number
) {
	const next = [...tiers]
		.filter((tier) => lifetimeSpentCents < tier.thresholdCents)
		.sort((left, right) => left.thresholdCents - right.thresholdCents)[0];

	return next ? { tier: next, remainingCents: next.thresholdCents - lifetimeSpentCents } : null;
}
