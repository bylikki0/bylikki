import { test as setup } from '@playwright/test';
import { e2ePrisma, mintSession, sessionCookie } from './support/db';

setup('forge les sessions de test', async ({ browser }) => {
	const prisma = e2ePrisma();

	try {
		for (const [role, path] of [
			['ADMIN', 'e2e/.auth/admin.json'],
			['USER', 'e2e/.auth/user.json']
		] as const) {
			const { token, expiresAt } = await mintSession(prisma, {
				label: role.toLowerCase(),
				role
			});

			const context = await browser.newContext();
			await context.addCookies([sessionCookie(token, expiresAt)]);
			await context.storageState({ path });
			await context.close();
		}
	} finally {
		await prisma.$disconnect();
	}
});
