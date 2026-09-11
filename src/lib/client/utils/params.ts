import { page } from '$app/state';

/**
 * Parametre de route qui garde sa derniere valeur non vide.
 *
 * Quand on quitte une page a parametre -- navigation, retour arriere, ou
 * prechargement au survol d'un lien (`forkPreloads`) -- `page.params` decrit deja
 * la destination alors que la page sortante est encore montee. Ses `$derived` se
 * reevaluent une derniere fois avec un parametre `undefined` : relu en `''`, il
 * partait dans une fonction distante qui le refusait, d'ou un 400.
 *
 * A appeler une fois a l'initialisation du composant, puis a lire dans un
 * `$derived` pour rester reactif :
 *
 *     const readSlug = stickyParam('slug');
 *     const slug = $derived(readSlug());
 */
export function stickyParam(name: string) {
	let last = page.params[name] ?? '';

	return () => {
		const current = page.params[name];

		if (current) {
			last = current;
		}

		return last;
	};
}
