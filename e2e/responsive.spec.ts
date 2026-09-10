import { expect, test } from '@playwright/test';
import { hydrated } from './support/page';

/**
 * Verification objective du responsive : aucune page ne doit deborder
 * horizontalement, du telephone a l'ultra-large. Un debordement se voit a
 * `scrollWidth > clientWidth` sur l'element racine.
 *
 * Les tres grandes largeurs comptent autant que les petites : c'est la que les
 * grilles figees et les cadres plafonnes se voient.
 */
const VIEWPORTS = [
	{ name: 'telephone', width: 390, height: 844 },
	{ name: 'tablette', width: 768, height: 1024 },
	{ name: 'portable', width: 1280, height: 800 },
	{ name: 'bureau', width: 1600, height: 900 },
	{ name: 'large', width: 1920, height: 1080 },
	{ name: 'tres large', width: 2560, height: 1440 },
	{ name: 'ultra large', width: 3440, height: 1440 }
];

const PUBLIC_PAGES = ['/', '/search', '/atelier', '/legal', '/suivi', '/sign'];

async function overflow(page: import('@playwright/test').Page) {
	return page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
}

test.describe('boutique', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	for (const viewport of VIEWPORTS) {
		test(`aucun debordement en ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });

			for (const path of PUBLIC_PAGES) {
				await page.goto(path);
				await hydrated(page);

				const size = await overflow(page);

				expect(
					size.scrollWidth,
					`${path} deborde en ${viewport.width}px (${size.scrollWidth} > ${size.clientWidth})`
				).toBeLessThanOrEqual(size.clientWidth + 1);
			}
		});
	}
});

test.describe('administration', () => {
	test.use({ storageState: 'e2e/.auth/admin.json' });

	for (const viewport of [VIEWPORTS[0], VIEWPORTS[2], VIEWPORTS[5]]) {
		test(`l administration tient en ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });

			for (const path of ['/admin', '/admin/produits', '/admin/commandes', '/admin/avis']) {
				await page.goto(path);
				await hydrated(page);

				const size = await overflow(page);

				expect(size.scrollWidth, `${path} deborde en ${viewport.width}px`).toBeLessThanOrEqual(
					size.clientWidth + 1
				);
			}
		});
	}
});

/**
 * Au-dela de 1920 px, le site ne doit pas se contenter d'un cadre centre entoure
 * de vide : le contenu doit reellement occuper la largeur. On mesure le pied de
 * page, qui court d'un bord a l'autre, et la grille produits, qui doit gagner
 * des colonnes plutot que des cartes geantes.
 */
test.describe('tres grands ecrans', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	/** Largeur -> nombre de colonnes attendu dans la grille produits. */
	const EXPECTED_COLUMNS: Record<number, number> = { 1920: 6, 2560: 7, 3440: 7 };

	for (const width of [1920, 2560, 3440]) {
		test(`le contenu occupe la largeur en ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 1200 });
			await page.goto('/');
			await hydrated(page);

			const footerWidth = await page
				.locator('footer')
				.first()
				.evaluate((node) => node.getBoundingClientRect().width);

			expect(footerWidth, `le pied de page reste etroit en ${width}px`).toBeGreaterThan(
				width * 0.95
			);
		});

		test(`la grille produits se densifie en ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 1200 });
			await page.goto('/search');
			await hydrated(page);

			/** Nombre de cartes sur la premiere ligne = nombre de colonnes rendues. */
			const columns = await page.evaluate(() => {
				const grid = document.querySelector('main .grid.grid-cols-2');
				if (!grid) return 0;

				const cards = [...grid.children] as HTMLElement[];
				if (cards.length === 0) return 0;

				const top = cards[0].getBoundingClientRect().top;
				return cards.filter((card) => Math.abs(card.getBoundingClientRect().top - top) < 2).length;
			});

			expect(columns, `${columns} colonne(s) en ${width}px`).toBe(EXPECTED_COLUMNS[width]);
		});
	}
});
