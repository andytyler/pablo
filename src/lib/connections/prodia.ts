import { createProdia } from 'prodia/v2';
import type { ImageItem } from '../../routes/api/generate-design/step1/design';
import { getImageUrl, uploadImage } from './supabase';
/**
 * Interface with the Prodia API to generate images using the official SDK
 * Uploads generated image to Supabase and returns the public URL
 */
export async function generateImageFromItem(
	item: ImageItem,
	options = {}
): Promise<{ url: string | null; error: Error | null }> {
	const apiKey = import.meta.env.VITE_PRODIA_API_KEY;
	const prodia = createProdia({
		token: apiKey
	});

	try {
		const { description, width, height, colors, objects, mood, composition, style } = item;
		const prompt = `A ${width}x${height} image. ${description}. With ${colors} colors, ${objects} objects, ${mood} mood, ${composition} composition, ${style} style`;
		// Create a job with the SDK using v2 API
		const job = await prodia.job({
			type: 'inference.flux.schnell.txt2img.v1', // Default model
			config: {
				prompt,
				negative_prompt: 'low quality, blurry',
				...options
			}
		});

		// Get the image directly as an array buffer
		const imageBuffer = await job.arrayBuffer();

		// Convert to a Blob
		const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });

		// Create a File object with a unique name using timestamp
		const timestamp = new Date().getTime();
		const filename = `prodia_generated_${timestamp}.jpg`;
		const imageFile = new File([imageBlob], filename, { type: 'image/jpeg' });

		// Upload to Supabase
		const { data, error: uploadError } = await uploadImage(imageFile, 'prodia');

		if (uploadError) {
			console.error('✨ [prodia] Error uploading generated image:', uploadError);
			return { url: null, error: uploadError };
		}

		// Get the public URL
		const { url, error } = await getImageUrl(filename, 'prodia');

		return { url, error };
	} catch (error) {
		console.error('✨ [prodia] Error generating or uploading image:', error);
		return {
			url: null,
			error: error instanceof Error ? error : new Error(String(error))
		};
	}
}

export async function generateImagePlaceholder(prompt: string) {
	return {
		url: 'https://placehold.co/600x400',
		error: null
	};
}
