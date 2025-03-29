import { createVisionChat } from '$lib/connections/ai';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prompt, imageBase64, messages } = await request.json();

		if (!prompt) {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}

		const response = await createVisionChat(prompt, imageBase64, messages || []);

		return response;
	} catch (error) {
		console.error('Error in chat API:', error);
		return json({ error: 'Failed to process chat request' }, { status: 500 });
	}
};
