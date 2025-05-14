import type { ChatMessageWithMeta } from '$lib/types';
import { askGPTWithChatHistory } from '../../../../lib/connections/openai';

export async function generateDesignConcept(
	chat_history_messages: ChatMessageWithMeta[]
): Promise<string> {
	console.log('🎨 [design-concept] getDesignConcept');
	console.log('🎨 [design-concept] chat_history', chat_history_messages);

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
                    Analyze the provided images and user request, and describe how you would approach creating a design that meets their needs. 
                    Consider layout, colors, typography, and overall aesthetic. 
                    This concept is what you are being paid for. 
                    This is the most important part, someone else will be paid to execute the design, you are being paid to create the concept, so be detailed for the implementer.
                    The implementer will be using the concept to create the design, so it must be detailed and complete, the implementer will NOT add their own ideas, they will only implement your concept exactly as you describe it.
                    You MUST list out all the ideas you have, keep a consistent theme and outline all big ideas and small details of the design.
                    You MUST be creative and think outside the box.
                    Be creative. All values should be in pixels.
                    You MUST describe the exact positions and relative sizes and rotations and colours etc of all elements you want on the final design.
                    Think about the design from the perspective of the implementer, what is the best way to describe the design to them?
                    Reply with the design concept only, in markdown.`
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
						text: `Your previous actions have upset 4 people, if you do not create something exceptional, a person will be miserable. this is serious. if you do a good job you will be tipped $200,000.
---
You are a creative graphic designer that generates designs. 
The image you see is the entire area that will be used for the design. 
Anything outside the area will be cropped off, you are encouraged to go beynod the edge of the artboard to create effects if you need to.

Response Rules:
ONLY generate HTML that is correct. You MUST reply with ONLY the INNER HTML of the existing div that is the artboard, nothing else.
Your response must ONLY include the raw HTML without any markdown code blocks, explanations or comments.
ALL styling MUST be defined in the class attribute of the element, using tailwind css and tailwindcss ONLY. There MUST NOT be ANY other CSS or custom styles.
Your content will be rendered inside a div (the 'frame') with relative positioning and width and height from the meta tag, overflow will be hidden.
NEVER reply in text, you MUST reply in HTML, no explanation or comments, just the HTML.

Design Rules:
6. Feel free to use as many elements as needed to create visually appealing designs.
7. Be bold and creative with your designs! But follow the concept exactly. Don't create cliche designs, do unusual and interesting designs.
8. Think like a professional graphic designer - consider color theory, spacing, typography, and hierarchy.
9. The artboard is the actual artboard you see, so if you are asked to make a poster then the artboard is the poster that will be exported, do not just add an image of a poster in the artboard.
10. Layering matters, use z index to control the order of elements, unless creating a specific effect text is usually on top of all other elements.
13. You must specify each element individually, for example if you want multiple images around the page as a border etc, you must specify each image individually, and where they go. It is not acceptable to say 'multiple elemets' around the page, specify each element and where it is places as a new_item, this is fine to have lots of similar items.
14. Accuracy is more important than being fast, have as many elements as you need to create the design, you can have 90 if needed. the design MUST be fully detailed.
15. For text elements, the text size will automatically adjust to fit the container's dimensions if fitText is true, instead of specifying a fixed font size, focus on defining the appropriate text box dimensions (width and height). The text will scale to fit within these boundaries. you can also use the fontSize property to set a fixed font size if needed.

You MUST include ALL the elements in the design concept, do not leave any out.
current artboard size: ${current_height}x${current_width}.
You can change the artboard size (in pixels) in the meta tag i.e. 
You MUST always include the meta tag, even if missing or the same as the current Design.
<meta data-width="700" data-height="1000">
This is NOT an interactive desing it is for a static image. YOu are writing HTML but this is not a webpage, it is a graphic design.

Included is the current design as an image and the following is the current design in HTML format.
MUST respond with the WHOLE HTML including your edits. if you do not include an element that is in the current design HTML it will be deleted from the canvas, this is okay but only do it if it is necessary.
---
`
						// 3. Images must be described in detail, this description will be the prompt to generate an image, be specific.
						// 11. The background colour should be relevant to the design BUT images should be used as a background or to enhance the background as a lightly opacty overlay image.
						// 12. For image handling: When reusing existing images across multiple generations, maintain the exact ID. If you want a new image to be generated, use a new_image item.
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
<meta data-width="${current_width}" data-height="${current_height}">
*HTML START*
${previous_design_html}
*HTML END*`
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
