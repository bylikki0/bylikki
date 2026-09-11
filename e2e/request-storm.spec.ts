import { expect, test } from '@playwright/test';
import { hydrated } from './support/page';

function countRemoteCalls(page: import('@playwright/test').Page) {
	const counts = new Map<string, number>();
	const watched = ['getProduct', 'getProductReviews', 'getFeaturedProducts', 'getTestimonials'];

	page.on('request', (request) => {
		const name = /\/([A-Za-z0-9_]+)$/.exec(new URL(request.url()).pathname)?.[1];

		if (name && watched.includes(name)) {
			counts.set(name, (counts.get(name) ?? 0) + 1);
		}
	});

	return counts;
}

const SANE_LIMIT = 5;

test.describe('aucune boucle de rendu', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('fiche produit en acces direct', async ({ page }) => {
		const counts = countRemoteCalls(page);

		await page.goto('/demo-bracelet-etoile');
		await page.waitForTimeout(6000);

		console.log('[acces direct]', JSON.stringify(Object.fromEntries(counts)));

		for (const [name, count] of counts) {
			expect(count, `${name} appelee ${count} fois en acces direct`).toBeLessThanOrEqual(
				SANE_LIMIT
			);
		}
	});

	test('fiche produit atteinte depuis la boutique', async ({ page }) => {
		await page.goto('/search');
		await hydrated(page);

		const counts = countRemoteCalls(page);

		await page.locator('a[href^="/demo-"]').first().click();
		await page.waitForTimeout(6000);

		console.log('[navigation]', JSON.stringify(Object.fromEntries(counts)));

		for (const [name, count] of counts) {
			expect(count, `${name} appelee ${count} fois apres navigation`).toBeLessThanOrEqual(
				SANE_LIMIT
			);
		}
	});

	test('accueil', async ({ page }) => {
		const counts = countRemoteCalls(page);

		await page.goto('/');
		await page.waitForTimeout(6000);

		console.log('[accueil]', JSON.stringify(Object.fromEntries(counts)));

		for (const [name, count] of counts) {
			expect(count, `${name} appelee ${count} fois sur l accueil`).toBeLessThanOrEqual(SANE_LIMIT);
		}
	});
});
