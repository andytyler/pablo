import type { ChatMessageWithMeta } from '$lib/types';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateDesign, generateDesignConcept, type StructuredDesign } from './design';

export const POST: RequestHandler = async ({ request }) => {
	console.log('🔍 [generate-design/step1] Received POST request for design structure');

	try {
		const {
			prompt,
			previous_design_json = '',
			artboard_size = 'unknown',
			skip_concept = false,
			chat_history_messages
		}: {
			prompt: string;
			skip_concept: boolean;
			chat_history_messages: ChatMessageWithMeta[];
			previous_design_json: string;
			artboard_size: string;
		} = await request.json();

		if (!prompt) {
			console.error('🧠 [design-json/step1] ❌ Error: No prompt provided');
			return json({ error: 'No prompt provided' }, { status: 400 });
		}

		console.log('🎨 [design-json/step1] Generating design structure');

		let finalUserPrompt = prompt;
		let concept: string = '';

		// STEP ONE: Generate design concept
		if (!skip_concept) {
			console.log('🎨 (+server.ts) [design-json/step1] Generating design concept');
			console.log(
				'🎨 (+server.ts) [design-json/step1] chat_history_messages',
				chat_history_messages
			);
			concept = await generateDesignConcept(chat_history_messages);
		}

		// STEP TWO: Generate the structured design without processing images
		const design_json = await generateDesign(
			chat_history_messages,
			artboard_size,
			previous_design_json
		);

		// Validate that the design_json has the expected structure
		if (!design_json || !design_json.artboard) {
			console.error('🧠 [design-json/step1] ❌ Error: Invalid design structure');
			return json(
				{
					error: 'Invalid design structure returned from AI',
					details: 'Missing artboard property'
				},
				{ status: 500 }
			);
		}

		if (
			typeof design_json.artboard.width !== 'number' ||
			typeof design_json.artboard.height !== 'number'
		) {
			console.error('🧠 [design-json/step1] ❌ Error: Invalid artboard dimensions');
			return json(
				{
					error: 'Invalid artboard dimensions returned from AI',
					details: 'Width and height must be numbers'
				},
				{ status: 500 }
			);
		}

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
				error: 'STEP ONE ERROR: Failed to generate design structure',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
