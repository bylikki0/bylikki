import path from 'node:path';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		port: 3000,
		strictPort: true
	},
	build: {
		assetsInlineLimit: (filePath) =>
			filePath.includes('/assets/cards/') || filePath.includes('\\assets\\cards\\')
				? false
				: undefined
	},
	plugins: [
		tailwindcss(),
		...(process.env.ANALYZE === 'true'
			? [visualizer({ filename: 'stats.html', gzipSize: true, brotliSize: true })]
			: []),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				experimental: { async: true }
			},
			adapter: adapter({ runtime: 'nodejs22.x' }),
			csrf: { trustedOrigins: ['*'] },
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'worker-src': ['self', 'blob:'],
					'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
					'font-src': ['self', 'data:', 'https://fonts.gstatic.com'],
					'img-src': ['self', 'data:', 'https://*.public.blob.vercel-storage.com'],
					'connect-src': ['self'],
					'form-action': ['self'],
					'frame-ancestors': ['none'],
					'base-uri': ['self'],
					'object-src': ['none']
				}
			},
			experimental: {
				remoteFunctions: true,
				handleRenderingErrors: true
			},
			alias: {
				$prisma: path.resolve('./generated/prisma'),
				'$prisma/*': path.resolve('./generated/prisma')
			},
			prerender: {
				handleHttpError: ({ path, message }) => {
					if (path === '/') {
						return;
					}
					throw new Error(message);
				}
			}
		})
	],
	resolve: {
		alias: {
			$prisma: path.resolve('./generated/prisma')
		}
	}
});
