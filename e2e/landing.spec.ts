import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectFailures, hydrated } from './support/page';

test.use({ storageState: { cookies: [], origins: [] } });

async function centerOf(locator: Locator) {
	const box = await locator.boundingBox();
	expect(box).not.toBeNull();
	return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

async function drag(page: Page, from: Locator, to: { x: number; y: number }) {
	const start = await centerOf(from);
	await page.mouse.move(start.x, start.y);
	await page.mouse.down();
	await page.mouse.move(start.x + 8, start.y + 8, { steps: 4 });
	await page.mouse.move(to.x, to.y, { steps: 20 });
	await page.waitForTimeout(250);
	await page.mouse.up();
	await page.waitForTimeout(400);
}

const colorsOf = (list: Locator) =>
	list
		.locator('li [role="button"]')
		.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('style')));

test.describe('fil de perles de l accueil', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await hydrated(page);
		await page.getByTestId('bead-strand').scrollIntoViewIfNeeded();
	});

	test('une perle tiree de la palette se pose sur le fil', async ({ page }) => {
		const watch = collectFailures(page);
		const strandList = page.getByTestId('bead-strand');
		const palette = page.getByTestId('bead-palette');
		const before = await strandList.locator('li').count();
		const paletteSize = await palette.locator('li').count();

		await drag(
			page,
			palette.locator('li').last(),
			await centerOf(strandList.locator('li').first())
		);

		await expect(strandList.locator('li')).toHaveCount(before + 1);
		await expect(palette.locator('li')).toHaveCount(paletteSize);

		watch.assertClean('depot d une perle sur le fil');
	});

	test('les perles du fil se reordonnent', async ({ page }) => {
		const strandList = page.getByTestId('bead-strand');
		const before = await colorsOf(strandList);
		const last = strandList.locator('li').last();
		const box = await last.boundingBox();

		await drag(page, strandList.locator('li [role="button"]').first(), {
			x: box!.x + box!.width - 2,
			y: box!.y + box!.height / 2
		});

		const after = await colorsOf(strandList);
		expect(after).toHaveLength(before.length);
		expect(after).not.toEqual(before);
		expect([...after].sort()).toEqual([...before].sort());
	});

	test('un clic enfile au bout, un clic sur le fil retire', async ({ page }) => {
		const strandList = page.getByTestId('bead-strand');
		const before = await strandList.locator('li').count();

		await page.getByRole('button', { name: 'Ajouter cette perle' }).first().click();
		await expect(strandList.locator('li')).toHaveCount(before + 1);

		await strandList.locator('li [role="button"]').last().click();
		await expect(strandList.locator('li')).toHaveCount(before);
	});
});

test.describe('fil de l atelier', () => {
	test.use({ viewport: { width: 1280, height: 1100 } });

	test('une perle glissee depuis la palette rejoint le fil', async ({ page }) => {
		const watch = collectFailures(page);
		await page.goto('/atelier');
		await hydrated(page);

		const strandList = page.getByTestId('atelier-strand');
		const palette = page.getByTestId('atelier-palette-BEAD');
		const paletteSize = await palette.locator('li').count();

		await drag(page, palette.locator('li').first(), await centerOf(strandList));
		await expect(strandList.locator('li')).toHaveCount(1);

		await drag(
			page,
			palette.locator('li').nth(1),
			await centerOf(strandList.locator('li').first())
		);
		await expect(strandList.locator('li')).toHaveCount(2);
		await expect(palette.locator('li')).toHaveCount(paletteSize);

		watch.assertClean('glisser-deposer dans l atelier');
	});
});

test.describe('carrousel superpose sur telephone', () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test('les cartes sont superposees et tournent', async ({ page }) => {
		const watch = collectFailures(page);
		await page.goto('/');
		await hydrated(page);

		const coverflow = page.getByTestId('hero-coverflow-mobile');
		await expect(coverflow).toBeVisible();

		const front = coverflow.locator('> div:not([inert])');
		await expect(front).toHaveCount(1);
		const first = (await front.textContent()) ?? '';

		const visible = await coverflow
			.locator('> div')
			.evaluateAll(
				(nodes) => nodes.filter((node) => Number(getComputedStyle(node).opacity) > 0.5).length
			);
		expect(visible).toBeGreaterThan(1);

		await page.getByRole('button', { name: 'Création suivante' }).click();
		await expect(front).not.toHaveText(first);

		const box = await coverflow.boundingBox();
		await page.mouse.move(box!.x + 60, box!.y + box!.height / 2);
		await page.mouse.down();
		await page.mouse.move(box!.x + 260, box!.y + box!.height / 2, { steps: 12 });
		await page.mouse.up();
		await expect(front).toHaveText(first);
		await expect(page).toHaveURL('/');

		watch.assertClean('carrousel sur telephone');
	});
});
