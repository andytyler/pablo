import { OpenAIStream, StreamingTextResponse } from 'ai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';
import { formatMessageWithImage, openai, VISION_MODEL } from './openai';

/**
 * Creates a streaming response from the OpenAI API with vision capabilities
 * @param prompt - The user's text prompt
 * @param imageBase64 - Optional base64 encoded image to include with the message
 * @param previousMessages - Optional array of previous chat messages for context
 * @returns A streaming text response from the OpenAI API
 */
export async function createVisionChat(
	prompt: string,
	imageBase64: string | null = null,
	previousMessages: ChatCompletionMessageParam[] = []
) {
	try {
		// Format messages with the image if provided
		const messages = formatMessageWithImage(prompt, imageBase64);

		// Add previous messages if they exist
		const allMessages = [...previousMessages, ...messages];

		// Create a chat completion with streaming
		const response = await openai.chat.completions.create({
			model: VISION_MODEL,
			messages: allMessages,
			max_tokens: 1000,
			temperature: 0.7,
			stream: true
		});

		// Convert the response to a streaming text response
		const stream = OpenAIStream(response);
		return new StreamingTextResponse(stream);
	} catch (error) {
		console.error('Error creating vision chat:', error);
		throw error;
	}
}
