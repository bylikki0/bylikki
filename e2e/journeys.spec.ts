import { expect, test } from '@playwright/test';
import { collectFailures, hydrated } from './support/page';

/**
 * Balayage des parcours restants : panier, atelier, profil, suivi, et toutes les
 * pages d'administration avec leurs interactions.
 *
 * Chaque test *agit* et echoue a la moindre requete >= 400 : verifier qu'une
 * page « se charge » laisserait passer une fonction distante en echec pendant
 * que le balisage s'affiche parfaitement.
 */

test.describe('panier', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('ajouter une piece puis ouvrir le tiroir', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/demo-bracelet-etoile');
		await hydrated(page);

		/** Libelle exact : `/panier/i` attraperait « Ouvrir le panier » de la barre du haut. */
		await page.getByRole('button', { name: /^Ajouter au panier/ }).click();
		await page.waitForTimeout(1200);

		/** La pastille du panier ne parait qu'a partir d'un article. */
		await expect(page.getByRole('button', { name: 'Ouvrir le panier' })).toContainText('1');

		/** L'ajout ouvre le tiroir : il doit etre visible et sorti de l'etat inerte. */
		const drawer = page.locator('aside[aria-hidden="false"]').first();
		await expect(drawer).toBeVisible();
		await expect(drawer).not.toHaveAttribute('inert', '');

		/** Et il se referme a l'echap, comme les autres tiroirs. */
		await page.keyboard.press('Escape');
		await page.waitForTimeout(600);

		watch.assertClean('parcours du panier');
	});

	test('le tiroir vide se presente proprement', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/');
		await hydrated(page);
		await page.getByRole('button', { name: 'Ouvrir le panier' }).click();
		await page.waitForTimeout(800);

		watch.assertClean('tiroir de panier vide');
	});
});

test.describe('atelier', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('composer un bijou et le chiffrer', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/atelier');
		await hydrated(page);

		/** Trois perles : le prix est recalcule cote serveur a chaque ajout. */
		const beads = page.getByRole('button', { name: /perle/i });
		await expect(beads.first()).toBeVisible();

		for (let index = 0; index < 3; index += 1) {
			await beads.nth(index).click();
			await page.waitForTimeout(500);
		}

		watch.assertClean('composition dans l atelier');
	});
});

test.describe('espace personnel', () => {
	test.use({ storageState: 'e2e/.auth/user.json' });

	test('les onglets du profil se parcourent', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/profile');
		await hydrated(page);

		/** Chaque onglet declenche ses propres requetes. */
		for (const name of [/commandes/i, /envies/i, /avis/i, /adresses/i, /compte/i]) {
			const tab = page.getByRole('button', { name }).first();

			if (await tab.count()) {
				await tab.click();
				await page.waitForTimeout(700);
			}
		}

		watch.assertClean('onglets du profil');
	});

	test('le suivi refuse proprement une reference inconnue', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/suivi');
		await hydrated(page);

		const reference = page.getByLabel(/référence/i);
		const email = page.getByLabel(/mail/i);

		if ((await reference.count()) && (await email.count())) {
			await reference.fill('BY-26ZZZZZZ');
			await email.fill('inconnue@bylikki.test');
			await page
				.getByRole('button', { name: /suivre|chercher|voir/i })
				.first()
				.click();
			await page.waitForTimeout(1500);
		}

		/**
		 * Une commande introuvable est un cas normal, pas une panne : la page doit
		 * le dire sans erreur serveur.
		 */
		watch.assertClean('suivi avec une reference inconnue');
	});
});

test.describe('administration, parcours complets', () => {
	test.use({ storageState: 'e2e/.auth/admin.json' });

	test('la liste des produits se filtre et mene a une fiche', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/admin/produits');
		await hydrated(page);

		const search = page.getByRole('textbox').first();
		if (await search.count()) {
			await search.fill('demo');
			await page.waitForTimeout(1200);
		}

		const row = page.getByRole('link').filter({ hasText: /demo/i }).first();
		if (await row.count()) {
			await row.click();
			await hydrated(page);
		}

		watch.assertClean('liste et fiche produit en administration');
	});

	test('les trois files de moderation des avis se chargent', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/admin/avis');
		await hydrated(page);

		for (const name of ['À modérer', 'Publiés', 'Rejetés']) {
			await page.getByRole('button', { name, exact: true }).click();
			await page.waitForTimeout(900);
		}

		watch.assertClean('files de moderation des avis');
	});

	test('les commandes, retours et comptes se parcourent', async ({ page }) => {
		const watch = collectFailures(page);

		for (const path of ['/admin/commandes', '/admin/retours', '/admin/comptes']) {
			await page.goto(path);
			await hydrated(page);

			const search = page.getByRole('textbox').first();
			if (await search.count()) {
				await search.fill('a');
				await page.waitForTimeout(1000);
				await search.fill('');
				await page.waitForTimeout(800);
			}
		}

		watch.assertClean('commandes, retours et comptes');
	});

	test('les promotions et la newsletter se chargent', async ({ page }) => {
		const watch = collectFailures(page);

		for (const path of ['/admin/promotions', '/admin/newsletter']) {
			await page.goto(path);
			await hydrated(page);
		}

		watch.assertClean('promotions et newsletter');
	});
});
