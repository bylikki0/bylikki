import type { SessionUser } from '$lib/server/security/guard';

declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
			session: { id: string; expiresAt: Date } | null;
		}
	}
}

export {};
