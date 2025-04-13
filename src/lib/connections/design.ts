import { z } from 'zod';
import { askGPT } from './openai';
import { generateImageFromItem } from './prodia';
import { removeBackground } from './replicate';

export async function getDesignConcept({
	prompt,
	image_url = null
}: {
	prompt: string;
	image_url?: string | null;
}) {
	console.log('🎨 [design-concept] getDesignConcept');
	console.log('🎨 [design-concept] prompt', prompt);
	console.log('🎨 [design-concept] image_url', image_url);

	// Prepare system message for initial design concept
	const initialSystemMessage = `You are the world's best creative UI designer that understands visual design. 
Analyze the provided image and user request, and describe how you would approach creating a design that meets their needs. 
Consider layout, colors, typography, and overall aesthetic. 
Your response will be used to generate the actual HTML in a subsequent step.
Be creative. You MUST describe the exact positions and relative sizes and rotations and colours etc of all elements you want on the final design.`;

	console.log('🎨 [design-concept] Sending request for design concept');
	const conceptMessage = await askGPT(initialSystemMessage, prompt, image_url, {
		temperature: 0.9,
		max_tokens: 3000
	});

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

const ImageItem = z.object({
	description: z.string().describe('A description of the image'),
	colors: z.array(z.string()).describe('The hex values of colors in the image'),
	objects: z.array(z.string()).describe('The objects in the image'),
	mood: z.string().describe('The mood of the image'),
	composition: z.array(z.string()).describe('The composition of the image'),
	style: z.string().describe('The style of the image'),
	height: z.number().describe('The height of the image'),
	width: z.number().describe('The width of the image'),
	src: z.null().or(z.string()).describe('leave blank')
});
const TextItem = z.object({
	text: z.string().describe('The text to display'),
	font: z.string().describe('The font to use'),
	fontSize: z.number().describe('The font size to use'),
	fontWeight: z.number().describe('The font weight to use'),
	fontColor: z.string().describe('The font color to use'),
	fontStyle: z.string().describe('The font style to use'),
	width: z.number().describe('The width of the text box'),
	align: z.string().describe('The alignment of the text'),
	wrap: z.boolean().describe('Whether the text should wrap'),
	bold: z.boolean().describe('Whether the text should be bold'),
	italic: z.boolean().describe('Whether the text should be italic'),
	underline: z.boolean().describe('Whether the text should be underlined')
});

// Define a schema for structured responses
const schema = z.object({
	concept: z.string().describe('A concept for the design'),
	background: z.string().describe('The background color of the design, in hex format'),
	items: z.array(
		z.object({
			item: z.union([ImageItem, TextItem]),
			x: z.number().describe('The x coordinate of the top left of the bounding box of the item'),
			y: z.number().describe('The y coordinate of the top left of the bounding box of the item'),
			width: z.number().describe('The width of the bounding box of the item'),
			height: z.number().describe('The height of the bounding box of the item')
		})
	)
});

type StructuredDesign = z.infer<typeof schema>;
export type ImageItem = z.infer<typeof ImageItem>;

export async function generateStructuredDesign(
	system: string = 'You are a web designer who understands exactly what the user wants. Your designs should be, aesthetically pleasing.',
	prompt: string,
	image_url: string | null = null
): Promise<StructuredDesign> {
	try {
		const response = await askGPT(
			system,
			prompt,
			image_url,
			{
				temperature: 0.9,
				max_tokens: 3000
			},
			schema
		);

		console.log('🎨 [design-structured] response', response);
		return response as StructuredDesign;
	} catch (error) {
		console.error('Error generating structured design:', error);
		throw error;
	}
}

/**
 * Processes a structured design by finding image items and generating images for them
 */
export async function processStructuredDesignWithImages(
	design: StructuredDesign
): Promise<StructuredDesign & { items: Array<any> }> {
	try {
		// Process each item in the design
		const processedItems = await Promise.all(
			design.items.map(async (item) => {
				// Check if the item is an ImageItem (has description property)
				if (typeof item.item === 'object' && 'description' in item.item && item.item.src === null) {
					// Generate image from the description
					// const { url: imageUrl, error } = await generateImage(item.item.description);
					let final_img = null;
					const { url: imageUrl, error } = await generateImageFromItem(item.item);
					final_img = imageUrl;

					if (imageUrl) {
						const { url: imageUrlWithoutBackground, error: errorWithoutBackground } =
							await removeBackground(imageUrl);
						final_img = imageUrlWithoutBackground;
					}

					if (error) {
						console.error('Error generating image:', error);
						throw error;
					}

					// Return the enhanced item with image source
					return {
						...item,
						item: {
							...item.item,
							src: final_img
						}
					};
				}

				// Return the item unchanged if it's not an image
				return item;
			})
		);

		// Return the enhanced design with processed items
		return {
			...design,
			items: processedItems
		};
	} catch (error) {
		console.error('Error processing design with images:', error);
		throw error;
	}
}

/**
 * Processes multiple structured designs by generating images for all descriptions
 */
export async function processMultipleDesignsWithImages(
	designs: StructuredDesign[]
): Promise<Array<Awaited<ReturnType<typeof processStructuredDesignWithImages>>>> {
	try {
		const processedDesigns = await Promise.all(
			designs.map((design) => processStructuredDesignWithImages(design))
		);

		return processedDesigns;
	} catch (error) {
		console.error('Error processing multiple designs with images:', error);
		throw error;
	}
}

/**
 * Converts a structured design to HTML
 * @param design The processed structured design with image sources
 * @returns HTML string representation of the design
 */
export function designToHtml(design: StructuredDesign & { items: Array<any> }): string {
	// Create a container div with the background color
	const html = `<div style="position: relative; width: 100%; height: 100vh; background-color: ${design.background}; overflow: hidden;">
${design.items
	.map((item) => {
		const { x, y, width, height } = item;
		const itemStyle = `left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px;`;

		// Check if it's an image item
		if ('description' in item.item && 'src' in item.item) {
			return `        <img src="${item.item.src}" alt="${item.item.description}" style="${itemStyle} position: absolute; box-sizing: border-box;" />`;
		}
		// Otherwise it's a text item
		else if ('text' in item.item) {
			const {
				text,
				font,
				fontSize,
				fontWeight,
				fontColor,
				fontStyle,
				align,
				wrap,
				bold,
				italic,
				underline
			} = item.item;

			let textStyle = itemStyle;
			textStyle += `font-family: ${font}; font-size: ${fontSize}px; color: ${fontColor}; text-align: ${align};`;

			if (fontWeight) textStyle += ` font-weight: ${fontWeight};`;
			if (fontStyle) textStyle += ` font-style: ${fontStyle};`;
			if (bold) textStyle += ` font-weight: bold;`;
			if (italic) textStyle += ` font-style: italic;`;
			if (underline) textStyle += ` text-decoration: underline;`;
			if (!wrap) textStyle += ` white-space: nowrap;`;

			return `        <div class="design-item" style="${textStyle}">${text}</div>`;
		}

		return '';
	})
	.join('\n')}
    </div>`;

	return html;
}

/**
 * Converts a structured design to an HTML string with inline styles
 * Use this for embedding in a Svelte component
 * @param design The processed structured design with image sources
 * @returns HTML string for embedding within another component
 */
export function designToInlineHtml(design: StructuredDesign & { items: Array<any> }): string {
	const container = `<div class="design-container relative w-full h-full" style="background-color: ${design.background};">`;

	const itemsHtml = design.items
		.map((item) => {
			const { x, y, width, height } = item;
			const positionStyle = `position: absolute; left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px;`;

			// Check if it's an image item
			if ('description' in item.item && 'src' in item.item) {
				return `<img class="object-cover" src="${item.item.src}" alt="${item.item.description}" style="${positionStyle}" />`;
			}
			// Otherwise it's a text item
			else if ('text' in item.item) {
				const {
					text,
					font,
					fontSize,
					fontWeight,
					fontColor,
					align,
					wrap,
					bold,
					italic,
					underline
				} = item.item;

				let textStyle = positionStyle;
				textStyle += `font-family: ${font}; font-size: ${fontSize}px; color: ${fontColor}; text-align: ${align};`;

				if (fontWeight) textStyle += ` font-weight: ${fontWeight};`;
				if (bold) textStyle += ` font-weight: bold;`;
				if (italic) textStyle += ` font-style: italic;`;
				if (underline) textStyle += ` text-decoration: underline;`;
				if (!wrap) textStyle += ` white-space: nowrap;`;

				return `<div style="${textStyle}">${text}</div>`;
			}

			return '';
		})
		.join('\n');

	return `${container}\n${itemsHtml}\n</div>`;
}

// __________________________
// __________________________
// __________________________
// __________________________
// __________________________
// __________________________
