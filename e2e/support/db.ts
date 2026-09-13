import { createHmac, randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

export const E2E_EMAIL_PREFIX = 'e2e+';
export const E2E_USER_AGENT = 'e2e';

export function e2ePrisma() {
	const connectionString = process.env.PRISMA_DATABASE_URL;

	if (!connectionString) {
		throw new Error('PRISMA_DATABASE_URL est absent : les tests ne peuvent pas joindre la base.');
	}

	return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

function hmacHex(scope: string, input: string) {
	const secret = process.env.AUTH_SECRET;

	if (!secret) {
		throw new Error('AUTH_SECRET est absent : impossible de signer pour les tests.');
	}

	return createHmac('sha256', secret).update(`${scope}:${input}`).digest('hex');
}

export function hashSessionToken(token: string) {
	return hmacHex('session', token);
}

export function signUnsubscribe(userId: string) {
	return hmacHex('unsubscribe', userId);
}

export function e2eEmail(label: string) {
	return `${E2E_EMAIL_PREFIX}${label}@bylikki.test`;
}

export async function mintSession(
	prisma: PrismaClient,
	options: { label: string; role: 'USER' | 'ADMIN' }
) {
	const email = e2eEmail(options.label);

	const user = await prisma.user.upsert({
		where: { email },
		create: { email, role: options.role, emailVerifiedAt: new Date(), displayName: 'Test' },
		update: { role: options.role },
		select: { id: true, email: true }
	});

	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

	await prisma.session.create({
		data: {
			userId: user.id,
			secretHash: hashSessionToken(token),
			expiresAt,
			ipHash: null,
			userAgentLabel: E2E_USER_AGENT
		}
	});

	return { token, expiresAt, user };
}

export function sessionCookie(token: string, expiresAt: Date) {
	return {
		name: 'bylikki_session',
		value: token,
		domain: 'localhost',
		path: '/',
		httpOnly: true,
		secure: false,
		sameSite: 'Lax' as const,
		expires: Math.floor(expiresAt.getTime() / 1000)
	};
}
