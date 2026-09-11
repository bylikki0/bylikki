import { expect, test } from '@playwright/test';

test.describe('visiteuse anonyme', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('/admin renvoie vers la connexion', async ({ page }) => {
		await page.goto('/admin');

		await expect(page).toHaveURL(/\/sign/);
	});

	test('/profile renvoie vers la connexion', async ({ page }) => {
		await page.goto('/profile');

		await expect(page).toHaveURL(/\/sign/);
	});

	test('la boutique reste consultable', async ({ page }) => {
		const response = await page.goto('/search');

		expect(response?.status()).toBe(200);
	});
});

test.describe('compte USER', () => {
	test.use({ storageState: 'e2e/.auth/user.json' });

	test('/admin est refuse', async ({ page }) => {
		const response = await page.goto('/admin');

		expect(response?.status()).toBe(403);
	});

	test('le profil, lui, est accessible', async ({ page }) => {
		await page.goto('/profile');

		await expect(page).toHaveURL(/\/profile/);
	});
});

test.describe('compte ADMIN', () => {
	test.use({ storageState: 'e2e/.auth/admin.json' });

	test('le tableau de bord se charge', async ({ page }) => {
		const response = await page.goto('/admin');

		expect(response?.status()).toBe(200);
	});

	test('la page des avis porte la carte « a la une »', async ({ page }) => {
		await page.goto('/admin/avis');

		await expect(page.getByRole('heading', { name: /à la une/i })).toBeVisible();
	});
});
