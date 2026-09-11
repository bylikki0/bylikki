import { prisma } from './client';

const reviewSelect = {
	id: true,
	authorName: true,
	rating: true,
	qualityRating: true,
	accuracyRating: true,
	title: true,
	body: true,
	verifiedPurchase: true,
	replyBody: true,
	repliedAt: true,
	helpfulCount: true,
	createdAt: true,
	publishedAt: true,
	photos: {
		select: { id: true, url: true, width: true, height: true },
		orderBy: { position: 'asc' }
	},
	user: { select: { avatarUrl: true } }
} as const;

export type ProductReview = Awaited<ReturnType<typeof listPublishedReviews>>[number];

export type ReviewSort = 'recents' | 'utiles' | 'meilleurs' | 'severes';

export type ReviewFilters = {
	sort: ReviewSort;
	rating: number | null;
	withPhotos: boolean;
	verifiedOnly: boolean;
};

const reviewOrder = {
	recents: [{ createdAt: 'desc' }],
	utiles: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
	meilleurs: [{ rating: 'desc' }, { helpfulCount: 'desc' }],
	severes: [{ rating: 'asc' }, { helpfulCount: 'desc' }]
} as const;

export function listPublishedReviews(
	productId: string,
	filters: ReviewFilters = { sort: 'utiles', rating: null, withPhotos: false, verifiedOnly: false },
	limit = 20
) {
	return prisma.review.findMany({
		where: {
			productId,
			status: 'PUBLISHED',
			...(filters.rating === null ? {} : { rating: filters.rating }),
			...(filters.withPhotos ? { photos: { some: {} } } : {}),
			...(filters.verifiedOnly ? { verifiedPurchase: true } : {})
		},
		orderBy: [...reviewOrder[filters.sort]],
		take: limit,
		select: reviewSelect
	});
}

export async function getReviewBreakdown(productId: string) {
	const [byRating, averages] = await Promise.all([
		prisma.review.groupBy({
			by: ['rating'],
			where: { productId, status: 'PUBLISHED' },
			_count: { _all: true }
		}),
		prisma.review.aggregate({
			where: { productId, status: 'PUBLISHED' },
			_avg: { rating: true, qualityRating: true, accuracyRating: true },
			_count: { _all: true }
		})
	]);

	const counts = new Map(byRating.map((entry) => [entry.rating, entry._count._all]));
	const total = averages._count._all;

	return {
		total,
		average: averages._avg.rating ?? 0,
		quality: averages._avg.qualityRating,
		accuracy: averages._avg.accuracyRating,
		distribution: [5, 4, 3, 2, 1].map((rating) => {
			const count = counts.get(rating) ?? 0;

			return { rating, count, share: total === 0 ? 0 : Math.round((count / total) * 100) };
		})
	};
}

export function listVotedReviewIds(userId: string, productId: string) {
	return prisma.reviewVote.findMany({
		where: { userId, review: { productId } },
		select: { reviewId: true }
	});
}

export async function toggleReviewVote(userId: string, reviewId: string) {
	const target = await prisma.review.findFirst({
		where: { id: reviewId, status: 'PUBLISHED' },
		select: { id: true }
	});

	if (!target) {
		return { voted: false };
	}

	const existing = await prisma.reviewVote.findUnique({
		where: { reviewId_userId: { reviewId, userId } },
		select: { id: true }
	});

	if (existing) {
		await prisma.$transaction([
			prisma.reviewVote.delete({ where: { id: existing.id } }),
			prisma.review.update({
				where: { id: reviewId },
				data: { helpfulCount: { decrement: 1 } }
			})
		]);

		return { voted: false };
	}

	await prisma.$transaction([
		prisma.reviewVote.create({ data: { reviewId, userId } }),
		prisma.review.update({ where: { id: reviewId }, data: { helpfulCount: { increment: 1 } } })
	]);

	return { voted: true };
}

export function replyToReview(reviewId: string, body: string) {
	const trimmed = body.trim();

	return prisma.review.update({
		where: { id: reviewId },
		data: {
			replyBody: trimmed === '' ? null : trimmed,
			repliedAt: trimmed === '' ? null : new Date()
		},
		select: { id: true, replyBody: true, repliedAt: true }
	});
}

export async function listReviewsByIds(ids: string[]) {
	if (ids.length === 0) {
		return [];
	}

	const rows = await prisma.review.findMany({
		where: { id: { in: ids }, status: 'PUBLISHED' },
		select: { ...reviewSelect, product: { select: { name: true, slug: true } } }
	});

	const byId = new Map(rows.map((row) => [row.id, row]));

	return ids
		.map((id) => byId.get(id))
		.filter((row): row is NonNullable<typeof row> => row !== undefined);
}

export async function countPublishedReviewIds(ids: string[]) {
	if (ids.length === 0) {
		return 0;
	}

	return prisma.review.count({ where: { id: { in: ids }, status: 'PUBLISHED' } });
}

export function findUserReview(userId: string, productId: string) {
	return prisma.review.findUnique({
		where: { productId_userId: { productId, userId } },
		select: { ...reviewSelect, status: true }
	});
}

export async function saveReview(input: {
	productId: string;
	userId: string;
	authorName: string;
	rating: number;
	qualityRating: number | null;
	accuracyRating: number | null;
	title: string | null;
	body: string;
	verifiedPurchase: boolean;
	photos: { url: string; width: number; height: number }[];
}) {
	const { productId, userId, photos, ...data } = input;

	const review = await prisma.review.upsert({
		where: { productId_userId: { productId, userId } },
		create: { productId, userId, ...data },
		update: { ...data, status: 'PENDING', publishedAt: null },
		select: { id: true, status: true }
	});

	if (photos.length > 0) {
		await prisma.reviewPhoto.createMany({
			data: photos.map((photo, position) => ({ ...photo, position, reviewId: review.id }))
		});
	}

	await refreshProductRating(productId);

	return review;
}

export async function detachReviewPhotos(reviewId: string) {
	const photos = await prisma.reviewPhoto.findMany({
		where: { reviewId },
		select: { url: true }
	});

	await prisma.reviewPhoto.deleteMany({ where: { reviewId } });

	return photos.map((photo) => photo.url);
}

export function findReviewIdForUser(userId: string, productId: string) {
	return prisma.review.findUnique({
		where: { productId_userId: { productId, userId } },
		select: { id: true }
	});
}

export async function deleteUserReview(userId: string, reviewId: string) {
	const review = await prisma.review.findFirst({
		where: { id: reviewId, userId },
		select: { productId: true, photos: { select: { url: true } } }
	});

	if (!review) {
		return null;
	}

	await prisma.review.delete({ where: { id: reviewId } });
	await refreshProductRating(review.productId);

	return review.photos.map((photo) => photo.url);
}

export async function refreshProductRating(productId: string) {
	const aggregate = await prisma.review.aggregate({
		where: { productId, status: 'PUBLISHED' },
		_avg: { rating: true },
		_count: { _all: true }
	});

	await prisma.product.update({
		where: { id: productId },
		data: {
			ratingAverage: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
			reviewCount: aggregate._count._all
		}
	});
}

export async function moderateReview(reviewId: string, status: 'PUBLISHED' | 'REJECTED') {
	const review = await prisma.review.update({
		where: { id: reviewId },
		data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : null },
		select: { id: true, productId: true, status: true }
	});

	await refreshProductRating(review.productId);

	return review;
}
