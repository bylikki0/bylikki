import { expect, test } from '@playwright/test';
import { collectFailures, hydrated } from './support/page';

test.describe('boutique, visiteuse connectee', () => {
	test.use({ storageState: 'e2e/.auth/user.json' });

	test('le coeur enregistre puis retire la piece', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/search');
		await hydrated(page);
		await page.locator('a[href^="/demo-"]').first().click();
		await hydrated(page);

		const heart = page.getByRole('button', { name: /envies/i }).first();
		await expect(heart).toBeVisible();

		await heart.click();
		await expect(heart).toHaveAttribute('aria-pressed', 'true');

		await heart.click();
		await expect(heart).toHaveAttribute('aria-pressed', 'false');

		watch.assertClean('coeur sur la fiche produit');
	});

	test('le coeur fonctionne aussi depuis une carte de la boutique', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/search');
		await hydrated(page);

		const heart = page.getByRole('button', { name: /envies/i }).first();
		await expect(heart).toBeVisible();
		await heart.click();
		await expect(heart).toHaveAttribute('aria-pressed', 'true');
		await heart.click();

		watch.assertClean('coeur sur une carte');
	});

	test('la fiche produit se parcourt sans erreur', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/demo-bracelet-etoile');
		await hydrated(page);

		const variants = page.getByRole('radio');
		const count = await variants.count();

		for (let index = 0; index < Math.min(count, 3); index += 1) {
			await variants.nth(index).click();
			await page.waitForTimeout(400);
		}

		for (const name of [/description/i, /avis/i, /livraison/i]) {
			const tab = page.getByRole('button', { name }).first();
			if (await tab.count()) {
				await tab.click();
				await page.waitForTimeout(600);
			}
		}

		watch.assertClean('parcours de la fiche produit');
	});

	test('la recherche filtre sans erreur', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/search');
		await hydrated(page);

		const facet = page.getByRole('button', { name: /bijoux/i }).first();
		if (await facet.count()) {
			await facet.click();
			await page.waitForTimeout(900);
			await facet.click();
			await page.waitForTimeout(900);
		}

		watch.assertClean('facettes de la recherche');
	});

	test('ajouter au panier', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/demo-bracelet-etoile');
		await hydrated(page);

		await page.getByRole('button', { name: /^Ajouter au panier/ }).click();
		await page.waitForTimeout(1200);

		await expect(page.getByRole('button', { name: 'Ouvrir le panier' })).toContainText('1');

		watch.assertClean('ajout au panier');
	});
});

test.describe('administration', () => {
	test.use({ storageState: 'e2e/.auth/admin.json' });

	test('la boutique reste saine avec une session ADMIN', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/');
		await hydrated(page);
		await page.goto('/demo-bracelet-etoile');
		await hydrated(page);

		watch.assertClean('boutique vue par une administratrice');
	});

	test('le catalogue se parcourt : univers et criteres', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/admin/catalogue');
		await hydrated(page);

		const edit = page.getByRole('button', { name: 'Modifier' });
		const count = await edit.count();

		for (let index = 0; index < count; index += 1) {
			await edit.nth(index).click();
			await page.waitForTimeout(500);
		}

		watch.assertClean('navigation dans le catalogue');
	});

	test('un formulaire vide est refuse par le navigateur, pas par le serveur', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/admin/catalogue');
		await hydrated(page);

		const save = page.getByRole('button', { name: /enregistrer l.univers/i });
		await expect(save).toBeDisabled();

		await page.getByLabel('Slug').fill('e2e-univers');
		await page.getByLabel('Nom').fill('Univers de test');
		await expect(save).toBeEnabled();

		watch.assertClean('formulaire d univers');
	});

	test('les reglages se chargent', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/admin/parametres');
		await hydrated(page);

		watch.assertClean('page des reglages');
	});
});

test.describe('regles metier', () => {
	test.use({ storageState: 'e2e/.auth/user.json' });

	test('le coeur se remplit sans attendre le serveur', async ({ page }) => {
		await page.goto('/demo-bracelet-etoile');
		await hydrated(page);

		await page.route('**/toggleWishlist', async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 3000));
			await route.continue();
		});

		const heart = page.getByRole('button', { name: /envies/i }).first();
		await heart.click();

		await expect(heart).toHaveAttribute('aria-pressed', 'true', { timeout: 900 });
	});

	test('un avis suppose d avoir recu la piece', async ({ page }) => {
		await page.goto('/demo-bracelet-etoile');
		await hydrated(page);

		const avis = page.getByRole('button', { name: /avis/i }).first();
		if (await avis.count()) {
			await avis.click();
			await page.waitForTimeout(900);
		}

		await expect(
			page.getByText(/reserves aux pieces recues|réservés aux pièces reçues/i)
		).toBeVisible();
		await expect(page.getByRole('button', { name: /publier mon avis|envoyer/i })).toHaveCount(0);
	});
});

test.describe('navigation hors d une page a parametre', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('quitter une fiche produit ne declenche aucune requete en echec', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/demo-bracelet-etoile');
		await hydrated(page);

		await page.getByRole('link', { name: 'Boutique', exact: true }).first().click();
		await hydrated(page);

		await page.goto('/demo-collier-perles');
		await hydrated(page);
		await page
			.getByRole('link', { name: /BYLIKKI, retour/ })
			.first()
			.click();
		await hydrated(page);

		watch.assertClean('sortie de la fiche produit');
	});

	test('survoler les liens depuis une fiche ne declenche aucune requete en echec', async ({
		page
	}) => {
		const watch = collectFailures(page);

		await page.goto('/demo-bracelet-etoile');
		await hydrated(page);

		for (const link of await page.locator('footer a').all()) {
			await link.hover().catch(() => undefined);
			await page.waitForTimeout(250);
		}

		await page.waitForTimeout(1500);

		watch.assertClean('prechargement au survol depuis la fiche');
	});

	test('survoler une autre fiche depuis une fiche ne fige pas la page', async ({ page }) => {
		const watch = collectFailures(page);
		let remoteCalls = 0;
		page.on('request', (request) => {
			if (request.url().includes('/_app/remote/')) {
				remoteCalls += 1;
			}
		});

		await page.goto('/demo-bracelet-etoile');
		await hydrated(page);
		remoteCalls = 0;

		const links = await page.locator('main a[href^="/demo-"]').all();
		expect(links.length).toBeGreaterThan(0);

		for (const link of links) {
			await link.hover();
			await page.waitForTimeout(300);
		}
		await page.waitForTimeout(1500);

		expect(remoteCalls).toBeLessThan(20);
		watch.assertClean('survol d une fiche voisine');
	});
});

test.describe('carrousel de l accueil', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	for (const width of [1100, 1300, 1400, 1600, 2560]) {
		test(`le coverflow ne recouvre pas le texte a ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 1000 });
			await page.goto('/');
			await hydrated(page);

			const hero = page.locator('section').first();
			const text = hero.locator('h1').locator('..');
			const coverflow = hero.locator('> div.absolute.top-0');

			if (width < 1400) {
				await expect(coverflow).toBeHidden();
				return;
			}

			await expect(coverflow).toBeVisible();
			const textBox = await text.boundingBox();
			const cards = await coverflow
				.locator('> div')
				.evaluateAll((nodes) =>
					nodes
						.filter((node) => Number(getComputedStyle(node).opacity) > 0.1)
						.map((node) => node.getBoundingClientRect().left)
				);
			expect(textBox).not.toBeNull();
			expect(Math.min(...cards)).toBeGreaterThanOrEqual(textBox!.x + textBox!.width);
		});
	}
});
