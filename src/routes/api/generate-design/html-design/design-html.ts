import type { ChatMessageWithMeta } from '$lib/types';
import { askGPTWithChatHistory } from '../../../../lib/connections/openai';

export async function generateDesignConcept(
	chat_history_messages: ChatMessageWithMeta[]
): Promise<string> {
	console.log('🎨 [generateDesignConcept] Initiated');

	const new_chat_history_messages = [...chat_history_messages];
	new_chat_history_messages.push({
		id: 'system_prompt',
		timestamp: new Date(),
		style: 'system',
		content: [
			{
				role: 'developer',
				content: [
					{
						type: 'text',
						text: `You are the world's best creative graphic designer, your current client is paying you USD $260,000 to create this one design.
                    if you do well you will be tipped $100,000 for the design.
                    Analyze the provided images and user request, and describe how you would approach creating or editing a design that meets their needs. 
                    Consider layout, colors, typography, and overall aesthetic. 
                    This concept is what you are being paid for. 
                    This is the most important part, you are being paid to create the concept, someone else will be paid to execute the design.
                    You MUST list out all the ideas you have, keep a consistent theme and outline all big ideas and small details of the design.
                    You MUST be creative and think outside the box, no cliche designs, be creative.
                    All values should be in pixels.
                    You MUST describe the exact positions and relative sizes and rotations and colours etc of all elements you want on the final design.
                    Think about the design from the perspective of the implementer, what is the best way to describe the design to them?
                    Reply with a concise design concept only, in markdown.`
					}
				]
			}
		]
	});

	console.log('@CHECKPOINT cons', chat_history_messages.length);
	for (let i = 0; i < chat_history_messages.length; i++) {
		console.log(
			'@CHECKPOINT 1',
			JSON.stringify(chat_history_messages[i].content).substring(0, 100)
		);
	}

	const conceptMessage: string = await askGPTWithChatHistory(new_chat_history_messages);

	if (!conceptMessage) {
		console.log('🎨 [design-concept] ❌ Failed to get design concept from AI');
		throw new Error('Failed to get initial concept from AI');
	}

	console.log('🎨 [design-concept] ✅ Successfully generated design concept');
	return conceptMessage;
}

export async function generateFrameDesign(
	concept: string,
	chat_history_messages: ChatMessageWithMeta[],
	current_height: number,
	current_width: number,
	previous_design_html: string
): Promise<string> {
	let new_chat_history_messages = [...chat_history_messages];
	new_chat_history_messages.push({
		id: 'system_prompt',
		timestamp: new Date(),
		style: 'system',
		content: [
			{
				role: 'developer',
				content: [
					{
						type: 'text',
						text: `Your previous actions have upset 4 people, do better. this is extremely serious.
---
You are a creative graphic designer that generates designs. 
You are encouraged to go beynod the edge of the frame to create effects if you need to.

# Design Rules
Accuracy is more important than being fast. Feel free to use as many elements as needed to create visually appealing designs. Be bold and creative with your designs! Don't create cliche designs, do unusual and interesting designs, actually think uniquely outside the box.
Consider color theory, spacing, typography, and hierarchy.
Layering matters, use z index to control the order of elements, unless creating a specific effect text is usually on top of all other elements.
You must specify each element individually, for example if you want multiple images around the page as a border etc, you must specify each image individually, and where they go. It is not acceptable to say 'multiple elemets' around the page, this is fine to have lots of similar items.
Layout and positioning are important, weather absolute or relative, please be accurate, especially for text.
inner styles are very important, consider text size, font weight, font family, color, etc.
inner positioning is important as the user can resize elements, so if font needs to be center explicitly state it.


# Response Rules:
ONLY generate HTML, that is correct. 
You MUST reply with ONLY the INNER HTML of frame, nothing else.
Your response must ONLY include the raw HTML without any markdown code blocks, explanations or comments. 
element nesting is NOT allowed. each item must be a direct child of the frame.
ALL styling MUST be defined in the class attribute of the element, using tailwind css and tailwindcss ONLY. There MUST NOT be ANY other CSS or custom styles.
You MUST use the class attribute to style the elements, do not use inline styles.
Your content will be rendered inside a div (the 'Frame').
NEVER reply in text, you MUST reply in HTML, no explanation or comments, just the HTML.
The only styling that is possibel is effects inside the div so only padding no margin. 
NEVER EVER use tailwind to position the element.
You MUST use the following attributes to position each element:
- data-x - the x position of the element
- data-y - the y position of the element
- data-width - the width of the element
- data-height - the height of the element
- data-rotation - the rotation of the element
- data-z-index - the z index (layer) of the element


# Frame
You MUST include ALL the elements in the design concept, do not leave any out.
The frame is transparent.
current Frame size: ${current_height}x${current_width}.
You can change the frame size (in pixels) in the meta tag e.g. 
You MUST always include the meta tag, even if missing or the same as the current design.
<meta data-width="700" data-height="1000">
This is NOT an interactive desing it is for a static image. You are writing HTML but this is not a webpage, it is a graphic design ultimately exported as a png.


# Text Elements
ALL text MUST be wrapped in a div element, this is important. 
'data-font-family' MUST be included, this is the font family of the text, you can use any legitimate Google Font Family that you KNOW to exist, do not include the google font url, just the font name and not the style so 'Poppins' is fine, 'Poppins Bold' is not.
<div data-font-family="Poppins">Hello World</div>
All text MUST have width and height properties. Favour relative postiioning for text. inside the main div with a z index
Consider the overall space the text will take up when positioning, overflow and text wrap, size of text is important.

# Images
use the 'data-prompt' attribute to describe the image, this is the prompt for the image generation, the more specific you are the better the image will be. 
'data-remove-bg' must also be included, this is a boolean, if true the image will be generated and then background removed. e.g.
<img data-prompt="a picture of a labrador puppy sitting with its tounge out" data-remove-bg="true" />
<img data-prompt="a beautiful sunset over a calm ocean with a small boat in the foreground" data-remove-bg="false" />



Included is the current design as an image and the following is the current design in HTML format.
MUST respond with the WHOLE HTML including your edits. if you do not include an element that is in the current design HTML it will be deleted from the canvas, this is okay but only do it if it is necessary.
---
`
					}
				]
			},
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: `The design concept is as follows: ${concept}`
					}
				]
			},
			{
				role: 'assistant',
				content: [
					{
						type: 'text',
						text: `current design in HTML format:
${previous_design_html}`
					}
				]
			}
		]
	});

	console.log('@CHECKPOINT desy', new_chat_history_messages.length);
	for (let i = 0; i < new_chat_history_messages.length; i++) {
		console.log(
			'@CHECKPOINT [FRAME DESIGN]:',
			JSON.stringify(new_chat_history_messages[i].content).substring(0, 100)
		);
	}

	try {
		const response = await askGPTWithChatHistory(new_chat_history_messages);

		console.log('🎨 [design-structured] response', response);
		return response as string;
	} catch (error) {
		console.error('Error generating structured design:', error);
		throw error;
	}
}
