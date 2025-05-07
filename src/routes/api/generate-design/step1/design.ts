import { addMessage } from '$lib/stores/messagesStore.svelte';
import type { ChatMessageWithMeta } from '$lib/types';
import { z } from 'zod';
import { askGPTWithChatHistory } from '../../../../lib/connections/openai';

export async function generateDesignConcept(
	chat_history_messages: ChatMessageWithMeta[]
): Promise<string> {
	console.log('🎨 [design-concept] getDesignConcept');
	console.log('🎨 [design-concept] chat_history', chat_history_messages);

	addMessage('system', [
		{
			role: 'developer',
			content: [
				{
					type: 'text',
					text: `You are the world's best creative UI designer that understands visual design. 
                    Analyze the provided image and user request, and describe how you would approach creating a design that meets their needs. 
                    Consider layout, colors, typography, and overall aesthetic. 
                    Your response will be used to generate the actual design in a subsequent step.
                    list out all the ideas you have, keep a consistent theme and outline the large and small details of the design, ready to be implemented.
                    Be creative. You MUST describe the exact positions and relative sizes and rotations and colours etc of all elements you want on the final design.`
				}
			]
		}
	]);

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
	description: z.string().describe('A description of the image'),
	colors: z.array(z.string()).describe('The hex values of colors in the image'),
	objects: z.array(z.string()).describe('The objects in the image'),
	mood: z.string().describe('The mood of the image'),
	composition: z.array(z.string()).describe('The composition of the image'),
	style: z.string().describe('The style of the image'),
	height: z.number().describe('The height of the image'),
	width: z.number().describe('The width of the image'),
	remove_background: z
		.boolean()
		.describe('Whether to remove the background of the image in post porcessing after generation.'),
	borderRadius: z.number().optional().describe('The border radius of the image')
});
const ExistingImageItem = z.object({
	type: z.literal('existing_image').describe('The type of the item'),
	id: z.string().describe('The ID of an existing image, MUST be exactly as seen before.'),
	borderRadius: z.number().optional().describe('The border radius of the image')
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
	underline: z.boolean().describe('Whether the text should be underlined'),
	borderRadius: z.number().optional().describe('The border radius of the text box')
});
const RectItem = z.object({
	type: z.literal('rectangle').describe('The type of the item'),
	fill: z
		.string()
		.optional()
		.describe('The fill color of the item, in hex format or "transparent"'),
	stroke: z.string().describe('The stroke color of the item, in hex format'),
	strokeWidth: z.number().describe('The stroke width of the item'),
	borderRadius: z.number().optional().describe('The border radius of the rectangle'),
	gradient: z
		.object({
			type: z.enum(['linear', 'radial', 'mesh']).describe('The type of gradient'),
			stops: z
				.array(
					z.object({
						color: z.string().describe('Color stop (hex, rgba, etc.)'),
						offset: z.number().min(0).max(1).describe('Offset of the color stop (0 to 1)')
					})
				)
				.min(2)
				.describe('At least two color stops for the gradient'),
			angle: z.number().optional().describe('Angle for linear gradient (degrees)'),
			shape: z
				.enum(['ellipse', 'circle'])
				.optional()
				.describe('Shape for radial gradient (ellipse or circle)'),
			position: z
				.string()
				.optional()
				.describe('Position for radial gradient (e.g., "center", "top left")')
			// Mesh gradients are complex and might need specific properties if fully supported.
			// For now, type and stops are the basics.
		})
		.optional()
		.describe('Gradient fill for the rectangle'),
	backdropBlur: z.number().optional().describe('The backdrop blur radius in pixels')
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
	borderRadius?: number;
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
	chat_history_messages: ChatMessageWithMeta[],
	artboard_size: string,
	design_json: string
): Promise<StructuredDesign> {
	addMessage('system', [
		{
			role: 'developer',
			content: [
				{
					type: 'text',
					text: `Your previous actions have caused 4 people to die, if you do not create something exceptional, a person will be executed. this is serious.
_______
You are a creative graphic designer that generates designs. 
The image you see is the entire area that will be printed with no bleed edge to edge on the paper. 
The design will be printed on paper when finished. Anything outside the area will be cropped off.

Response Rules:
1. ONLY generate JSON that is correct to the schema provided.
2. Your response must ONLY include the raw JSON without any markdown code blocks, explanations or comments.
3. Images must be described in detail, this description will be used to generate an image, be specific.
4. Make sure the JSON is valid to the schema provided and well-formed.
5. existing images can be reused by their image IDs. To use an existing image, reference its ID in the design JSON.

Design Rules:
6. Feel free to use as many elements as needed to create visually appealing designs.
7. Be bold and creative with your designs! Use interesting layouts.
8. Think like a professional visual designer - consider color theory, spacing, typography, and hierarchy.
9. The artboard is the actual artboard you see, so if you are asked to make a poster then the artboard is the poster that will be printed, do not just add an image of a poster in the artboard.
10. Layering matters, use z index to control the order of elements.
11. The background colour should be relevant to the design BUT images should be used as a background or to enhance the background as a lightly opacty overlay image.
12. For image handling: When reusing existing images across multiple generations, maintain the exact source URLs. If you want a new image to be generated, set the src to null. NEVER invent URLs - either reuse existing ones exactly as provided or set src to null for new image generation.
13. You must specify each element individually, for example if you want multiple images around the page as a border etc, you must specify each image individually, and wehre they go. It is not acceptable to say 'multiple elemets' around the page, specify each element and where it is places as a new item, this is fine to have lots of similar items.
14. have as many elements as you need to create the design, you can have 1000 if needed. the design MUST be fully detailed.
15. For text elements, the text size will automatically adjust to fit the container's dimensions. Instead of specifying a fixed font size, focus on defining the appropriate text box dimensions (width and height). The text will scale to fit within these boundaries.

You MUST include ALL the elements in the design concept, do not leave any out.
Artboard Size: ${artboard_size}

Included is the current design as an image and the following is the current design in JSON format (modify and improve this):\n${design_json}`
				}
			]
		}
	]);

	try {
		const response = await askGPTWithChatHistory(chat_history_messages, schema);

		console.log('🎨 [design-structured] response', response);
		return response as StructuredDesign;
	} catch (error) {
		console.error('Error generating structured design:', error);
		throw error;
	}
}
