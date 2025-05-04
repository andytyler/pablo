import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateDesign, generateDesignConcept, type StructuredDesign } from './design';

export const POST: RequestHandler = async ({ request }) => {
	console.log('🔍 [generate-design/step1] Received POST request for design structure');

	try {
		const {
			prompt,
			image_urls = [],
			previous_design_json = '',
			artboard_size = 'unknown',
			skip_concept = false,
			uploadedImages = [],
			existingImages = []
		} = await request.json();

		if (!prompt) {
			console.error('🧠 [design-json/step1] ❌ Error: No prompt provided');
			return json({ error: 'No prompt provided' }, { status: 400 });
		}

		console.log('🎨 [design-json/step1] Generating design structure');

		let finalUserPrompt = prompt;
		let concept = null;

		// Add information about existing images if available
		if (existingImages && existingImages.length > 0) {
			const imageCount = existingImages.length;
			finalUserPrompt += `\n\nI have ${imageCount} existing images that can be reused by their image IDs. For references, these are the descriptions:\n`;

			Object.values(existingImages).forEach((img: any, index) => {
				finalUserPrompt += ` Image ID: ${img.id} - Description: ${img.description}\n`;
			});

			finalUserPrompt += `\nTo use an existing image, reference its ID in the design JSON.`;
		}

		if (!skip_concept) {
			concept = await generateDesignConcept({ prompt: finalUserPrompt, images: existingImages });
			finalUserPrompt = `${finalUserPrompt}\n\nDesign concept: ${concept}`;
		}

		// Generate the structured design without processing images
		const design_json = await generateDesign(
			'unknown',
			finalUserPrompt,
			existingImages,
			artboard_size,
			previous_design_json
		);

		// Return the design with image placeholders and concept
		return json({
			design_json: design_json as StructuredDesign,
			step_one_concept: concept,
			design_generation_id: Math.random().toString(36).substring(2, 10)
		});
	} catch (error) {
		console.error('🧠 [design-json/step1] ❌ Error in design structure generation:', error);
		return json(
			{
				error: 'Failed to generate design structure',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
