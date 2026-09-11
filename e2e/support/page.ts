import { expect, type Page } from '@playwright/test';

/**
 * Attend la fin de l'hydratation avant d'interagir.
 *
 * Les pages partent completes dans le HTML et les fonctions distantes sont
 * attendues cote serveur : un clic emis trop tot atterrit sur un balisage encore
 * inerte, sans gestionnaire.
 */
export async function hydrated(page: Page) {
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(400);
}

/**
 * Collecte les echecs reseau et les erreurs de page.
 *
 * Un test qui verifie seulement qu'une page « se charge » laisse passer
 * exactement les pannes signalees en boutique : une fonction distante qui repond
 * 400 ou 500 pendant que le balisage, lui, s'affiche tres bien.
 */
export function collectFailures(page: Page) {
	const failures: string[] = [];

	page.on('response', (response) => {
		/**
		 * Seule exception : le 504 « Outdated Optimize Dep » que Vite renvoie quand il
		 * re-optimise ses dependances en cours de route. C'est le serveur de
		 * developpement qui se reorganise, pas le site qui echoue.
		 */
		const viteReoptimizing =
			response.status() === 504 && response.url().includes('/node_modules/.vite/');

		if (response.status() >= 400 && !viteReoptimizing) {
			failures.push(`HTTP ${response.status()} ${response.request().method()} ${response.url()}`);
		}
	});

	page.on('pageerror', (error) => {
		failures.push(`ERREUR PAGE ${error.message}`);
	});

	return {
		failures,
		/** Aucune requete en echec ne doit subsister a la fin du parcours. */
		assertClean(context: string) {
			expect(failures, `${context} :\n${failures.join('\n')}`).toEqual([]);
		}
	};
}
