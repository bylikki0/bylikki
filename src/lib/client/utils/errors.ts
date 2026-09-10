import { dev } from '$app/environment';

/**
 * Message a montrer apres l'echec d'une fonction distante.
 *
 * Une remote function qui echoue rejette avec `{ status, body: { message } }`,
 * et non avec une `Error` : sans cette lecture, le message ecrit cote serveur
 * n'atteindrait jamais la personne.
 */
export function toMessage(error: unknown, fallback: string) {
	if (error && typeof error === 'object' && 'body' in error) {
		const body = (error as { body?: { message?: unknown } }).body;

		if (body && typeof body.message === 'string' && body.message !== '') {
			return body.message;
		}
	}

	/**
	 * Tout le reste est une panne, pas un message : coupure reseau, erreur Prisma
	 * remontee telle quelle, exception inattendue. Le texte de ces erreurs n'est
	 * ni comprehensible ni destine a la cliente, et peut decrire l'interieur du
	 * serveur. On s'en tient au repli, et on ne l'affiche qu'en developpement.
	 */
	if (dev && error instanceof Error && error.message !== '') {
		return `${fallback} (${error.message})`;
	}

	return fallback;
}
