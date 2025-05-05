import type { StructuredDesignProcessedImageItems } from '../../routes/api/generate-design/step1/design';

/**
 * Converts an image-enriched structured design to an HTML string with inline styles
 * @param design The structured design with enriched image data (containing url instead of src)
 * @returns HTML string for embedding within a component
 */
export function imageEnrichedDesignJsonToHtml(design: StructuredDesignProcessedImageItems): string {
	try {
		// If no design or missing key properties, return empty container
		if (!design || (!design.background && (!design.items || design.items.length === 0))) {
			return '<div class="design-container relative w-full h-full"></div>';
		}

		const container = `<div class="design-container relative w-full h-full" style="background-color: ${
			design.background || '#ffffff'
		};">`;

		let itemsHtml = '';
		if (design.items && design.items.length > 0) {
			itemsHtml = design.items
				.map((item) => {
					if (!item) return '';

					const { x, y, width, height, rotation = 0, zIndex = 0, opacity = 100 } = item;
					const opacityValue = opacity / 100;
					const positionStyle = `position: absolute; left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; z-index: ${zIndex}; transform: rotate(${rotation}deg); opacity: ${opacityValue};`;

					// Check if it's an image item
					if (item.item && 'id' in item.item && 'url' in item.item) {
						// Use a placeholder for images without url
						if (!item.item.url) {
							return `<div class="image-placeholder bg-gray-200 flex items-center justify-center" style="${positionStyle}">
								<div class="text-xs text-gray-500 p-2 text-center overflow-hidden">
									${item.item.description || 'Image loading...'}
								</div>
							</div>`;
						}
						return `<img class="object-cover" src="${item.item.url}" alt="${
							item.item.description || ''
						}" style="${positionStyle}" />`;
					}
					// Check if it's a rectangle item
					else if (item.item && 'fill' in item.item) {
						const { fill, stroke, strokeWidth } = item.item;
						const rectStyle = `${positionStyle} background-color: ${fill}; border: ${strokeWidth}px solid ${stroke};`;

						return `<div style="${rectStyle}"></div>`;
					}
					// Otherwise it's a text item
					else if (item.item && 'text' in item.item) {
						const {
							text,
							font,
							fontWeight,
							fontColor,
							align,
							wrap,
							bold,
							italic,
							underline,
							fitText = true
						} = item.item;

						let textStyle = positionStyle;
						textStyle += `font-family: ${font}; color: ${fontColor}; text-align: ${align};`;

						// Apply responsive text fitting
						if (fitText) {
							textStyle += ` display: flex; align-items: center; justify-content: ${
								align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
							}; overflow: hidden;`;
						}

						if (fontWeight) textStyle += ` font-weight: ${fontWeight};`;
						if (bold) textStyle += ` font-weight: bold;`;
						if (italic) textStyle += ` font-style: italic;`;
						if (underline) textStyle += ` text-decoration: underline;`;
						if (!wrap) textStyle += ` white-space: nowrap; overflow: hidden;`;

						// Create a unique ID for this text element for text fitting
						const textId = `text-${Math.floor(Math.random() * 100000000)}`;

						return `<div id="${textId}" class="fit-text" style="${textStyle}" data-text="${(
							text || ''
						).replace(/"/g, '&quot;')}">${text || ''}</div>`;
					}

					return '';
				})
				.join('\n');
		}
		const all_fonts = design.items
			.filter((item) => item.item)
			.map((item) => ('font' in item.item ? item.item.font : false))
			.filter((item) => item !== false);
		const unique_fonts = [...new Set(all_fonts)];

		// Add special styling for fit-text elements
		const fitTextStyle = `
<style>
.fit-text {
  display: flex;
  align-items: center;
  overflow: hidden;
  word-break: break-word;
}
.image-placeholder {
  background-image: linear-gradient(45deg, #f0f0f0 25%, #e0e0e0 25%, #e0e0e0 50%, #f0f0f0 50%, #f0f0f0 75%, #e0e0e0 75%, #e0e0e0 100%);
  background-size: 14px 14px;
}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${unique_fonts.map((font) => font.replace(/ /g, '+')).join('&family=')}&display=swap" rel="stylesheet">
`;

		return `${fitTextStyle}\n${container}\n${itemsHtml}\n</div>`;
	} catch (error) {
		console.error('Error generating HTML from enriched design:', error);
		return '<div class="design-container relative w-full h-full"></div>';
	}
}
