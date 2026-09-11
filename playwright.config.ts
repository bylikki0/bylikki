import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

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
