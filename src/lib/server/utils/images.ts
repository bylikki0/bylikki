import sharp from 'sharp';

export type ProcessedImage = {
	data: Buffer;
	width: number;
	height: number;
	contentType: 'image/webp';
	extension: 'webp';
};

type ImagePreset = { maxWidth: number; maxHeight: number; quality: number };

export const imagePresets = {
	avatar: { maxWidth: 320, maxHeight: 320, quality: 72 },
	review: { maxWidth: 1280, maxHeight: 1280, quality: 74 },
	product: { maxWidth: 1600, maxHeight: 1600, quality: 78 }
} satisfies Record<string, ImagePreset>;

export async function processImage(
	file: File,
	preset: keyof typeof imagePresets
): Promise<ProcessedImage> {
	const { maxWidth, maxHeight, quality } = imagePresets[preset];
	const input = Buffer.from(await file.arrayBuffer());

	const { data, info } = await sharp(input, { failOn: 'error' })
		.rotate()
		.resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true })
		.webp({ quality, effort: 4 })
		.toBuffer({ resolveWithObject: true });

	return {
		data,
		width: info.width,
		height: info.height,
		contentType: 'image/webp',
		extension: 'webp'
	};
}
