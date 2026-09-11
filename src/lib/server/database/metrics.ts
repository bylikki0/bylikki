import { prisma } from './client';

export const METRIC_KEYS = [
	'product_view',
	'cart_add',
	'checkout_start',
	'order_paid',
	'search'
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

function startOfDay(date: Date) {
	const day = new Date(date);
	day.setUTCHours(0, 0, 0, 0);

	return day;
}

export async function countEvent(key: MetricKey, amount = 1, now = new Date()) {
	try {
		const date = startOfDay(now);

		await prisma.dailyMetric.upsert({
			where: { date_key: { date, key } },
			create: { date, key, value: amount },
			update: { value: { increment: amount } }
		});
	} catch (cause) {
		console.error(`[mesure] increment impossible pour ${key}`, cause);
	}
}

export async function recordSearchMiss(rawTerm: string) {
	const term = rawTerm.trim().toLowerCase().slice(0, 120);

	if (term.length < 2) {
		return;
	}

	try {
		await prisma.searchMiss.upsert({
			where: { term },
			create: { term },
			update: { count: { increment: 1 } }
		});
	} catch (cause) {
		console.error('[mesure] recherche sans resultat non enregistree', cause);
	}
}

export type FunnelWindow = { days: number };

export async function getFunnel(days = 30, now = new Date()) {
	const since = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));

	const rows = await prisma.dailyMetric.groupBy({
		by: ['key'],
		where: { date: { gte: since } },
		_sum: { value: true }
	});

	const totals = new Map(rows.map((row) => [row.key, row._sum.value ?? 0]));
	const view = totals.get('product_view') ?? 0;
	const add = totals.get('cart_add') ?? 0;
	const checkout = totals.get('checkout_start') ?? 0;
	const paid = totals.get('order_paid') ?? 0;

	const share = (part: number, whole: number) =>
		whole === 0 ? null : Math.round((part / whole) * 1000) / 10;

	return {
		days,
		steps: [
			{ key: 'product_view', label: 'Fiches vues', value: view, rate: null },
			{ key: 'cart_add', label: 'Ajouts au panier', value: add, rate: share(add, view) },
			{
				key: 'checkout_start',
				label: 'Paiements lancés',
				value: checkout,
				rate: share(checkout, add)
			},
			{ key: 'order_paid', label: 'Commandes payées', value: paid, rate: share(paid, checkout) }
		],
		conversion: share(paid, view),
		searches: totals.get('search') ?? 0
	};
}

export function listSearchMisses(limit = 12) {
	return prisma.searchMiss.findMany({
		orderBy: [{ count: 'desc' }, { lastSeenAt: 'desc' }],
		take: limit,
		select: { term: true, count: true, lastSeenAt: true }
	});
}

export async function getDailySeries(key: MetricKey, days = 30, now = new Date()) {
	const since = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
	const rows = await prisma.dailyMetric.findMany({
		where: { key, date: { gte: since } },
		orderBy: { date: 'asc' },
		select: { date: true, value: true }
	});

	const byDate = new Map(rows.map((row) => [row.date.toISOString().slice(0, 10), row.value]));

	return Array.from({ length: days }, (_, offset) => {
		const day = new Date(since);
		day.setUTCDate(day.getUTCDate() + offset);
		const iso = day.toISOString().slice(0, 10);

		return { date: iso, value: byDate.get(iso) ?? 0 };
	});
}
