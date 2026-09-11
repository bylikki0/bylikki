import { test } from '@playwright/test';
const hydrated = async (p: import('@playwright/test').Page) => { await p.waitForLoadState('load'); await p.waitForTimeout(2500); };

test.use({ storageState: 'e2e/.auth/admin.json' });
test.describe.configure({ timeout: 180_000 });

test('declencheurs', async ({ page }) => {
	const hits: string[] = [];
	let step = 'init';
	const perStep = new Map<string, number>();
	page.on('request', (q) => { if (q.url().includes('/_app/remote/')) perStep.set(step, (perStep.get(step) ?? 0) + 1); });
	const mark = (s: string) => { console.log(`STEP ${step} -> remote=${perStep.get(step) ?? 0}`); step = s; };
	page.on('response', (r) => {
		if (r.status() >= 400 && !r.url().includes('/node_modules/.vite/')) { const line = `[${step}] ${r.status()} ${r.url().slice(0, 160)}`; hits.push(line); console.log('HIT ' + line); }
	});

	const product = async () => { await page.goto('/demo-bracelet-etoile'); await hydrated(page); };

	await product(); mark('survol logo');
	await page.getByRole('link', { name: /retour/ }).first().hover(); await page.waitForTimeout(1500);

	await product(); mark('survol liens pied de page');
	for (const l of await page.locator('footer a').all()) { await l.hover().catch(() => {}); await page.waitForTimeout(250); }
	await page.waitForTimeout(1000);

	await product(); mark('clic suivi');
	await page.locator('footer a[href="/suivi"]').first().click().catch(() => {}); await hydrated(page);
	mark('retour arriere'); await page.goBack(); await hydrated(page);
	mark('avant'); await page.goForward(); await hydrated(page);

	await product(); mark('menu -> accueil');
	await page.getByRole('button', { name: 'Ouvrir le menu' }).click(); await page.waitForTimeout(600);
	await page.locator('aside a[href="/"]').first().click().catch(() => {}); await hydrated(page);

	await product(); mark('admin');
	await page.getByRole('link', { name: 'Admin' }).first().click().catch(() => {}); await hydrated(page);

	console.log('\n=== ' + hits.length + ' echec(s) ===\n' + hits.join('\n'));
});
