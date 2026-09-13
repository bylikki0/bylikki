import { expect, test } from '@playwright/test';
import { e2ePrisma, mintSession, sessionCookie } from './support/db';
import { collectFailures, hydrated } from './support/page';

test.use({ storageState: { cookies: [], origins: [] } });

test('se déconnecter ramène à l accueil sans erreur de redirection', async ({ page, context }) => {
	const prisma = e2ePrisma();

	try {
		const { token, expiresAt } = await mintSession(prisma, { label: 'deconnexion', role: 'USER' });
		await context.addCookies([sessionCookie(token, expiresAt)]);
	} finally {
		await prisma.$disconnect();
	}

	const watch = collectFailures(page);

	await page.goto('/profile');
	await hydrated(page);

	await page.getByRole('button', { name: 'Se déconnecter' }).click();
	await page.waitForURL((url) => url.pathname === '/');
	await hydrated(page);

	await page.goto('/profile');
	await expect(page).toHaveURL(/\/sign/);

	watch.assertClean('déconnexion');
});
