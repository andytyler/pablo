import type { ChatMessageWithMeta } from '$lib/types';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateDesign, generateDesignConcept } from './design-html';

export const POST: RequestHandler = async ({ request }) => {
	console.log('🔍 [generate-design/step1] Received POST request for design structure');

	try {
		const {
			prompt,
			previous_design_html = '',
			artboard_size = 'unknown',
			skip_concept = false,
			chat_history_messages
		}: {
			prompt: string;
			skip_concept: boolean;
			chat_history_messages: ChatMessageWithMeta[];
			previous_design_html: string;
			artboard_size: string;
		} = await request.json();

		if (!prompt) {
			console.error('🧠 [design-json/step1] ❌ Error: No prompt provided');
			return json({ error: 'No prompt provided' }, { status: 400 });
		}

		let concept: string = '';

		console.log('@ONE', chat_history_messages.length);

		// STEP ONE: Generate design concept
		if (!skip_concept) {
			concept = await generateDesignConcept(chat_history_messages);
		}

		console.log('@TWO', chat_history_messages.length);
		// STEP TWO: Generate the structured design without processing images
		const design_html = await generateDesign(
			concept,
			chat_history_messages,
			artboard_size,
			previous_design_html
		);
		console.log('@THREE', chat_history_messages.length);

		// Validate that the design_json has the expected structure
		if (!design_html) {
			console.error('🧠 [design-json/step1] ❌ Error: Invalid design structure');
			return json(
				{
					error: 'Invalid design structure returned from AI',
					details: 'there was no design html returned'
				},
				{ status: 500 }
			);
		}

		// Return the design with image placeholders and concept
		return json({
			design_generation_id: Math.random().toString(36).substring(2, 10),
			design_concept: concept,
			design_html: design_html
		});
	} catch (error) {
		console.error('🧠 [design-html/step1] ❌ Error in design structure generation:', error);
		return json(
			{
				error: 'STEP ONE ERROR: Failed to generate design structure',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
