import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import type { z } from 'zod';

// Initialize the OpenAI client with API key from environment variables
export const openai = new OpenAI({
	apiKey: import.meta.env.VITE_OPENAI_API_KEY
});

// Specify the model that supports vision capabilities
export const VISION_MODEL = 'gpt-4o';

export async function askGPT<T>(
	system: string = 'You are a helpful assistant .',
	prompt: string,
	image_url: string | null,
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

		console.log('✨ [OPENAI] prompt', prompt);
		console.log('✨ [OPENAI] image_url', image_url);
		console.log('✨ [OPENAI] options', options);
		console.log('✨ [OPENAI] schema', schema);
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
						content: image_url
							? [
									{ type: 'text', text: prompt },
									{
										type: 'image_url',
										image_url: {
											url: image_url,
											detail: 'high'
										}
									}
								]
							: prompt
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
						content: image_url
							? [
									{ type: 'text', text: prompt },
									{
										type: 'image_url',
										image_url: {
											url: image_url,
											detail: 'high'
										}
									}
								]
							: prompt
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

// // Helper function to format messages for vision-enabled chat
// export function formatMessageWithImage(
// 	system: string = 'You are a helpful assistant analyzing design images and providing design feedback and suggestions.',
// 	prompt: string,
// 	imageBase64: string | null
// ): Array<OpenAI.ChatCompletionMessageParam> {
// 	if (!prompt) {
// 		console.error('Error: prompt is undefined or null');
// 		prompt = 'Analyze this design';
// 	}

// 	const messages: Array<OpenAI.ChatCompletionMessageParam> = [
// 		{
// 			role: 'system',
// 			content: system
// 		},
// 		{
// 			role: 'user',
// 			content: imageBase64
// 				? [
// 						{ type: 'text', text: prompt },
// 						{
// 							type: 'image_url',
// 							image_url: {
// 								url: `data:image/png;base64,${imageBase64}`,
// 								detail: 'high'
// 							}
// 						}
// 					]
// 				: prompt
// 		}
// 	];
// 	console.log('Formatted prompt:', prompt);
// 	// console.log(imageBase64);
// 	console.log('Messages array created successfully');
// 	return messages as OpenAI.ChatCompletionMessageParam[];
// }

// /**
//  * Creates a streaming chat completion with the OpenAI API
//  * @param messages - Array of chat messages
//  * @param options - Additional options for the API call
//  * @returns A streaming response from the OpenAI API
//  */
// export function createStreamingChatCompletion(
// 	messages: OpenAI.ChatCompletionMessageParam[],
// 	options = {}
// ) {
// 	try {
// 		return openai.chat.completions.create({
// 			model: VISION_MODEL,
// 			messages,
// 			stream: true,
// 			...options
// 		});
// 	} catch (error) {
// 		console.error('Error calling OpenAI streaming:', error);
// 		throw error;
// 	}
// }
