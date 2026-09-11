import { expect, type Page } from '@playwright/test';

export async function hydrated(page: Page) {
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(400);
}

export function collectFailures(page: Page) {
	const failures: string[] = [];

	page.on('response', (response) => {
		const viteReoptimizing =
			response.status() === 504 && response.url().includes('/node_modules/.vite/');

		if (response.status() >= 400 && !viteReoptimizing) {
			failures.push(`HTTP ${response.status()} ${response.request().method()} ${response.url()}`);
		}
	});

	page.on('pageerror', (error) => {
		failures.push(`ERREUR PAGE ${error.message}`);
	});

	return {
		failures,
		assertClean(context: string) {
			expect(failures, `${context} :\n${failures.join('\n')}`).toEqual([]);
		}
	};
}
