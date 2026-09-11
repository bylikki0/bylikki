import { expect, test } from '@playwright/test';
import { e2ePrisma } from './support/db';

let saved: unknown = null;
let hadSetting = false;

test.beforeAll(async () => {
	const prisma = e2ePrisma();

	try {
		const row = await prisma.siteSetting.findUnique({ where: { key: 'testimonials' } });
		hadSetting = row !== null;
		saved = row?.value ?? null;
	} finally {
		await prisma.$disconnect();
	}
});

test.afterAll(async () => {
	const prisma = e2ePrisma();

	try {
		if (hadSetting) {
			await prisma.siteSetting.update({
				where: { key: 'testimonials' },
				data: { value: saved as never }
			});
		} else {
			await prisma.siteSetting.delete({ where: { key: 'testimonials' } }).catch(() => undefined);
		}
	} finally {
		await prisma.$disconnect();
	}
});

async function setTestimonials(reviewIds: string[]) {
	const prisma = e2ePrisma();

	try {
		await prisma.siteSetting.upsert({
			where: { key: 'testimonials' },
			create: { key: 'testimonials', value: { reviewIds } },
			update: { value: { reviewIds } }
		});
	} finally {
		await prisma.$disconnect();
	}
}

async function publishedReviews(limit: number) {
	const prisma = e2ePrisma();

	try {
		return await prisma.review.findMany({
			where: { status: 'PUBLISHED' },
			select: { id: true, body: true },
			take: limit,
			orderBy: { createdAt: 'asc' }
		});
	} finally {
		await prisma.$disconnect();
	}
}

async function waitForSettingsCache() {
	await new Promise((resolve) => setTimeout(resolve, 16_000));
}

test.describe('section temoignages', () => {
	test.use({ storageState: { cookies: [], origins: [] } });
	test.describe.configure({ timeout: 120_000 });

	test('sans selection, la section est absente', async ({ page }) => {
		await setTestimonials([]);
		await waitForSettingsCache();

		await page.goto('/');

		await expect(page.locator('#avis')).toHaveCount(0);
	});

	test('avec une selection, la section parait dans l ordre choisi', async ({ page }) => {
		const reviews = await publishedReviews(3);
		expect(reviews.length).toBeGreaterThanOrEqual(2);

		const ordered = [...reviews].reverse();
		await setTestimonials(ordered.map((review) => review.id));
		await waitForSettingsCache();

		await page.goto('/');

		const section = page.locator('#avis');
		await expect(section).toBeVisible();

		const quotes = section.locator('blockquote');
		await expect(quotes).toHaveCount(ordered.length);

		await expect(quotes.first()).toContainText(ordered[0].body.slice(0, 24));
	});

	test('un identifiant obsolete ne casse pas la page', async ({ page }) => {
		await setTestimonials(['identifiant-qui-nexiste-pas']);
		await waitForSettingsCache();

		const response = await page.goto('/');

		expect(response?.status()).toBe(200);
		await expect(page.locator('#avis')).toHaveCount(0);
	});
});
