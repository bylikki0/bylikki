import { expect, test, type Locator, type Page } from '@playwright/test';
import { E2E_EMAIL_PREFIX, e2ePrisma } from './support/db';
import { collectFailures, hydrated } from './support/page';

const menu = (page: Page) => page.locator('[aria-label="Menu"]');
const firstStackCard = (page: Page) => page.getByTestId('menu-stack').locator('> a').first();
const hoverTab = (card: Locator) => card.hover({ position: { x: 40, y: 24 } });

const motionOf = (locator: Locator) =>
	locator.evaluate((node) => {
		const style = getComputedStyle(node);
		return `${style.translate}|${style.rotate}`;
	});

async function openMenu(page: Page) {
	await page.goto('/');
	await hydrated(page);
	await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
	await expect(menu(page)).not.toHaveAttribute('inert', '');
	await page.waitForTimeout(500);
}

test.describe('tiroir de navigation', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('les cartes du trieur se soulevent au survol et Echap ferme', async ({ page }) => {
		const watch = collectFailures(page);
		await openMenu(page);

		const card = firstStackCard(page);
		const resting = await motionOf(card);
		await hoverTab(card);
		await page.waitForTimeout(450);
		expect(await motionOf(card)).not.toEqual(resting);

		await page.keyboard.press('Escape');
		await expect(menu(page)).toHaveAttribute('inert', '');

		watch.assertClean('tiroir de navigation');
	});

	test('aucun mouvement quand le mouvement est reduit', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await openMenu(page);

		const card = firstStackCard(page);
		await hoverTab(card);
		await page.waitForTimeout(300);

		expect(await motionOf(card)).toBe('none|none');
	});

	test('un lien du trieur navigue et referme le tiroir', async ({ page }) => {
		const watch = collectFailures(page);
		await openMenu(page);

		await page
			.getByRole('navigation', { name: 'Boutique' })
			.getByRole('link', { name: 'Bijoux' })
			.click();
		await page.waitForURL(/category=bijoux/);
		await expect(menu(page)).toHaveAttribute('inert', '');

		watch.assertClean('lien du tiroir');
	});
});

test.describe('administration, outils de la boutique', () => {
	test.use({ storageState: 'e2e/.auth/admin.json' });

	test('le theme de l administration reprend la direction artistique', async ({ page }) => {
		await page.goto('/admin');
		await hydrated(page);

		await expect(page.locator('[data-slot="card"]').first()).toHaveCSS('border-top-width', '2px');
		await expect(page.locator('.admin-shell')).toHaveCSS('font-family', /Quicksand/);
	});

	test('le carrousel se compose sans separateur a taper', async ({ page }) => {
		const prisma = e2ePrisma();
		const row = await prisma.siteSetting.findUnique({ where: { key: 'home' } });
		const watch = collectFailures(page);

		try {
			await page.goto('/admin/parametres');
			await hydrated(page);

			const slides = page.getByRole('listitem', { name: /^Diapositive \d+ sur \d+$/ });
			const count = await slides.count();

			await page.getByRole('button', { name: 'Ajouter une diapositive' }).click();
			await expect(slides).toHaveCount(count + 1);

			const added = slides.last();
			await added.getByLabel('Titre').fill('Diapositive e2e');
			await added.getByLabel('Destination du bouton').selectOption('category');
			await page.getByRole('button', { name: `Monter la diapositive ${count + 1}` }).click();

			const saved = page.waitForResponse(
				(response) =>
					response.url().includes('/_app/remote/') && response.request().method() === 'POST'
			);
			await page.getByRole('button', { name: 'Enregistrer le carrousel' }).click();
			expect((await saved).ok()).toBe(true);

			await page.reload();
			await hydrated(page);
			await expect(slides.nth(count - 1).getByLabel('Titre')).toHaveValue('Diapositive e2e');

			watch.assertClean('edition du carrousel');
		} finally {
			if (row) {
				await prisma.siteSetting.update({
					where: { key: 'home' },
					data: { value: row.value as never }
				});
			} else {
				await prisma.siteSetting.delete({ where: { key: 'home' } }).catch(() => undefined);
			}
			await prisma.$disconnect();
		}
	});

	test('un titre trop court bloque l enregistrement du carrousel', async ({ page }) => {
		await page.goto('/admin/parametres');
		await hydrated(page);

		const first = page.getByRole('listitem', { name: /^Diapositive 1 sur \d+$/ });
		await first.getByLabel('Titre').fill('x');

		await expect(first.getByText('Le titre doit faire au moins 2 caractères.')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Enregistrer le carrousel' })).toBeDisabled();
	});

	test('le tableau de bord signale demandes de remise en stock et coeurs', async ({ page }) => {
		const prisma = e2ePrisma();
		const user = await prisma.user.findFirstOrThrow({
			where: { email: { startsWith: E2E_EMAIL_PREFIX }, role: 'USER' },
			select: { id: true }
		});
		const variant = await prisma.productVariant.findFirstOrThrow({
			where: { product: { slug: { startsWith: 'demo-' } } },
			select: { id: true, productId: true, product: { select: { name: true } } }
		});
		const watch = collectFailures(page);

		await prisma.restockAlert.upsert({
			where: { userId_variantId: { userId: user.id, variantId: variant.id } },
			create: { userId: user.id, variantId: variant.id },
			update: { notifiedAt: null }
		});
		await prisma.wishlistItem.upsert({
			where: { userId_productId: { userId: user.id, productId: variant.productId } },
			create: { userId: user.id, productId: variant.productId },
			update: {}
		});

		try {
			await page.goto('/admin');
			await hydrated(page);

			const restock = page.locator('#remise-en-stock');
			await expect(restock.getByText('Demandes de remise en stock')).toBeVisible();
			await expect(page.getByText('Les plus aimés')).toBeVisible();

			const link = restock.getByRole('link', { name: variant.product.name });
			await expect(link).toBeVisible();
			await link.click();
			await page.waitForURL(`**/admin/produits/${variant.productId}`);

			watch.assertClean('tableau de bord');
		} finally {
			await prisma.restockAlert.deleteMany({ where: { userId: user.id, variantId: variant.id } });
			await prisma.wishlistItem.deleteMany({
				where: { userId: user.id, productId: variant.productId }
			});
			await prisma.$disconnect();
		}
	});
});
