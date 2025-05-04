import { generateImageFromItem } from '$lib/connections/prodia';
import { removeBackground } from '$lib/connections/replicate';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	console.log('🔍 [generate-design/step2] Received POST request for image processing');

	try {
		const {
			image_item
		}: {
			image_item: any;
		} = await request.json();

		if (!image_item) {
			console.error('🧠 [design-json/step2] ❌ Error: No image item provided');
			return json({ error: 'No image item provided' }, { status: 400 });
		}

		console.log(
			'🖼️ [generate-design/step2] Processing image:',
			image_item.item?.description || 'Unknown image'
		);

		const { url: generatedImgUrl, error: generateImgError } = await generateImageFromItem(
			image_item.item
		);
		let final_img = generatedImgUrl;

		// Remove background if image was generated
		if (generatedImgUrl && image_item.item.remove_background) {
			const { url: imgWOBackgroundUrl, error: removeBackgroundError } =
				await removeBackground(generatedImgUrl);
			if (removeBackgroundError) {
				console.error(
					'🧠 [design-json/step2] ❌ Error removing background:',
					removeBackgroundError
				);
			}
			final_img = imgWOBackgroundUrl || generatedImgUrl;
		}

		if (generateImgError) {
			return json(
				{
					error: `Failed to generate image: ${generateImgError.message}`
				},
				{ status: 500 }
			);
		}

		// Use the image ID if it was provided, otherwise generate one
		const imageId =
			(image_item.item.id ? image_item.item.id : null) ||
			`img_${Math.random().toString(36).substring(2, 10)}`;

		// Return the processed image
		return json({
			success: true,
			image_id: imageId,
			image_url: final_img,
			...image_item
		});
	} catch (error) {
		console.error('🧠 [design-json/step2] ❌ Error processing request:', error);
		return json(
			{
				error: 'Failed to process request',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
