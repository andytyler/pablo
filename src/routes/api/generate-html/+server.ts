import { createChatCompletion, createImageMessageContent } from '$lib/connections/ai';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prompt, imageBase64 = null, currentHtml = '' } = await request.json();

		if (!prompt) {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}

		// Prepare system message to instruct AI about HTML generation constraints
		const systemMessage = {
			role: 'system',
			content: `You are a creative UI designer that generates designs, with the output being HTML tailwind. 
            The image you see is the entire area that will be printed with no bleed edge to edge on the paper. 
            The design will be printed on paper when finished. Anything outside the area will be cropped off.
            the design IS the actual artboard you see, so if you are asked to make a poster then the artboard is the poster that will be printed, do not just add an image of a poster in the artboard.

Rules:
1. You must ONLY generate HTML with <div> elements and <img> elements.
2. All styling must use Tailwind CSS classes - be creative and use the full power of Tailwind.
3. Your response must ONLY include the raw HTML without any markdown code blocks, explanations or comments.
4. Images must have valid src attributes pointing to placeholder images (use https://placehold.co/).
5. Make sure the HTML is valid and well-formed.
6. Be bold and creative with your designs! Use shadows, gradients and interesting layouts.
7. Feel free to use as many elements as needed to create visually appealing designs.
8. Think like a professional UI designer - consider color theory, spacing, typography, and hierarchy.

IMPORTANT: If provided with existing HTML and an image, modify and improve the existing design rather than creating a completely new one.`
		};

		// Create message content
		let content;

		if (imageBase64) {
			// If we have an image, use it to create a message with both text and image
			content = createImageMessageContent(
				`${prompt}\n\n${currentHtml ? 'Current HTML (modify and improve this):\n' + currentHtml : ''}`,
				imageBase64
			);
		} else {
			// Text-only message
			content = `${prompt}\n\n${currentHtml ? 'Current HTML (modify and improve this):\n' + currentHtml : ''}`;
		}

		// User message with the prompt
		const userMessage = {
			role: 'user',
			content
		};

		// Make the API call
		const response = await createChatCompletion([systemMessage, userMessage], {
			temperature: 0.9, // Higher temperature for more creativity
			max_tokens: 2000 // Increased token limit for more complex designs
		});

		// Extract the assistant's message from the response
		const assistantMessage = response.choices[0]?.message;

		if (!assistantMessage) {
			return json({ error: 'Failed to get response from AI' }, { status: 500 });
		}

		return json({ html: assistantMessage.content });
	} catch (error) {
		console.error('Error in HTML generation API:', error);
		return json({ error: 'Failed to process HTML generation request' }, { status: 500 });
	}
};
