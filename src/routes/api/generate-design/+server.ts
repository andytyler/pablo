import {
	designToInlineHtml,
	generateStructuredDesign,
	getDesignConcept,
	processStructuredDesignWithImages
} from '$lib/connections/design';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	console.log('🔍 [generate-html] Received POST request');

	try {
		const {
			prompt,
			image_url = null,
			design_json = '',
			artboard_size = null
		}: {
			prompt: string;
			image_url: string | null;
			design_json: string;
			artboard_size: string | null;
		} = await request.json();

		if (!prompt) {
			console.error('🧠 [design-json] ❌ Error: No prompt provided');
			return json({ error: 'No prompt provided' }, { status: 400 });
		}

		const systemMessage = `You are a creative UI designer that generates designs. 
The image you see is the entire area that will be printed with no bleed edge to edge on the paper. 
The design will be printed on paper when finished. Anything outside the area will be cropped off.

Response Rules:
1. ONLY generate JSON that is correct to the schema provided.
2. Your response must ONLY include the raw JSON without any markdown code blocks, explanations or comments.
3. Images must be described in detail, this description will be used to generate an image, be specific.
4. Make sure the JSON is valid to the schema provided and well-formed.

Design Rules:
5. Feel free to use as many elements as needed to create visually appealing designs.
6. Be bold and creative with your designs! Use interesting layouts.
7. Think like a professional visual designer - consider color theory, spacing, typography, and hierarchy.
8. The artboard is the actual artboard you see, so if you are asked to make a poster then the artboard is the poster that will be printed, do not just add an image of a poster in the artboard.
9. Layering matters, use z index to control the order of elements.
10. The background colour should be relevant to the design.
11. It is completley fine to reuse an image cross generations, if you want it to be updated then set the src to null.
12. You must specify each element individually, for example if you want multiple images around the page as a border etc, you must specify each image individually, and wehre they go. It is not acceptable to say 'multiple elemets' around the page, specify each element and where it is places as a new item, this is fine to have lots of similar items.

IMPORTANT: If provided with existing design, modify and improve the existing design rather than creating a completely new one.`;

		const concept = await getDesignConcept({ prompt, image_url });

		// Create message content with the provided concept
		let finalUserPrompt = '';
		const artboardInfo = artboard_size ? `Artboard size: ${artboard_size}. ` : '';

		if (image_url) {
			console.log('🧠 [design-json] Using image for HTML generation');
			finalUserPrompt = `${prompt}\n\nDesign concept: ${concept}\n\n${artboardInfo}\n\nIncluded is the current design image and the following is the current design in JSON format (modify and improve this):\n${design_json}`;
		} else {
			console.log('🧠 [design-json] Using text-only for HTML generation');
			finalUserPrompt = `${prompt}\n\nDesign concept: ${concept}\n\n${artboardInfo}${design_json ? 'Included is the current design image and the following is the current design in JSON format (modify and improve this):\n' + design_json : ''}`;
		}

		const design = await generateStructuredDesign(systemMessage, finalUserPrompt, image_url);
		console.log('🎨 [design-json] design generated', design);

		const processedDesign = await processStructuredDesignWithImages(design);
		console.log('🎨 [design-json] processed design', processedDesign);

		const html = designToInlineHtml(processedDesign);
		console.log('🎨 [design-json] html generated', html);

		return json({
			html,
			design_concept: concept,
			design_json_raw: design,
			design_json_processed: processedDesign
		});
	} catch (error) {
		console.error('🧠 [design-json] ❌ Error in HTML generation:', error);
		return json({ error: 'Failed to process HTML generation request' }, { status: 500 });
	}
};
