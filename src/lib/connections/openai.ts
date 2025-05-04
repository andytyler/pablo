import type { ChatMessageWithMeta } from '$lib/types';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import type { z } from 'zod';

// Initialize the OpenAI client with API key from environment variables
export const openai = new OpenAI({
	apiKey: import.meta.env.VITE_OPENAI_API_KEY
});

// Specify the model that supports vision capabilities
export const VISION_MODEL = 'o4-mini-2025-04-16';

export async function askGPT<T>(
	system: string = 'You are a helpful assistant .',
	prompt: string,
	images: { id: string; url: string; description: string }[],
	options = {},
	schema?: z.ZodType<T>
) {
	try {
		console.log('*---askGPTWithOptionalImage---*');
		console.log('✨ [OPENAI] system', system);

		if (!prompt) {
			console.error('✨ [OPENAI] Error: prompt parameter is undefined or null');
			prompt = 'Analyze this design';
		}

		let image_urls_array: OpenAI.ChatCompletionContentPart[] = [];
		if (images && images.length > 0) {
			console.log('✨ [OPENAI] images', images);
			image_urls_array = images.flatMap((image) => [
				{
					type: 'image_url',
					image_url: {
						url: image.url,
						detail: 'high'
					}
				},
				{
					type: 'text',
					text: `Above image is Image ID: ${image.id} - Description: ${image.description}`
				}
			]);
		}

		console.log('✨ [OPENAI] prompt', prompt);
		console.log('✨ [OPENAI] images', images);
		console.log('✨ [OPENAI] options', options);
		// console.log('✨ [OPENAI] schema', schema);
		// Add response_format option if schema is provided
		if (schema) {
			let response = await openai.beta.chat.completions.parse({
				model: VISION_MODEL,
				messages: [
					{
						role: 'system',
						content: system
					},
					{
						role: 'user',
						content: images ? [{ type: 'text', text: prompt }, ...image_urls_array] : prompt
					}
				],
				response_format: zodResponseFormat(schema, 'design'),
				...options
			});
			console.log('✨ [OPENAI] response', response);
			return response.choices[0].message.parsed as T;
		} else {
			let response = await openai.chat.completions.create({
				model: VISION_MODEL,
				messages: [
					{
						role: 'system',
						content: system
					},
					{
						role: 'user',
						content: images ? [{ type: 'text', text: prompt }, ...image_urls_array] : prompt
					}
				],
				...options
			});
			console.log('✨ [OPENAI] response', response);
			return response.choices[0].message.content;
		}
	} catch (error) {
		console.error('✨ [OPENAI] Error calling OpenAI:', error);
		throw error;
	}
}

/**
 * Sends a conversation history to OpenAI's GPT model and returns the completion.
 *
 * @param {ChatMessageWithMeta[]} chat_history_messages - Array of messages representing the conversation history
 * @param {Object} options - Additional configuration options for the OpenAI API call
 * @param {z.ZodType<T>} [schema] - Optional schema for validating and parsing the response
 * @returns {Promise<string|T>} The model's response as a string, or parsed according to schema if provided
 * @throws {Error} If the OpenAI API call fails
 */
export async function askGPTWithChatHistory<T>(
	chat_history_messages: ChatMessageWithMeta[],
	schema?: z.ZodType<T>,
	options = {}
): Promise<string | T> {
	try {
		console.log('*---askGPTWithChatHistory---*');
		console.log('✨ [OPENAI] chat_history', JSON.stringify(chat_history_messages, null, 2));

		let messages_array = chat_history_messages.flatMap((message) => message.content);

		if (schema) {
			let response = await openai.beta.chat.completions.parse({
				model: VISION_MODEL,
				messages: messages_array,
				response_format: zodResponseFormat(schema, 'design'),
				...options
			});
			console.log('✨ [OPENAI] response', response);
			return response.choices[0].message.parsed as T;
		} else {
			let response = await openai.chat.completions.create({
				model: VISION_MODEL,
				messages: messages_array,
				...options
			});
			console.log('✨ [OPENAI] response', response);
			return response.choices[0].message.content as string;
		}
	} catch (error) {
		console.error('✨ [OPENAI] Error calling OpenAI:', error);
		throw error;
	}
}
