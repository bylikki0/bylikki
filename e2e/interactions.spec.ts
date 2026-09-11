import { expect, test } from '@playwright/test';
import { collectFailures, hydrated } from './support/page';

/**
 * Parcours cliques de bout en bout.
 *
 * La premiere version de ces tests se contentait de verifier qu'une page « se
 * charge » : elle laissait donc passer une fonction distante qui repond 400
 * pendant que le balisage s'affiche tres bien. Ici chaque test *agit*, et toute
 * requete >= 400 fait echouer le test.
 */

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

		/** Premier clic : la piece est mise de cote. */
		await heart.click();
		await expect(heart).toHaveAttribute('aria-pressed', 'true');

		/** Second clic : elle en sort. L'aller-retour prouve que l'ecriture passe. */
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

		/** Chaque variante recalcule le prix cote serveur. */
		const variants = page.getByRole('radio');
		const count = await variants.count();

		for (let index = 0; index < Math.min(count, 3); index += 1) {
			await variants.nth(index).click();
			await page.waitForTimeout(400);
		}

		/** Les onglets de la fiche declenchent chacun leur requete. */
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

		/** Une facette : c'est une requete serveur a chaque bascule. */
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

		/** Libelle exact : `/panier/i` attraperait « Ouvrir le panier » de la barre du haut. */
		await page.getByRole('button', { name: /^Ajouter au panier/ }).click();
		await page.waitForTimeout(1200);

		/** L'ajout doit se voir : la pastille passe de absente a 1. */
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

		/** « Modifier » recharge le formulaire depuis un critere existant. */
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

		/**
		 * Un univers vide ne doit produire aucune requete : le bouton reste
		 * inactif tant que les champs obligatoires ne sont pas remplis. Sans
		 * cela le serveur repondrait une erreur de schema brute, illisible.
		 */
		const save = page.getByRole('button', { name: /enregistrer l.univers/i });
		await expect(save).toBeDisabled();

		/** Rempli, le meme bouton redevient actif. */
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

		/** On retarde la reponse : si l'interface attendait, le coeur resterait vide. */
		await page.route('**/toggleWishlist', async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 3000));
			await route.continue();
		});

		const heart = page.getByRole('button', { name: /envies/i }).first();
		await heart.click();

		/** Moins d'une seconde, alors que le serveur met trois secondes a repondre. */
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

		/**
		 * Ce compte est connecte mais n'a rien commande : le formulaire ne doit pas
		 * paraitre, et la raison doit etre dite -- pas un simple « connecte-toi ».
		 */
		await expect(
			page.getByText(/reserves aux pieces recues|réservés aux pièces reçues/i)
		).toBeVisible();
		await expect(page.getByRole('button', { name: /publier mon avis|envoyer/i })).toHaveCount(0);
	});
});

test.describe('navigation hors d une page a parametre', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	/**
	 * En quittant `/[slug]`, `page.params.slug` devient `undefined` avant que la
	 * fiche soit demontee : ses requetes se reevaluaient une derniere fois avec un
	 * slug vide, que le schema refuse -- d'ou un 400 a chaque sortie de fiche.
	 */
	test('quitter une fiche produit ne declenche aucune requete en echec', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/demo-bracelet-etoile');
		await hydrated(page);

		/** Navigation cote client vers une page sans parametre `slug`. */
		await page.getByRole('link', { name: 'Boutique', exact: true }).first().click();
		await hydrated(page);

		await page.goto('/demo-collier-perles');
		await hydrated(page);
		await page.getByRole('link', { name: /BYLIKKI, retour/ }).first().click();
		await hydrated(page);

		watch.assertClean('sortie de la fiche produit');
	});

	/**
	 * Avec `forkPreloads`, survoler un lien precharge sa destination pendant que la
	 * fiche reste montee : c'est la que `page.params.slug` decrit deja la page
	 * cible. Chaque lien du pied de page est survole, aucune requete ne doit echouer.
	 */
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
});
