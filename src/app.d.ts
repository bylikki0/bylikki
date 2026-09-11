import type { SessionUser } from '$lib/server/security/guard';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
			session: { id: string; expiresAt: Date } | null;
		}
	}
}

export {};
