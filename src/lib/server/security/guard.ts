import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

export type SessionUser = {
	id: string;
	email: string;
	role: 'USER' | 'ADMIN';
	displayName: string | null;
};

export function getSessionUser(): SessionUser | null {
	return getRequestEvent().locals.user ?? null;
}

export function requireUser(): SessionUser {
	const user = getSessionUser();

	if (!user) {
		error(401, 'Connecte-toi pour accéder à cette fonctionnalité.');
	}

	return user;
}

export function requireAdmin(): SessionUser {
	const user = requireUser();

	if (user.role !== 'ADMIN') {
		error(403, "Cette action est réservée à l'administration de la boutique.");
	}

	return user;
}
