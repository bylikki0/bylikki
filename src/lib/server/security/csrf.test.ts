import { describe, expect, it } from 'vitest';
import { isCrossSiteFormSubmission } from './csrf';

const ownOrigin = 'https://bylikki.fr';

const submission = (overrides: Partial<Parameters<typeof isCrossSiteFormSubmission>[0]> = {}) =>
	isCrossSiteFormSubmission({
		method: 'POST',
		contentType: 'application/x-www-form-urlencoded',
		origin: 'https://ailleurs.example',
		pathname: '/desinscription',
		ownOrigin,
		...overrides
	});

describe('isCrossSiteFormSubmission', () => {
	it('bloque un formulaire venu d une autre origine', () => {
		expect(submission()).toBe(true);
	});

	it('bloque un formulaire sans en-tête Origin', () => {
		expect(submission({ origin: null })).toBe(true);
	});

	it('bloque aussi les formulaires multipart', () => {
		expect(submission({ contentType: 'multipart/form-data; boundary=abc' })).toBe(true);
	});

	it('laisse passer un formulaire de la boutique', () => {
		expect(submission({ origin: ownOrigin })).toBe(false);
	});

	it('laisse passer les requêtes JSON et les lectures', () => {
		expect(submission({ contentType: 'application/json' })).toBe(false);
		expect(submission({ method: 'GET' })).toBe(false);
	});

	it('laisse passer la désinscription en un clic des messageries', () => {
		expect(submission({ origin: null, pathname: '/api/newsletter/desinscription' })).toBe(false);
	});
});
