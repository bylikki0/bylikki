import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

/**
 * Tests de bout en bout.
 *
 * Le serveur est celui de developpement : il n'existe pas de script `preview`,
 * et l'adaptateur Vercel ne sert pas le rendu serveur hors plateforme.
 *
 * La base est partagee avec le developpement : la discipline tient lieu de
 * barriere. Tout ce que les tests creent porte le prefixe `e2e+`, et
 * `global-teardown.ts` ne supprime que cela.
 */
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	workers: 1,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : [['list']],
	outputDir: '.playwright-artifacts',
	globalTeardown: './e2e/global-teardown.ts',
	timeout: 45_000,
	expect: { timeout: 10_000 },
	use: {
		baseURL: 'http://localhost:3000',
		locale: 'fr-FR',
		timezoneId: 'Europe/Paris',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},
	projects: [
		{ name: 'setup', testMatch: /.*\.setup\.ts/ },
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] }
	],
	webServer: {
		command: 'bun run sv:dev',
		url: 'http://localhost:3000',
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
		stdout: 'pipe',
		stderr: 'pipe'
	}
});
