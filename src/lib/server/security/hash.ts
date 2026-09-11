import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

const DEV_FALLBACK_SECRET = 'bylikki-dev-secret-do-not-use-in-production';

function readSecret(name: 'AUTH_SECRET' | 'OTP_PEPPER') {
	const value = env[name];

	if (value) {
		return value;
	}

	if (!dev) {
		throw new Error(`${name} est absent : impossible de securiser les identifiants.`);
	}

	return `${DEV_FALLBACK_SECRET}:${name}`;
}

export function sha256Hex(input: string) {
	return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function hmacHex(scope: string, input: string) {
	return createHmac('sha256', readSecret('AUTH_SECRET')).update(`${scope}:${input}`).digest('hex');
}

export function generateSecretToken(byteLength = 32) {
	return randomBytes(byteLength).toString('base64url');
}

export function generateNumericCode(length: number) {
	let code = '';

	for (let index = 0; index < length; index += 1) {
		code += randomInt(0, 10).toString();
	}

	return code;
}

export function hashSessionToken(token: string) {
	return hmacHex('session', token);
}

export function hashOtpCode(email: string, code: string) {
	return sha256Hex(`${readSecret('OTP_PEPPER')}:otp:${email.toLowerCase()}:${code}`);
}

export function hashClientAddress(event: RequestEvent) {
	try {
		return hmacHex('ip', event.getClientAddress());
	} catch {
		return null;
	}
}

export function signUnsubscribe(userId: string) {
	return hmacHex('unsubscribe', userId);
}

export function verifyUnsubscribe(userId: string, signature: string) {
	return safeEqual(signUnsubscribe(userId), signature);
}

export function safeEqual(left: string, right: string) {
	const leftBuffer = Buffer.from(left, 'utf8');
	const rightBuffer = Buffer.from(right, 'utf8');

	if (leftBuffer.length !== rightBuffer.length) {
		return false;
	}

	return timingSafeEqual(leftBuffer, rightBuffer);
}
