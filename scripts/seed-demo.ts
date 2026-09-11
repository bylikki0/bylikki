import type { PrismaClient } from '../generated/prisma/client';
import { buildSearchText } from '../src/lib/server/utils/text';
import {
	ATTRIBUTES,
	CATEGORIES,
	COMPONENTS,
	DISCOUNTS,
	PRODUCTS,
	REVIEW_AUTHORS,
	REVIEWS
} from './seed-data';

export const DEMO_EMAIL_PREFIX = 'demo+';

const DEMO_SLUG_RE = /^demo-/;

function demoEmail(key: string) {
	return `${DEMO_EMAIL_PREFIX}${key}@bylikki.test`;
}

function colorLabel(value: string) {
	return ATTRIBUTES[0].values.find((entry) => entry.value === value)?.label ?? value;
}

export async function seedDemo(prisma: PrismaClient, log: (line: string) => void) {
	const categoryIds = new Map<string, string>();

	for (const category of CATEGORIES) {
		const row = await prisma.category.upsert({
			where: { slug: category.slug },
			create: {
				slug: category.slug,
				name: category.name,
				description: category.description,
				position: category.position
			},
			update: {
				name: category.name,
				description: category.description,
				position: category.position
			},
			select: { id: true }
		});

		categoryIds.set(category.slug, row.id);
	}

	for (const category of CATEGORIES) {
		if (!category.parent) {
			continue;
		}

		await prisma.category.update({
			where: { slug: category.slug },
			data: { parentId: categoryIds.get(category.parent) ?? null }
		});
	}

	log(`categories            ${CATEGORIES.length}`);

	const valueIds = new Map<string, string>();

	for (const attribute of ATTRIBUTES) {
		const row = await prisma.attribute.upsert({
			where: { key: attribute.key },
			create: {
				key: attribute.key,
				label: attribute.label,
				kind: attribute.kind,
				variantAxis: attribute.variantAxis,
				position: attribute.position
			},
			update: {
				label: attribute.label,
				kind: attribute.kind,
				variantAxis: attribute.variantAxis,
				position: attribute.position
			},
			select: { id: true }
		});

		for (const [index, value] of attribute.values.entries()) {
			const valueRow = await prisma.attributeValue.upsert({
				where: { attributeId_value: { attributeId: row.id, value: value.value } },
				create: {
					attributeId: row.id,
					value: value.value,
					label: value.label,
					hexColor: value.hexColor,
					position: index
				},
				update: { label: value.label, hexColor: value.hexColor, position: index },
				select: { id: true }
			});

			valueIds.set(`${attribute.key}:${value.value}`, valueRow.id);
		}
	}

	log(`criteres              ${ATTRIBUTES.length}`);

	const productIds = new Map<string, string>();

	for (const product of PRODUCTS) {
		const searchText = buildSearchText([
			product.name,
			product.summary,
			product.description,
			product.story,
			product.badge
		]);

		const categoryConnect = product.categories
			.map((slug) => categoryIds.get(slug))
			.filter((id): id is string => Boolean(id))
			.map((id) => ({ id }));

		const row = await prisma.product.upsert({
			where: { slug: product.slug },
			create: {
				slug: product.slug,
				name: product.name,
				summary: product.summary,
				description: product.description,
				story: product.story ?? null,
				badge: product.badge ?? null,
				status: 'PUBLISHED',
				basePriceCents: product.basePriceCents,
				featured: product.featured,
				searchText,
				publishedAt: new Date(),
				categories: { connect: categoryConnect }
			},
			update: {
				name: product.name,
				summary: product.summary,
				description: product.description,
				story: product.story ?? null,
				badge: product.badge ?? null,
				status: 'PUBLISHED',
				basePriceCents: product.basePriceCents,
				featured: product.featured,
				searchText,
				categories: { set: categoryConnect }
			},
			select: { id: true }
		});

		productIds.set(product.slug, row.id);

		await prisma.productImage.deleteMany({ where: { productId: row.id } });
		await prisma.productImage.createMany({
			data: [
				{
					productId: row.id,
					url: '/demo/piece-1.webp',
					alt: `${product.name}, photo principale`,
					position: 0
				},
				{
					productId: row.id,
					url: '/demo/piece-2.webp',
					alt: `${product.name}, vue de detail`,
					position: 1
				},
				{
					productId: row.id,
					url: '/demo/piece-3.webp',
					alt: `${product.name}, porte`,
					position: 2
				}
			]
		});

		const facetIds = [
			...product.colors.map((color) => valueIds.get(`couleur:${color}`)),
			valueIds.get(`matiere:${product.matiere}`)
		].filter((id): id is string => Boolean(id));

		await prisma.productAttributeValue.deleteMany({ where: { productId: row.id } });
		await prisma.productAttributeValue.createMany({
			data: facetIds.map((attributeValueId) => ({ productId: row.id, attributeValueId }))
		});

		for (const [index, color] of product.colors.entries()) {
			const sku = `DEMO-${product.slug.replace(DEMO_SLUG_RE, '').toUpperCase()}-${index + 1}`;
			const stock = index === 0 ? product.firstStock : product.firstStock + 4;

			const variant = await prisma.productVariant.upsert({
				where: { sku },
				create: {
					sku,
					productId: row.id,
					label: colorLabel(color),
					priceCents: product.basePriceCents,
					stock,
					available: true,
					position: index
				},
				update: {
					productId: row.id,
					label: colorLabel(color),
					priceCents: product.basePriceCents,
					stock,
					available: true,
					position: index
				},
				select: { id: true }
			});

			const colorValueId = valueIds.get(`couleur:${color}`);

			if (colorValueId) {
				await prisma.variantAttributeValue.deleteMany({ where: { variantId: variant.id } });
				await prisma.variantAttributeValue.create({
					data: { variantId: variant.id, attributeValueId: colorValueId }
				});
			}
		}
	}

	log(`produits              ${PRODUCTS.length}`);

	for (const [index, component] of COMPONENTS.entries()) {
		await prisma.component.upsert({
			where: { key: component.key },
			create: { ...component, position: index },
			update: { ...component, position: index }
		});
	}

	log(`composants atelier    ${COMPONENTS.length}`);

	const authorIds = new Map<string, string>();

	for (const author of REVIEW_AUTHORS) {
		const row = await prisma.user.upsert({
			where: { email: demoEmail(author.key) },
			create: {
				email: demoEmail(author.key),
				displayName: author.displayName,
				emailVerifiedAt: new Date()
			},
			update: { displayName: author.displayName },
			select: { id: true }
		});

		authorIds.set(author.key, row.id);
	}

	for (const review of REVIEWS) {
		const productId = productIds.get(review.productSlug);
		const userId = authorIds.get(review.author);

		if (!productId || !userId) {
			continue;
		}

		const authorName =
			REVIEW_AUTHORS.find((entry) => entry.key === review.author)?.displayName ?? review.author;
		const reply = 'reply' in review ? (review.reply as string) : null;

		const fields = {
			authorName,
			rating: review.rating,
			title: review.title,
			body: review.body,
			status: review.status,
			replyBody: reply,
			repliedAt: reply ? new Date() : null,
			publishedAt: review.status === 'PUBLISHED' ? new Date() : null
		};

		await prisma.review.upsert({
			where: { productId_userId: { productId, userId } },
			create: { productId, userId, verifiedPurchase: true, ...fields },
			update: fields
		});
	}

	for (const productId of productIds.values()) {
		const stats = await prisma.review.aggregate({
			where: { productId, status: 'PUBLISHED' },
			_avg: { rating: true },
			_count: { _all: true }
		});

		await prisma.product.update({
			where: { id: productId },
			data: {
				ratingAverage: Math.round((stats._avg.rating ?? 0) * 10) / 10,
				reviewCount: stats._count._all
			}
		});
	}

	log(`avis                  ${REVIEWS.length}`);

	for (const discount of DISCOUNTS) {
		await prisma.discount.upsert({
			where: { code: discount.code },
			create: discount,
			update: discount
		});
	}

	log(`codes de reduction    ${DISCOUNTS.length}`);
}
