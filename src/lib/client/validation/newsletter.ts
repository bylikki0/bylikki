import * as v from 'valibot';

export const ISSUE_LIMITS = {
	subject: 120,
	preheader: 140,
	body: 8000,
	ctaLabel: 40,
	ctaUrl: 300,
	heroImageUrl: 500
} as const;

export const MAX_ISSUE_PRODUCTS = 4;
export const INACTIVE_DAYS = { min: 30, max: 730, fallback: 90 } as const;

const identifier = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64));

export const segmentSchema = v.variant('kind', [
	v.object({ kind: v.literal('ALL') }),
	v.object({ kind: v.literal('CUSTOMERS') }),
	v.object({ kind: v.literal('WISHLISTED'), productId: identifier }),
	v.object({ kind: v.literal('RESTOCK'), productId: identifier }),
	v.object({
		kind: v.literal('INACTIVE'),
		days: v.pipe(
			v.number(),
			v.integer(),
			v.minValue(INACTIVE_DAYS.min, `${INACTIVE_DAYS.min} jours au minimum.`),
			v.maxValue(INACTIVE_DAYS.max, `${INACTIVE_DAYS.max} jours au maximum.`)
		)
	})
]);

export type Segment = v.InferOutput<typeof segmentSchema>;
export type SegmentKind = Segment['kind'];

export const segmentLabels: Record<SegmentKind, string> = {
	ALL: 'Toutes les abonnées',
	CUSTOMERS: 'Clientes ayant déjà commandé',
	WISHLISTED: 'Ont mis un produit en envie',
	RESTOCK: 'Attendent le retour d’un produit',
	INACTIVE: 'Clientes sans commande récente'
};

const isSafeLink = (value: string) =>
	value === '' ||
	(value.startsWith('/') && !value.startsWith('//')) ||
	/^https:\/\/\S+$/.test(value);

export const issueDraftSchema = v.pipe(
	v.object({
		id: v.optional(identifier),
		subject: v.pipe(
			v.string('Donne un objet à cette lettre.'),
			v.trim(),
			v.minLength(3, 'Cet objet est trop court.'),
			v.maxLength(ISSUE_LIMITS.subject, 'Cet objet est trop long.')
		),
		preheader: v.pipe(
			v.string(),
			v.trim(),
			v.maxLength(ISSUE_LIMITS.preheader, 'Ce pré-en-tête est trop long.')
		),
		body: v.pipe(
			v.string('Écris le contenu de la lettre.'),
			v.trim(),
			v.minLength(20, 'Cette lettre est trop courte.'),
			v.maxLength(ISSUE_LIMITS.body, 'Cette lettre est trop longue.')
		),
		heroImageUrl: v.pipe(
			v.string(),
			v.trim(),
			v.maxLength(ISSUE_LIMITS.heroImageUrl),
			v.check(isSafeLink, 'L’image doit être une adresse commençant par / ou https://.')
		),
		ctaLabel: v.pipe(
			v.string(),
			v.trim(),
			v.maxLength(ISSUE_LIMITS.ctaLabel, 'Le texte du bouton est trop long.')
		),
		ctaUrl: v.pipe(
			v.string(),
			v.trim(),
			v.maxLength(ISSUE_LIMITS.ctaUrl),
			v.check(isSafeLink, 'Le lien du bouton doit commencer par / ou https://.')
		),
		productIds: v.pipe(
			v.array(identifier),
			v.maxLength(MAX_ISSUE_PRODUCTS, `${MAX_ISSUE_PRODUCTS} produits au maximum.`),
			v.check(
				(ids) => new Set(ids).size === ids.length,
				'Un même produit ne peut pas figurer deux fois.'
			)
		),
		discountId: v.nullable(identifier),
		segment: segmentSchema
	}),
	v.check(
		(issue) => (issue.ctaLabel === '') === (issue.ctaUrl === ''),
		'Le bouton a besoin d’un texte et d’un lien.'
	)
);

export type IssueDraft = v.InferOutput<typeof issueDraftSchema>;

export const scheduleSchema = v.object({
	id: identifier,
	scheduledAt: v.pipe(v.string(), v.isoTimestamp('Choisis une date et une heure valides.'))
});
