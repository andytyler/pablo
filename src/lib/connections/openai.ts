import OpenAI from 'openai';

// Initialize the OpenAI client with API key from environment variables
export const openai = new OpenAI({
	apiKey: import.meta.env.VITE_OPENAI_API_KEY
});

// Specify the model that supports vision capabilities
export const VISION_MODEL = 'gpt-4-vision-preview';

// Helper function to format messages for vision-enabled chat
export function formatMessageWithImage(
	prompt: string,
	imageBase64: string | null
): Array<OpenAI.ChatCompletionMessageParam> {
	const messages: Array<OpenAI.ChatCompletionMessageParam> = [
		{
			role: 'system',
			content:
				'You are a helpful assistant analyzing design images and providing design feedback and suggestions.'
		},
		{
			role: 'user',
			content: imageBase64
				? [
						{ type: 'text', text: prompt },
						{
							type: 'image_url',
							image_url: {
								url: `data:image/png;base64,${imageBase64}`,
								detail: 'high'
							}
						}
					]
				: prompt
		}
	];

	return messages;
}
