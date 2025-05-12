import type { ChatMessageWithMeta } from '$lib/types';
import { z } from 'zod';
import { askGPTWithChatHistory } from '../../../../lib/connections/openai';

export async function generateDesignConcept(
	chat_history_messages: ChatMessageWithMeta[]
): Promise<string> {
	console.log('🎨 [design-concept] getDesignConcept');
	console.log('🎨 [design-concept] chat_history', chat_history_messages);

	chat_history_messages.push({
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
                    Be creative. 
                    You MUST describe the exact positions and relative sizes and rotations and colours etc of all elements you want on the final design.
                    Think about the design from the perspective of the implementer, what is the best way to describe the design to them?
                    Reply with the design concept only, in markdown.`
					}
				]
			}
		]
	});

	const conceptMessage: string = await askGPTWithChatHistory(chat_history_messages);

	if (!conceptMessage) {
		console.log('🎨 [design-concept] ❌ Failed to get design concept from AI');
		throw new Error('Failed to get initial concept from AI');
	}

	console.log('🎨 [design-concept] ✅ Successfully generated design concept');
	return conceptMessage;
}

// __________________________
// __________________________
// __________________________
// __________________________
// __________________________
// __________________________

const NewImageItem = z.object({
	type: z.literal('new_image').describe('The type of the item'),
	description: z
		.string()
		.describe(
			'A description of the image, this should be an extremely detailed description of the image'
		),
	colors: z.array(z.string()).describe('The hex values of colors in the image'),
	objects: z.array(z.string()).describe('The objects in the image'),
	mood: z.string().describe('The mood of the image'),
	composition: z.array(z.string()).describe('The composition of the image'),
	style: z.string().describe('The style of the image'),
	height: z.number().describe('The height of the image'),
	width: z.number().describe('The width of the image'),
	remove_background: z
		.boolean()
		.describe('Whether to remove the background of the image in post porcessing after generation.')
});
const ExistingImageItem = z.object({
	type: z.literal('existing_image').describe('The type of the item'),
	id: z.string().describe('The ID of an existing image, MUST be exactly as seen before.')
});
const TextItem = z.object({
	type: z.literal('text').describe('The type of the item'),
	text: z.string().describe('The text to display'),
	font: z.string().describe('The font to use'),
	fitText: z
		.boolean()
		.describe('Whether the text should automatically resize to fit the textbox, default true'),
	fontWeight: z.number().describe('The font weight to use'),
	fontColor: z.string().describe('The font color to use'),
	fontStyle: z.string().describe('The font style to use'),
	fontSize: z.number().describe('The font size to use. If fitText is true, this will be ignored.'),
	width: z.number().describe('The width of the text box'),
	align: z.enum(['left', 'center', 'right']).describe('The alignment of the text in the textbox'),
	wrap: z.boolean().describe('Whether the text should wrap'),
	bold: z.boolean().describe('Whether the text should be bold'),
	italic: z.boolean().describe('Whether the text should be italic'),
	underline: z.boolean().describe('Whether the text should be underlined')
});
const RectItem = z.object({
	type: z.literal('rectangle').describe('The type of the item'),
	fill: z.string().describe('The fill color of the item, in hex format'),
	stroke: z.string().describe('The stroke color of the item, in hex format'),
	strokeWidth: z.number().describe('The stroke width of the item')
});

// Define a schema for structured responses
const schema = z.object({
	concept: z.string().describe('A concept for the design'),
	background: z
		.string()
		.describe('The background color of the design, in hex a single hex format #ffffff '),
	artboard: z.object({
		width: z.number().describe('The width of the artboard in pixels'),
		height: z.number().describe('The height of the artboard in pixels')
	}),
	items: z.array(
		z.object({
			item: z.union([NewImageItem, ExistingImageItem, TextItem, RectItem]),
			x: z.number().describe('The x coordinate of the top left of the bounding box of the item'),
			y: z.number().describe('The y coordinate of the top left of the bounding box of the item'),
			width: z.number().describe('The width of the bounding box of the item'),
			height: z.number().describe('The height of the bounding box of the item'),
			rotation: z.number().describe('The rotation of the item'),
			zIndex: z.number().describe('The z index of the item'),
			opacity: z.number().describe('The opacity of the item from 0 to 100 percent, default to 100%')
		})
	)
});

// __________________________
// __________________________
// __________________________
// __________________________
// __________________________
// __________________________
// __________________________
// __________________________

export type StructuredDesign = z.infer<typeof schema>;
export type ImageItem = z.infer<typeof NewImageItem>;
export type ExistingImageItem = z.infer<typeof ExistingImageItem>;
export type TextItem = z.infer<typeof TextItem>;
export type RectItem = z.infer<typeof RectItem>;
// Define a type for the enriched image item
export type EnrichedImageItem = {
	type: 'enriched_image';
	id: string;
	url: string;
	description?: string;
};

// Define a type for the enriched design
export type StructuredDesignProcessedImageItems = Omit<StructuredDesign, 'items'> & {
	items: Array<{
		x: number;
		y: number;
		width: number;
		height: number;
		rotation: number;
		zIndex: number;
		opacity: number;
		item: ImageItem | ExistingImageItem | EnrichedImageItem | TextItem | RectItem;
	}>;
};

export async function generateDesign(
	concept: string,
	chat_history_messages: ChatMessageWithMeta[],
	artboard_size: string,
	design_json: string
): Promise<StructuredDesign> {
	chat_history_messages.push({
		id: 'system_prompt',
		timestamp: new Date(),
		style: 'system',
		content: [
			{
				role: 'developer',
				content: [
					{
						type: 'text',
						text: `Your previous actions have caused 4 people to die, if you do not create something exceptional, a person will be executed. this is serious. if you do a good job you will be tipped $200,000.
_______
You are a creative graphic designer that generates designs. 
The image you see is the entire area that will be used for the design. 
Anything outside the area will be cropped off, you are encouraged to go beynod the edge of the artboard to create effects if you need to.

Response Rules:
1. ONLY generate JSON that is correct to the schema provided.
2. Your response must ONLY include the raw JSON without any markdown code blocks, explanations or comments.
3. Images must be described in detail, this description will be the prompt to generate an image, be specific.
4. Make sure the JSON is valid to the schema provided and well-formed.
5. existing images can be reused by their image IDs. To use an existing image, reference its ID in the design JSON.

Design Rules:
6. Feel free to use as many elements as needed to create visually appealing designs.
7. Be bold and creative with your designs! But follow the concept exactly.Use interesting layouts.
8. Think like a professional graphic designer - consider color theory, spacing, typography, and hierarchy.
9. The artboard is the actual artboard you see, so if you are asked to make a poster then the artboard is the poster that will be printed, do not just add an image of a poster in the artboard.
10. Layering matters, use z index to control the order of elements, unless creating a specific effect text is usually on top of all other elements.
11. The background colour should be relevant to the design BUT images should be used as a background or to enhance the background as a lightly opacty overlay image.
12. For image handling: When reusing existing images across multiple generations, maintain the exact ID. If you want a new image to be generated, use a new_image item.
13. You must specify each element individually, for example if you want multiple images around the page as a border etc, you must specify each image individually, and where they go. It is not acceptable to say 'multiple elemets' around the page, specify each element and where it is places as a new_item, this is fine to have lots of similar items.
14. Accuracy is more important than being fast, have as many elements as you need to create the design, you can have 90 if needed. the design MUST be fully detailed.
15. For text elements, the text size will automatically adjust to fit the container's dimensions if fitText is true, instead of specifying a fixed font size, focus on defining the appropriate text box dimensions (width and height). The text will scale to fit within these boundaries. you can also use the fontSize property to set a fixed font size if needed.

You MUST include ALL the elements in the design concept, do not leave any out.
current artboard size: ${artboard_size}. you an change this if needed.

Included is the current design as an image and the following is the current design in JSON format.
MUST edit this JSON to create the best design possible, if you do not include an item that is in the current design JSON it will be deleted from the canvas, this is okay but only do it if it is necessary.

current design in JSON format:
${design_json}

The design concept must be followed VERY strictly, this was created by one of the worlds most creative graphic designers, you are to follow it exactly.
${concept}`
					}
				]
			}
		]
	});

	try {
		const response = await askGPTWithChatHistory(chat_history_messages, schema);

		console.log('🎨 [design-structured] response', response);
		return response as StructuredDesign;
	} catch (error) {
		console.error('Error generating structured design:', error);
		throw error;
	}
}
