import { describe, expect, test, vi } from 'vitest';

const findMany = vi.fn();
const count = vi.fn();

vi.mock('./client', () => ({
	prisma: {
		review: {
			findMany: (args: unknown) => findMany(args),
			count: (args: unknown) => count(args)
		}
	}
}));

const { countPublishedReviewIds, listReviewsByIds } = await import('./review');

function review(id: string) {
	return { id, authorName: 'Camille', rating: 5, body: 'Tres joli.' };
}

describe('listReviewsByIds', () => {
	test('sans identifiant, aucune requete ne part', async () => {
		findMany.mockClear();

		expect(await listReviewsByIds([])).toEqual([]);
		expect(findMany).not.toHaveBeenCalled();
	});

	test("l'ordre choisi dans l'administration prime sur celui de la base", async () => {
		/** La base rend les lignes dans son propre ordre : ici, l'inverse du voulu. */
		findMany.mockResolvedValue([review('c'), review('a'), review('b')]);

		const result = await listReviewsByIds(['a', 'b', 'c']);

		expect(result.map((row) => row.id)).toEqual(['a', 'b', 'c']);
	});

	test('un avis disparu est simplement retire, sans casser la page', async () => {
		findMany.mockResolvedValue([review('a')]);

		const result = await listReviewsByIds(['a', 'supprime', 'aussi-supprime']);

		expect(result.map((row) => row.id)).toEqual(['a']);
	});

	test('seuls les avis publies sont demandes a la base', async () => {
		findMany.mockResolvedValue([]);

		await listReviewsByIds(['a']);

		expect(findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: { in: ['a'] }, status: 'PUBLISHED' }
			})
		);
	});
});

describe('countPublishedReviewIds', () => {
	test('une selection vide ne compte rien et ne requete pas', async () => {
		count.mockClear();

		expect(await countPublishedReviewIds([])).toBe(0);
		expect(count).not.toHaveBeenCalled();
	});

	test('le comptage porte sur les seuls avis publies', async () => {
		count.mockResolvedValue(2);

		expect(await countPublishedReviewIds(['a', 'b', 'c'])).toBe(2);
		expect(count).toHaveBeenCalledWith({
			where: { id: { in: ['a', 'b', 'c'] }, status: 'PUBLISHED' }
		});
	});
});
