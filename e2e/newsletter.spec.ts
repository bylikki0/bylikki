import { expect, test } from '@playwright/test';
import { E2E_EMAIL_PREFIX, e2ePrisma, signUnsubscribe } from './support/db';
import { collectFailures, hydrated } from './support/page';

const SUBJECT_PREFIX = 'e2e campagne';

test.describe('newsletter, administration', () => {
	test.use({ storageState: 'e2e/.auth/admin.json' });

	test.afterEach(async () => {
		const prisma = e2ePrisma();

		try {
			await prisma.newsletterIssue.deleteMany({
				where: { subject: { startsWith: SUBJECT_PREFIX } }
			});
		} finally {
			await prisma.$disconnect();
		}
	});

	test('composer, prévisualiser, programmer puis supprimer une campagne', async ({ page }) => {
		const watch = collectFailures(page);
		const subject = `${SUBJECT_PREFIX} ${Date.now()}`;

		await page.goto('/admin/newsletter');
		await hydrated(page);

		await page.getByLabel('Objet').fill(subject);
		await page.getByLabel('Pré-en-tête').fill('Trois pièces sorties de l’atelier');
		await page
			.getByLabel('Contenu')
			.fill('Bonjour ! Voici les nouveautés de la semaine, cousues main.');
		await page.getByLabel('Texte du bouton').fill('Voir la boutique');
		await page.getByLabel('Lien du bouton').fill('/search');

		await expect(page.getByTestId('newsletter-preview')).toHaveAttribute(
			'srcdoc',
			new RegExp(subject)
		);
		await expect(page.getByTestId('audience-count')).toContainText(/destinataire/);

		await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
		const card = page.getByRole('article', { name: subject });
		await expect(card).toBeVisible();
		await expect(card.getByText('Brouillon', { exact: true })).toBeVisible();

		await card.getByRole('button', { name: 'Programmer', exact: true }).click();
		await expect(card.getByText(/^Programmée/)).toBeVisible();

		await card.getByRole('button', { name: 'Annuler la programmation' }).click();
		await expect(card.getByText('Brouillon', { exact: true })).toBeVisible();

		await card.getByRole('button', { name: 'Supprimer' }).click();
		await expect(card).toHaveCount(0);

		watch.assertClean('campagne de newsletter');
	});

	test('le bouton sans lien est signalé et bloque l enregistrement', async ({ page }) => {
		await page.goto('/admin/newsletter');
		await hydrated(page);

		await page.getByLabel('Objet').fill(`${SUBJECT_PREFIX} incomplet`);
		await page.getByLabel('Contenu').fill('Une lettre assez longue pour être valable.');
		await page.getByLabel('Texte du bouton').fill('Voir');

		await expect(page.getByText('Le bouton a besoin d’un texte et d’un lien.')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Enregistrer le brouillon' })).toBeDisabled();
	});

	test('le ciblage met à jour le nombre de destinataires', async ({ page }) => {
		const watch = collectFailures(page);

		await page.goto('/admin/newsletter');
		await hydrated(page);

		const count = page.getByTestId('audience-count');
		await page.getByLabel('Audience').selectOption('CUSTOMERS');
		await expect(count).toContainText(/\d+ destinataire/);

		await page.getByLabel('Audience').selectOption('WISHLISTED');
		await expect(count).toContainText('Choisis l’audience');
		await expect(page.getByLabel('Produit ciblé')).toBeVisible();

		await page.getByLabel('Audience').selectOption('INACTIVE');
		await expect(count).toContainText(/\d+ destinataire/);

		watch.assertClean('ciblage de newsletter');
	});
});

test.describe('désinscription', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	async function withSubscriber(run: (userId: string) => Promise<void>) {
		const prisma = e2ePrisma();
		const user = await prisma.user.findFirstOrThrow({
			where: { email: { startsWith: E2E_EMAIL_PREFIX }, role: 'USER' },
			select: { id: true }
		});
		const key = { userId_type: { userId: user.id, type: 'NEWSLETTER' as const } };
		const previous = await prisma.userConsent.findUnique({ where: key });

		await prisma.userConsent.upsert({
			where: key,
			create: { userId: user.id, type: 'NEWSLETTER', granted: true },
			update: { granted: true }
		});

		try {
			await run(user.id);
		} finally {
			if (previous) {
				await prisma.userConsent.update({ where: key, data: { granted: previous.granted } });
			} else {
				await prisma.userConsent.deleteMany({ where: { userId: user.id, type: 'NEWSLETTER' } });
			}
			await prisma.$disconnect();
		}
	}

	async function isSubscribed(userId: string) {
		const prisma = e2ePrisma();

		try {
			const consent = await prisma.userConsent.findUnique({
				where: { userId_type: { userId, type: 'NEWSLETTER' } }
			});
			return consent?.granted ?? false;
		} finally {
			await prisma.$disconnect();
		}
	}

	test('le lien de l e-mail demande confirmation avant de désinscrire', async ({ page }) => {
		await withSubscriber(async (userId) => {
			const watch = collectFailures(page);

			await page.goto(`/desinscription?u=${userId}&s=${signUnsubscribe(userId)}`);
			await hydrated(page);
			expect(await isSubscribed(userId)).toBe(true);

			await page.getByRole('button', { name: 'Me désinscrire' }).click();
			await expect(
				page.getByRole('heading', { name: 'Tu ne recevras plus la lettre' })
			).toBeVisible();
			expect(await isSubscribed(userId)).toBe(false);

			watch.assertClean('désinscription confirmée');
		});
	});

	test('la désinscription en un clic des messageries répond 200', async ({ request }) => {
		await withSubscriber(async (userId) => {
			const response = await request.post(
				`/api/newsletter/desinscription?u=${userId}&s=${signUnsubscribe(userId)}`,
				{ form: { 'List-Unsubscribe': 'One-Click' } }
			);

			expect(response.status()).toBe(200);
			expect(await isSubscribed(userId)).toBe(false);
		});
	});

	test('une signature invalide est refusée', async ({ request }) => {
		const response = await request.post('/api/newsletter/desinscription?u=inconnu&s=faux', {
			form: { 'List-Unsubscribe': 'One-Click' }
		});

		expect(response.status()).toBe(400);
	});

	test('la tâche planifiée de newsletter exige son jeton', async ({ request }) => {
		const response = await request.get('/api/cron/newsletter');

		expect([401, 503]).toContain(response.status());
	});
});
