import * as fabric from 'fabric';
import type {
	EnrichedImageItem,
	ExistingImageItem,
	ImageItem,
	RectItem,
	StructuredDesignProcessedImageItems,
	TextItem
} from '../../routes/api/generate-design/step1/design';

export function convertStructuredDesignProcessedImageItemsToFabricObjects(
	design_elements: StructuredDesignProcessedImageItems
): fabric.Object[] {
	const fabricObjects: fabric.Object[] = [];
	console.log('design_elements', design_elements);

	design_elements.items.forEach((element) => {
		let fabricObject: fabric.Object | null = null;

		// Common properties for all fabric objects
		const commonProps = {
			left: element.x,
			top: element.y,
			width: element.width,
			height: element.height,
			angle: element.rotation,
			opacity: element.opacity / 100 // Assuming opacity is 0-100
		};

		if (element.item.type === 'enriched_image') {
			const item = element.item as EnrichedImageItem;
			// Note: fabric.Image.fromURL is asynchronous.
			// For a synchronous function like this one, you would typically create a placeholder
			// or need to change this function to be async and await the image loading.
			// The following creates a fabric.Image instance directly with an Image element.
			// The browser will load the image asynchronously. Fabric might not have correct
			// width/height of the image immediately if they are not set on the element.
			const imgEl = new Image();
			imgEl.src = item.url;
			imgEl.crossOrigin = 'anonymous';

			fabricObject = new fabric.Image(imgEl, {
				...commonProps
				// scaleX and scaleY might be needed if the original image dimensions
				// are different from element.width and element.height and you want to fit it.
				// This requires the image to be loaded to know its original width/height.
				// For now, we assume commonProps.width and commonProps.height are the desired display dimensions.
			});
		} else if (element.item.type === 'text') {
			const item = element.item as TextItem;
			fabricObject = new fabric.Textbox(item.text, {
				...commonProps,
				fontSize: 20, // Default, fabric.Textbox adjusts size. Consider using item.height for better initial sizing.
				fontFamily: item.font,
				fontWeight: item.fontWeight.toString(), // Fabric expects fontWeight as string for numeric values too
				fill: item.fontColor,
				fontStyle: item.italic ? 'italic' : 'normal', // Combine bold/italic into fontStyle or fontWeight
				textAlign: item.align,
				underline: item.underline,
				// item.bold can be handled by fontWeight (e.g., 'bold' or 700)
				// item.fitText: fabric.Textbox will fit text if width/height are set. Behavior might need refinement.
				splitByGrapheme: item.wrap
			});
		} else if (element.item.type === 'rectangle') {
			const item = element.item as RectItem;
			fabricObject = new fabric.Rect({
				...commonProps,
				fill: item.fill,
				stroke: item.stroke,
				strokeWidth: item.strokeWidth
			});
		}

		if (fabricObject) {
			(fabricObject as any).originalItemType = element.item.type;
			if ('id' in element.item && element.item.id) {
				(fabricObject as any).originalItemId = element.item.id;
			}
			if (element.item.type === 'new_image') {
				(fabricObject as any).originalItemDescription = (element.item as ImageItem).description;
			}
			fabricObjects.push(fabricObject);
		}
	});

	return fabricObjects;
}

export function convertFabricObjectsToStructuredDesignProcessedImageItems(
	fabricObjects: fabric.Object[],
	currentConcept: string = 'User defined design',
	currentBackground: string = '#ffffff',
	currentArtboardWidth: number = 800,
	currentArtboardHeight: number = 600
): StructuredDesignProcessedImageItems {
	const design_elements: StructuredDesignProcessedImageItems = {
		concept: currentConcept,
		background: currentBackground,
		artboard: {
			width: currentArtboardWidth,
			height: currentArtboardHeight
		},
		items: []
	};
	console.log('fabricObjects', fabricObjects);

	fabricObjects.forEach((obj) => {
		const commonItemProps = {
			x: obj.left || 0,
			y: obj.top || 0,
			width: obj.scaleX ? (obj.width || 0) * obj.scaleX : obj.width || 0,
			height: obj.scaleY ? (obj.height || 0) * obj.scaleY : obj.height || 0,
			rotation: obj.angle || 0,
			opacity: (obj.opacity === undefined ? 1 : obj.opacity) * 100,
			zIndex: 0 // This needs to be derived from canvas object order if it's important
		};

		let itemPart: ImageItem | ExistingImageItem | EnrichedImageItem | TextItem | RectItem | null =
			null;
		const originalItemType = (obj as any).originalItemType;
		const originalItemId = (obj as any).originalItemId;
		const originalItemDescription = (obj as any).originalItemDescription;

		if (obj.type === 'image' && originalItemType === 'enriched_image') {
			const imgObj = obj as fabric.Image;
			const url = imgObj.getSrc ? imgObj.getSrc() : (imgObj as any)._element?.src || '';
			itemPart = {
				type: 'enriched_image',
				id: originalItemId || `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
				url: url,
				description: (obj as any).description || originalItemDescription || 'User added image'
			};
		} else if (obj.type === 'image' && originalItemType === 'existing_image') {
			itemPart = {
				type: 'existing_image',
				id: originalItemId || 'unknown_existing_image_id'
			};
		} else if (obj.type === 'image' && originalItemType === 'new_image') {
			itemPart = {
				type: 'new_image',
				description: originalItemDescription || 'Modified image, requires re-generation',
				colors: [],
				objects: [],
				mood: 'neutral',
				composition: ['center'],
				style: 'photo',
				height: commonItemProps.height,
				width: commonItemProps.width,
				remove_background: false
			};
		} else if ((obj.type === 'textbox' || obj.type === 'i-text') && originalItemType === 'text') {
			const fabricText = obj as fabric.Textbox; // or fabric.IText
			let fontWeight = 400;
			if (typeof fabricText.fontWeight === 'string') {
				if (fabricText.fontWeight === 'bold') fontWeight = 700;
				else fontWeight = parseInt(fabricText.fontWeight, 10) || 400;
			} else if (typeof fabricText.fontWeight === 'number') {
				fontWeight = fabricText.fontWeight;
			}

			itemPart = {
				type: 'text',
				text: fabricText.text || '',
				font: fabricText.fontFamily || 'Arial',
				fitText: true, // This is an assumption from our side
				fontWeight: fontWeight,
				fontColor: (fabricText.fill as string) || '#000000',
				fontStyle: fabricText.fontStyle === 'italic' ? 'italic' : 'normal',
				width: commonItemProps.width,
				align: (fabricText.textAlign as 'left' | 'center' | 'right') || 'left',
				wrap:
					(fabricText as any).splitByGrapheme === undefined
						? true
						: (fabricText as any).splitByGrapheme, // Default to true if not set
				bold: fontWeight >= 700 || fabricText.fontWeight === 'bold',
				italic: fabricText.fontStyle === 'italic',
				underline: fabricText.underline || false
			};
		} else if (obj.type === 'rect' && originalItemType === 'rectangle') {
			const fabricRect = obj as fabric.Rect;
			itemPart = {
				type: 'rectangle',
				fill: (fabricRect.fill as string) || '#ffffff',
				stroke: (fabricRect.stroke as string) || '#000000',
				strokeWidth: fabricRect.strokeWidth || 0
			};
		}

		if (itemPart) {
			design_elements.items.push({
				...commonItemProps,
				// Make sure itemPart is not null or undefined before spreading
				item: itemPart as ImageItem | ExistingImageItem | EnrichedImageItem | TextItem | RectItem
			});
		}
	});

	return design_elements;
}
