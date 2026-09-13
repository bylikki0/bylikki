import { describe, expect, it } from 'vitest';
import { audienceWhere, columnsToSegment, segmentToColumns } from './newsletter-audience';

const now = new Date('2026-09-13T10:00:00.000Z');

const subscribed = {
	deletionRequestedAt: null,
	anonymizedAt: null,
	consents: { some: { type: 'NEWSLETTER', granted: true } }
};

const paid = { status: { in: ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] } };

describe('audienceWhere', () => {
	it('ne vise que les comptes abonnés et actifs', () => {
		expect(audienceWhere({ kind: 'ALL' }, now)).toEqual(subscribed);
	});

	it('restreint aux clientes ayant une commande payée', () => {
		expect(audienceWhere({ kind: 'CUSTOMERS' }, now)).toEqual({
			...subscribed,
			orders: { some: paid }
		});
	});

	it('cible les envies posées sur un produit', () => {
		expect(audienceWhere({ kind: 'WISHLISTED', productId: 'p1' }, now)).toEqual({
			...subscribed,
			wishlist: { some: { productId: 'p1' } }
		});
	});

	it('cible les alertes de remise en stock encore en attente', () => {
		expect(audienceWhere({ kind: 'RESTOCK', productId: 'p1' }, now)).toEqual({
			...subscribed,
			restockAlerts: { some: { notifiedAt: null, variant: { productId: 'p1' } } }
		});
	});

	it('exclut les clientes ayant commandé pendant la fenêtre d inactivité', () => {
		expect(audienceWhere({ kind: 'INACTIVE', days: 90 }, now)).toEqual({
			...subscribed,
			AND: [
				{ orders: { some: paid } },
				{
					orders: {
						none: { ...paid, createdAt: { gte: new Date('2026-06-15T10:00:00.000Z') } }
					}
				}
			]
		});
	});
});

describe('colonnes de segment', () => {
	it('fait l aller-retour pour chaque segment', () => {
		for (const segment of [
			{ kind: 'ALL' },
			{ kind: 'CUSTOMERS' },
			{ kind: 'WISHLISTED', productId: 'p1' },
			{ kind: 'RESTOCK', productId: 'p2' },
			{ kind: 'INACTIVE', days: 120 }
		] as const) {
			expect(columnsToSegment(segmentToColumns(segment))).toEqual(segment);
		}
	});

	it('refuse un segment produit sans produit', () => {
		expect(
			columnsToSegment({ segment: 'WISHLISTED', segmentProductId: null, segmentInactiveDays: null })
		).toBeNull();
	});

	it('retombe sur la durée par défaut quand elle manque', () => {
		expect(
			columnsToSegment({ segment: 'INACTIVE', segmentProductId: null, segmentInactiveDays: null })
		).toEqual({ kind: 'INACTIVE', days: 90 });
	});
});
