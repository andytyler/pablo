import { createChatCompletion, createImageMessageContent } from '$lib/connections/ai';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prompt, imageBase64, messages = [] } = await request.json();

		if (!prompt) {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}

		// Create message content with optional image
		const content = createImageMessageContent(prompt, imageBase64);

		// Prepare messages for the API call
		const apiMessages = [
			...messages,
			{
				role: 'user',
				content
			}
		];

		// Make the API call
		const response = await createChatCompletion(apiMessages, {
			temperature: 0.7,
			max_tokens: 1000
		});

		// Extract the assistant's message from the response
		const assistantMessage = response.choices[0]?.message;

		if (!assistantMessage) {
			return json({ error: 'Failed to get response from AI' }, { status: 500 });
		}

		return json({ message: assistantMessage.content });
	} catch (error) {
		console.error('Error in chat API:', error);
		return json({ error: 'Failed to process chat request' }, { status: 500 });
	}
};
