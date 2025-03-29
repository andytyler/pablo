import OpenAI from 'openai';
import { VISION_MODEL } from './openai';

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({
	apiKey: import.meta.env.VITE_OPENAI_API_KEY
});

/**
 * Creates a chat completion with the OpenAI API
 * @param messages - Array of chat messages
 * @param options - Additional options for the API call
 * @returns The response from the OpenAI API
 */
export async function createChatCompletion(messages: any[], options = {}) {
	try {
		return await openai.chat.completions.create({
			model: VISION_MODEL,
			messages,
			...options
		});
	} catch (error) {
		console.error('Error calling OpenAI:', error);
		throw error;
	}
}

/**
 * Converts an image to a message content format for OpenAI's vision model
 * @param text - The text part of the message
 * @param imageBase64 - Base64 encoded image data
 * @returns Formatted content for the OpenAI API
 */
export function createImageMessageContent(text: string, imageBase64: string | null) {
	if (!imageBase64) {
		return text;
	}

	return [
		{ type: 'text', text },
		{
			type: 'image_url',
			image_url: {
				url: `data:image/png;base64,${imageBase64}`,
				detail: 'high'
			}
		}
	];
}
