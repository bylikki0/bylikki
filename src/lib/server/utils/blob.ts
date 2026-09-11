import { del, put } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import { processImage, type imagePresets } from './images';

const UPLOAD_TIMEOUT_MS = 20_000;

function withTimeout<T>(operation: Promise<T>, label: string) {
	return Promise.race([
		operation,
		new Promise<never>((_, reject) => {
			setTimeout(
				() => reject(new Error(`${label} : le stockage n'a pas repondu a temps.`)),
				UPLOAD_TIMEOUT_MS
			);
		})
	]);
}

function readToken() {
	if (!env.BLOB_READ_WRITE_TOKEN) {
		throw new Error("BLOB_READ_WRITE_TOKEN est absent : impossible de stocker l'image.");
	}

	return env.BLOB_READ_WRITE_TOKEN;
}

export function isBlobConfigured() {
	return Boolean(env.BLOB_READ_WRITE_TOKEN);
}

export async function uploadImage(
	folder: 'avatars' | 'avis' | 'produits',
	file: File,
	preset: keyof typeof imagePresets
) {
	const image = await processImage(file, preset);

	const blob = await withTimeout(
		put(`${folder}/image.${image.extension}`, image.data, {
			access: 'public',
			addRandomSuffix: true,
			contentType: image.contentType,
			cacheControlMaxAge: 60 * 60 * 24 * 365,
			abortSignal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
			token: readToken(),
			...(env.BLOB_STORE_ID ? { storeId: env.BLOB_STORE_ID } : {})
		}),
		'envoi'
	);

	return { url: blob.url, width: image.width, height: image.height };
}

export async function deleteImage(url: string | null) {
	if (!url || !isBlobConfigured()) {
		return;
	}

	try {
		await withTimeout(
			del(url, { token: readToken(), abortSignal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS) }),
			'suppression'
		);
	} catch (error) {
		console.warn('[blob] suppression impossible', error);
	}
}
