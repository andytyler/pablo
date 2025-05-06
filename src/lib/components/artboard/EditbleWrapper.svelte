<script lang="ts">
	import { artboardStore } from '$lib/stores/artboard-store.svelte';
	import { BROWSER } from 'esm-env';
	import { onDestroy, onMount } from 'svelte';
	import type {
		EnrichedImageItem,
		RectItem,
		StructuredDesignProcessedImageItems,
		TextItem
	} from '../../../routes/api/generate-design/step1/design';
	// For client-side only DOM manipulations

	import { Blend } from 'lucide-svelte';
	// Svelte 5 Props
	type ItemInStore = StructuredDesignProcessedImageItems['items'][number];
	let { itemData, itemIndex }: { itemData: ItemInStore; itemIndex: number } = $props();

	// --- Core Element State ---
	// isSelected is now derived from the store for global selection management
	let isSelected = $derived(artboardStore.selectedItemIndex === itemIndex);

	let currentX = $state(itemData.x);
	let currentY = $state(itemData.y);
	let currentWidth = $state(itemData.width);
	let currentHeight = $state(itemData.height);
	let currentRotation = $state(itemData.rotation);
	let editableOpacity = $state(itemData.opacity);

	// --- Text Editing State ---
	let textContentForEdit = $state(
		itemData.item.type === 'text' ? (itemData.item as TextItem).text : ''
	);
	let textElementRef: HTMLDivElement | null = $state(null); // For bind:this

	// --- Image Toolbar State ---
	let toolbarImageUrl = $state('');
	let toolbarImageDescription = $state('');

	// --- Rectangle Toolbar State ---
	let toolbarRectFill = $state('#CCCCCC');
	let toolbarRectStroke = $state('#333333');
	let toolbarRectStrokeWidth = $state(1);

	$effect(() => {
		if (itemData.item.type === 'text') {
			const textItem = itemData.item as TextItem;
			textContentForEdit = textItem.text;
			toolbarFontFamily = textItem.font;
			toolbarFontSize = textItem.fontSize || 16; // Assumes TextItem has .fontSize
			toolbarFontColor = textItem.fontColor;
			toolbarBold = textItem.bold;
			toolbarItalic = textItem.italic;
			toolbarUnderline = textItem.underline;
			toolbarTextAlign = textItem.align;
			toolbarFitText = textItem.fitText === undefined ? true : textItem.fitText; // Default true if undefined
		} else if (itemData.item.type === 'enriched_image') {
			const imageItem = itemData.item as EnrichedImageItem;
			toolbarImageUrl = imageItem.url;
			toolbarImageDescription = imageItem.description || '';
		} else if (itemData.item.type === 'rectangle') {
			const rectItem = itemData.item as RectItem;
			toolbarRectFill = rectItem.fill;
			toolbarRectStroke = rectItem.stroke;
			toolbarRectStrokeWidth = rectItem.strokeWidth;
		}
		currentX = itemData.x;
		currentY = itemData.y;
		currentWidth = itemData.width;
		currentHeight = itemData.height;
		currentRotation = itemData.rotation;
		editableOpacity = itemData.opacity;
	});

	// --- Drag State ---
	let isDragging = $state(false);
	let dragStartMouseX = $state(0);
	let dragStartMouseY = $state(0);
	let dragStartElementX = $state(0);
	let dragStartElementY = $state(0);

	// --- Resize State ---
	let isResizing = $state(false);
	let activeHandle: string | null = $state(null);
	let resizeStartMouseX = $state(0);
	let resizeStartMouseY = $state(0);
	let resizeStartElementX = $state(0);
	let resizeStartElementY = $state(0);
	let resizeStartElementWidth = $state(0);
	let resizeStartElementHeight = $state(0);

	// --- Rotation State ---
	let isRotating = $state(false);
	let initialMouseAngleForRotation = $state(0);
	let initialElementRotation = $state(0);
	let elementCenterXOnRotateStart = $state(0);
	let elementCenterYOnRotateStart = $state(0);

	// --- Toolbar State ---
	// Text-specific toolbar states
	let toolbarFontFamily = $state('Arial');
	let toolbarFontSize = $state(16);
	let toolbarFontColor = $state('#000000');
	let toolbarBold = $state(false);
	let toolbarItalic = $state(false);
	let toolbarUnderline = $state(false);
	let toolbarTextAlign = $state<'left' | 'center' | 'right'>('left');
	let toolbarFitText = $state(true);

	function updateStore() {
		const currentDesign = artboardStore.image_enriched_design_json;
		if (currentDesign && currentDesign.items && currentDesign.items[itemIndex]) {
			const updatedItems = [...currentDesign.items];
			const itemToUpdate = JSON.parse(JSON.stringify(updatedItems[itemIndex])) as ItemInStore;

			itemToUpdate.x = Math.round(currentX);
			itemToUpdate.y = Math.round(currentY);
			itemToUpdate.width = Math.max(10, Math.round(currentWidth));
			itemToUpdate.height = Math.max(10, Math.round(currentHeight));
			itemToUpdate.rotation = currentRotation;
			itemToUpdate.opacity = editableOpacity;

			if (itemToUpdate.item.type === 'text') {
				const textItem = itemToUpdate.item as TextItem;
				textItem.text = textContentForEdit;
				textItem.font = toolbarFontFamily;
				textItem.fontSize = toolbarFontSize; // Persist the manually set font size
				textItem.fontColor = toolbarFontColor;
				textItem.fontWeight = toolbarBold ? 700 : 400;
				textItem.bold = toolbarBold;
				textItem.italic = toolbarItalic;
				textItem.underline = toolbarUnderline;
				textItem.align = toolbarTextAlign;
				textItem.fitText = toolbarFitText;
			} else if (itemToUpdate.item.type === 'enriched_image') {
				const imageItem = itemToUpdate.item as EnrichedImageItem;
				imageItem.url = toolbarImageUrl;
				imageItem.description = toolbarImageDescription;
			} else if (itemToUpdate.item.type === 'rectangle') {
				const rectItem = itemToUpdate.item as RectItem;
				rectItem.fill = toolbarRectFill;
				rectItem.stroke = toolbarRectStroke;
				rectItem.strokeWidth = toolbarRectStrokeWidth;
			}

			updatedItems[itemIndex] = itemToUpdate;
			artboardStore.image_enriched_design_json = {
				...currentDesign,
				items: updatedItems
			};
			artboardStore.modified = true;
		}
	}

	// --- Interaction Handlers ---
	function handleClick(event: MouseEvent) {
		event.stopPropagation();
		if (!isResizing && !isDragging) {
			if (artboardStore.selectedItemIndex !== itemIndex) {
				artboardStore.selectedItemIndex = itemIndex;
			}
		}
	}

	function handleTextChange(event: Event) {
		if (itemData.item.type === 'text') {
			textContentForEdit = (event.target as HTMLElement).innerText;
		}
	}

	function handleTextBlur() {
		if (itemData.item.type === 'text') {
			if (textContentForEdit !== (itemData.item as TextItem).text) {
				updateStore();
			}
		}
	}

	// --- Drag Handlers ---
	function onDragMouseDown(event: MouseEvent) {
		// Only allow drag if directly clicking the element and not a handle
		if ((event.target as HTMLElement).closest('[data-handle]')) return;
		if (!isSelected) return;

		event.preventDefault();
		event.stopPropagation();
		isDragging = true;
		dragStartMouseX = event.clientX;
		dragStartMouseY = event.clientY;
		dragStartElementX = currentX;
		dragStartElementY = currentY;
		window.addEventListener('mousemove', onDragMouseMove);
		window.addEventListener('mouseup', onDragMouseUp);
	}

	function onDragMouseMove(event: MouseEvent) {
		if (!isDragging) return;
		event.preventDefault();
		const { zoom } = artboardStore.viewSettings;
		const artboardDeltaX = (event.clientX - dragStartMouseX) / zoom;
		const artboardDeltaY = (event.clientY - dragStartMouseY) / zoom;
		currentX = dragStartElementX + artboardDeltaX;
		currentY = dragStartElementY + artboardDeltaY;
	}

	function onDragMouseUp(event: MouseEvent) {
		if (!isDragging) return;
		event.preventDefault();
		isDragging = false;
		window.removeEventListener('mousemove', onDragMouseMove);
		window.removeEventListener('mouseup', onDragMouseUp);
		updateStore();
	}

	// --- Resize Handlers ---
	function onResizeMouseDown(event: MouseEvent, handle: string) {
		event.preventDefault();
		event.stopPropagation();
		isResizing = true;
		activeHandle = handle;
		resizeStartMouseX = event.clientX;
		resizeStartMouseY = event.clientY;
		resizeStartElementX = currentX;
		resizeStartElementY = currentY;
		resizeStartElementWidth = currentWidth;
		resizeStartElementHeight = currentHeight;
		window.addEventListener('mousemove', onResizeMouseMove);
		window.addEventListener('mouseup', onResizeMouseUp);
	}

	function onResizeMouseMove(event: MouseEvent) {
		if (!isResizing || !activeHandle) return;
		event.preventDefault();
		const { zoom } = artboardStore.viewSettings;
		const mouseDeltaX = (event.clientX - resizeStartMouseX) / zoom;
		const mouseDeltaY = (event.clientY - resizeStartMouseY) / zoom;

		let newX = resizeStartElementX;
		let newY = resizeStartElementY;
		let newWidth = resizeStartElementWidth;
		let newHeight = resizeStartElementHeight;

		if (activeHandle.includes('e')) {
			newWidth = resizeStartElementWidth + mouseDeltaX;
		}
		if (activeHandle.includes('w')) {
			newWidth = resizeStartElementWidth - mouseDeltaX;
			newX = resizeStartElementX + mouseDeltaX;
		}
		if (activeHandle.includes('s')) {
			newHeight = resizeStartElementHeight + mouseDeltaY;
		}
		if (activeHandle.includes('n')) {
			newHeight = resizeStartElementHeight - mouseDeltaY;
			newY = resizeStartElementY + mouseDeltaY;
		}

		currentX = newX;
		currentY = newY;
		currentWidth = Math.max(10, newWidth); // Ensure min size
		currentHeight = Math.max(10, newHeight);
	}

	function onResizeMouseUp(event: MouseEvent) {
		if (!isResizing) return;
		event.preventDefault();
		isResizing = false;
		activeHandle = null;
		window.removeEventListener('mousemove', onResizeMouseMove);
		window.removeEventListener('mouseup', onResizeMouseUp);
		updateStore();
	}

	// --- Rotation Handlers ---
	function getElementCenter() {
		return {
			x: currentX + currentWidth / 2,
			y: currentY + currentHeight / 2
		};
	}

	function onRotationMouseDown(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		isRotating = true;

		const { zoom, panX, panY } = artboardStore.viewSettings;
		const artboardMouseX = (event.clientX - panX) / zoom;
		const artboardMouseY = (event.clientY - panY) / zoom;

		const center = getElementCenter();
		elementCenterXOnRotateStart = center.x;
		elementCenterYOnRotateStart = center.y;

		initialElementRotation = currentRotation;

		const dx = artboardMouseX - elementCenterXOnRotateStart;
		const dy = artboardMouseY - elementCenterYOnRotateStart;
		initialMouseAngleForRotation = Math.atan2(dy, dx) * (180 / Math.PI);

		window.addEventListener('mousemove', onRotationMouseMove);
		window.addEventListener('mouseup', onRotationMouseUp);
	}

	function onRotationMouseMove(event: MouseEvent) {
		if (!isRotating) return;
		event.preventDefault();

		const { zoom, panX, panY } = artboardStore.viewSettings;
		const artboardMouseX = (event.clientX - panX) / zoom;
		const artboardMouseY = (event.clientY - panY) / zoom;

		const dx = artboardMouseX - elementCenterXOnRotateStart;
		const dy = artboardMouseY - elementCenterYOnRotateStart;
		let currentMouseAngle = Math.atan2(dy, dx) * (180 / Math.PI);

		currentRotation = initialElementRotation + (currentMouseAngle - initialMouseAngleForRotation);
	}

	function onRotationMouseUp(event: MouseEvent) {
		if (!isRotating) return;
		event.preventDefault();
		isRotating = false;
		window.removeEventListener('mousemove', onRotationMouseMove);
		window.removeEventListener('mouseup', onRotationMouseUp);
		updateStore();
	}

	// --- Text Fitting Logic ---
	function fitTextToContainer(element: HTMLDivElement | null) {
		if (!BROWSER || !element || !toolbarFitText || itemData.item.type !== 'text') {
			element?.style.removeProperty('font-size'); // remove if fitText was turned off
			return;
		}
		const container = element;
		// Apply fixed styles first to get proper dimensions for calculation if fitText is off
		// This part is tricky as fitText ON should override fixed font size.
		// Let the main style block handle this. Here we just calculate if fitText is ON.

		let minSize = 5; // Min font size in px
		let maxSize = Math.max(20, currentHeight); // Max font size (e.g., container height)
		let bestSize = minSize;

		// Temporarily set text and styles for measurement
		const originalTextContent = element.textContent;
		element.textContent = textContentForEdit; // Use the latest content

		// Iterative approach to find best font size
		for (let currentSize = maxSize; currentSize >= minSize; currentSize -= 1) {
			element.style.fontSize = `${currentSize}px`;
			if (
				element.scrollWidth <= container.clientWidth &&
				element.scrollHeight <= container.clientHeight
			) {
				bestSize = currentSize;
				break;
			}
		}
		element.style.fontSize = `${bestSize}px`;
		// Restore original text content if it was different (though usually not needed if DOM updates after this)
		// if(element.textContent !== originalTextContent) element.textContent = originalTextContent;
	}

	$effect(() => {
		if (BROWSER && itemData.item.type === 'text' && toolbarFitText && textElementRef) {
			const dependencies = [textContentForEdit, currentWidth, currentHeight, toolbarFitText];
			requestAnimationFrame(() => fitTextToContainer(textElementRef));
		} else if (BROWSER && textElementRef && itemData.item.type === 'text' && !toolbarFitText) {
			textElementRef.style.removeProperty('font-size');
		}
	});

	// --- Lifecycle ---
	onMount(() => {
		console.log('EditableWrapper mounted for:', itemData.item.type, itemIndex);
	});

	onDestroy(() => {
		if (isDragging) {
			window.removeEventListener('mousemove', onDragMouseMove);
			window.removeEventListener('mouseup', onDragMouseUp);
		}
		if (isResizing) {
			window.removeEventListener('mousemove', onResizeMouseMove);
			window.removeEventListener('mouseup', onResizeMouseUp);
		}
		if (isRotating) {
			window.removeEventListener('mousemove', onRotationMouseMove);
			window.removeEventListener('mouseup', onRotationMouseUp);
		}
	});

	// --- Styles for the wrapper and content ---
	const wrapperStyle = $derived(() => {
		return `
			position: absolute;
			left: ${currentX}px;
			top: ${currentY}px;
			width: ${currentWidth}px;
			height: ${currentHeight}px;
			transform: rotate(${currentRotation}deg);
			border: ${isSelected ? '2px dashed blue' : '1px solid transparent'};
			cursor: ${isDragging ? 'grabbing' : isSelected && !activeHandle ? 'grab' : activeHandle ? getCursorForHandle(activeHandle) : 'pointer'};
			user-select: none;
			box-shadow: ${isSelected ? '0 0 5px rgba(0,0,255,0.5)' : 'none'};
		`;
	});

	const contentStyleBase = `width: 100%; height: 100%; display: block; box-sizing: border-box; pointer-events: none;`;

	// New derived style for the actual content element, including its opacity
	const actualContentStyle = $derived(() => {
		return `${contentStyleBase} opacity: ${editableOpacity / 100};`;
	});

	// Helper to get specific item type for cleaner access in template
	const itemValue = $derived(() => itemData.item);

	function getCursorForHandle(handle: string): string {
		switch (handle) {
			case 'n':
			case 's':
				return 'ns-resize';
			case 'e':
			case 'w':
				return 'ew-resize';
			case 'ne':
			case 'sw':
				return 'nesw-resize';
			case 'nw':
			case 'se':
				return 'nwse-resize';
			default:
				return 'default';
		}
	}

	const resizeHandleSize = 8;
	const resizeHandleOffset = resizeHandleSize / 2;

	// Opacity input blur handler (no separate change handler needed with bind:value)
	function handleOpacityInputBlur() {
		updateStore(); // Commit the opacity change from editableOpacity
	}

	function deleteItem() {
		console.log('Deleting item:', itemIndex);
		const currentDesign = artboardStore.image_enriched_design_json;
		if (currentDesign && currentDesign.items) {
			const updatedItems = currentDesign.items.filter((_, idx) => idx !== itemIndex);
			// Adjust selectedItemIndex if an item before the selected one is deleted
			let newSelectedItemIndex = artboardStore.selectedItemIndex;
			if (artboardStore.selectedItemIndex !== null) {
				if (itemIndex < artboardStore.selectedItemIndex) {
					newSelectedItemIndex = artboardStore.selectedItemIndex - 1;
				} else if (itemIndex === artboardStore.selectedItemIndex) {
					newSelectedItemIndex = null;
				}
			}
			artboardStore.image_enriched_design_json = {
				...currentDesign,
				items: updatedItems
			};
			artboardStore.selectedItemIndex = newSelectedItemIndex;
			artboardStore.modified = true;
		}
	}

	// --- Toolbar input change handlers ---
	// Generic handler for toolbar inputs that should trigger a store update on change or blur
	function handleToolbarInputChange() {
		updateStore();
	}

	function toggleBold() {
		toolbarBold = !toolbarBold;
		updateStore();
	}
	function toggleItalic() {
		toolbarItalic = !toolbarItalic;
		updateStore();
	}
	function toggleUnderline() {
		toolbarUnderline = !toolbarUnderline;
		updateStore();
	}
	function setTextAlign(align: 'left' | 'center' | 'right') {
		toolbarTextAlign = align;
		updateStore();
	}
	function toggleFitText() {
		toolbarFitText = !toolbarFitText;
		updateStore(); /* $effect will handle visual update */
	}
</script>

{#if itemData}
	<div
		data-item-index={itemIndex}
		class="editable-wrapper-class"
		style={wrapperStyle()}
		onclick={handleClick}
		onmousedown={onDragMouseDown}
	>
		{#if itemValue().type === 'text'}
			{@const textItem = itemValue() as TextItem}
			<div
				bind:this={textElementRef}
				contenteditable={isSelected}
				style={`
					${actualContentStyle()}
					pointer-events: ${isSelected && !isDragging && !isResizing ? 'auto' : 'none'};
					font-family: ${toolbarFontFamily};
					color: ${toolbarFontColor};
					${!toolbarFitText ? `font-size: ${toolbarFontSize}px;` : ''}
					font-weight: ${toolbarBold ? 'bold' : 'normal'};
					font-style: ${toolbarItalic ? 'italic' : 'normal'};
					text-decoration: ${toolbarUnderline ? 'underline' : 'none'};
					text-align: ${toolbarTextAlign};
					white-space: ${textItem.wrap ? 'normal' : 'nowrap'};
					overflow: hidden; 
					display: flex;
					align-items: center;
					justify-content: ${toolbarTextAlign === 'center' ? 'center' : toolbarTextAlign === 'right' ? 'flex-end' : 'flex-start'};
				`}
				oninput={handleTextChange}
				onblur={handleTextBlur}
			>
				{textContentForEdit}
			</div>
		{:else if itemValue().type === 'enriched_image'}
			{@const imageItem = itemValue() as EnrichedImageItem}
			<img
				src={imageItem.url}
				alt={imageItem.description || 'Image'}
				style={`${actualContentStyle()} object-fit: cover;`}
				draggable="false"
			/>
		{:else if itemValue().type === 'rectangle'}
			{@const rectItem = itemValue() as RectItem}
			<div
				style={`${actualContentStyle()} background-color: ${rectItem.fill}; border: ${rectItem.strokeWidth}px solid ${rectItem.stroke};`}
			></div>
		{:else if itemValue().type === 'new_image' || itemValue().type === 'existing_image'}
			<div
				style={`${actualContentStyle()} background-color: #eee; display:flex; align-items:center; justify-content:center; text-align:center; color: #777; font-size: 0.8em; padding: 5px;`}
			>
				{#if itemValue().type === 'new_image'}
					New Image: {(itemValue() as any).description || 'Generating...'}
				{:else}
					Existing Image ID: {(itemValue() as any).id || 'Loading...'}
				{/if}
			</div>
		{/if}

		{#if isSelected}
			{@const commonStaticStyle = `position: absolute; background: blue; border: 1px solid white; z-index: 11;`}
			{@const handleWidth = `${resizeHandleSize}px`}
			{@const handleHeight = `${resizeHandleSize}px`}
			{@const negOffset = `-${resizeHandleOffset}px`}
			{@const centerOffset = `calc(50% - ${resizeHandleOffset}px)`}

			<div
				data-handle="nw"
				style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; top: {negOffset}; left: {negOffset}; cursor: nwse-resize;"
				onmousedown={(e: MouseEvent) => onResizeMouseDown(e, 'nw')}
			></div>
			<div
				data-handle="ne"
				style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; top: {negOffset}; right: {negOffset}; cursor: nesw-resize;"
				onmousedown={(e: MouseEvent) => onResizeMouseDown(e, 'ne')}
			></div>
			<div
				data-handle="sw"
				style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; bottom: {negOffset}; left: {negOffset}; cursor: nesw-resize;"
				onmousedown={(e: MouseEvent) => onResizeMouseDown(e, 'sw')}
			></div>
			<div
				data-handle="se"
				style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; bottom: {negOffset}; right: {negOffset}; cursor: nwse-resize;"
				onmousedown={(e: MouseEvent) => onResizeMouseDown(e, 'se')}
			></div>

			<div
				data-handle="n"
				style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; top: {negOffset}; left: {centerOffset}; cursor: ns-resize;"
				onmousedown={(e: MouseEvent) => onResizeMouseDown(e, 'n')}
			></div>
			<div
				data-handle="s"
				style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; bottom: {negOffset}; left: {centerOffset}; cursor: ns-resize;"
				onmousedown={(e: MouseEvent) => onResizeMouseDown(e, 's')}
			></div>
			<div
				data-handle="w"
				style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; top: {centerOffset}; left: {negOffset}; cursor: ew-resize;"
				onmousedown={(e: MouseEvent) => onResizeMouseDown(e, 'w')}
			></div>

			<div
				data-handle="e"
				style="position: absolute; background: blue; border: 1px solid white; z-index: 11; width: {resizeHandleSize}px; height: {resizeHandleSize}px; top: calc(50% - {resizeHandleOffset}px); right: -{resizeHandleOffset}px; cursor: ew-resize;"
				onmousedown={(e: MouseEvent) => onResizeMouseDown(e, 'e')}
			></div>

			{@const rotationHandleOffset = 20}
			<div
				class="rotation-handle"
				style="position: absolute;
						left: calc(50% - 7px);
						top: -{rotationHandleOffset + 7}px;
						width: 14px; height: 14px;
						background-color: blue;
						border-radius: 50%;
						border: 1px solid white;
						cursor: alias;
						z-index: 12;"
				onmousedown={onRotationMouseDown}
			>
				<div
					style="position: absolute; left: 50%; top: 100%; width: 1px; height: {rotationHandleOffset}px; background: blue; transform: translateX(-50%);"
				></div>
			</div>

			<div
				class="absolute -top-32 right-0 z-[999] flex max-w-sm transform flex-wrap items-center gap-x-3 gap-y-1 whitespace-nowrap rounded-lg bg-card/80 px-3 py-2 text-card-foreground shadow-2xl ring-1 backdrop-blur-sm"
				style={`transform: rotate(${-currentRotation}deg); transform-origin: center center;`}
			>
				<label class="flex items-center gap-1 text-xs">
					<Blend class="h-4 w-4" />
					<input
						type="number"
						min="0"
						max="100"
						bind:value={editableOpacity}
						onblur={handleOpacityInputBlur}
						class="h-4 w-full cursor-pointer rounded-lg bg-gray-700 accent-blue-500"
						onmousedown={(e: MouseEvent) => e.stopPropagation()}
					/>
					<span class="w-7 text-right text-gray-300">{editableOpacity}%</span>
				</label>

				{#if itemValue().type === 'text'}
					<div class="h-5 border-l border-border"></div>
					<label class="flex items-center gap-1 text-xs"
						>Font: <input
							type="text"
							bind:value={toolbarFontFamily}
							oninput={handleToolbarInputChange}
							class="w-20 rounded border border-gray-600 bg-gray-700 px-1 py-0.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
							onmousedown={(e: MouseEvent) => e.stopPropagation()}
						/></label
					>
					<label class="flex items-center gap-1 text-xs"
						>Size: <input
							type="number"
							bind:value={toolbarFontSize}
							oninput={handleToolbarInputChange}
							class="w-12 rounded border border-gray-600 bg-gray-700 px-1 py-0.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
							disabled={toolbarFitText}
							onmousedown={(e: MouseEvent) => e.stopPropagation()}
						/></label
					>
					<label class="flex items-center gap-0.5 text-xs"
						>Color: <input
							type="color"
							bind:value={toolbarFontColor}
							oninput={handleToolbarInputChange}
							class="h-5 w-6 cursor-pointer rounded border border-gray-600 bg-transparent"
							onmousedown={(e: MouseEvent) => e.stopPropagation()}
						/></label
					>

					<div class="h-5 border-l border-gray-600"></div>
					<button
						title="Bold"
						onclick={toggleBold}
						class:active-tool={toolbarBold}
						class="rounded px-1.5 py-0.5 text-xs hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 {toolbarBold
							? 'bg-blue-600 text-white'
							: 'bg-gray-600 text-gray-300'}"
						onmousedown={(e: MouseEvent) => e.stopPropagation()}>B</button
					>
					<button
						title="Italic"
						onclick={toggleItalic}
						class:active-tool={toolbarItalic}
						class="rounded px-1.5 py-0.5 text-xs hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 {toolbarItalic
							? 'bg-blue-600 text-white'
							: 'bg-gray-600 text-gray-300'}"
						onmousedown={(e: MouseEvent) => e.stopPropagation()}>I</button
					>
					<button
						title="Underline"
						onclick={toggleUnderline}
						class:active-tool={toolbarUnderline}
						class="rounded px-1.5 py-0.5 text-xs hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 {toolbarUnderline
							? 'bg-blue-600 text-white'
							: 'bg-gray-600 text-gray-300'}"
						onmousedown={(e: MouseEvent) => e.stopPropagation()}>U</button
					>

					<div class="h-5 border-l border-gray-600"></div>
					<button
						title="Align Left"
						onclick={() => setTextAlign('left')}
						class:active={toolbarTextAlign === 'left'}
						class="rounded px-1.5 py-0.5 text-xs hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 {toolbarTextAlign ===
						'left'
							? 'bg-blue-600 text-white'
							: 'bg-gray-600 text-gray-300'}"
						onmousedown={(e: MouseEvent) => e.stopPropagation()}>L</button
					>
					<button
						title="Align Center"
						onclick={() => setTextAlign('center')}
						class:active={toolbarTextAlign === 'center'}
						class="rounded px-1.5 py-0.5 text-xs hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 {toolbarTextAlign ===
						'center'
							? 'bg-blue-600 text-white'
							: 'bg-gray-600 text-gray-300'}"
						onmousedown={(e: MouseEvent) => e.stopPropagation()}>C</button
					>
					<button
						title="Align Right"
						onclick={() => setTextAlign('right')}
						class:active={toolbarTextAlign === 'right'}
						class="rounded px-1.5 py-0.5 text-xs hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 {toolbarTextAlign ===
						'right'
							? 'bg-blue-600 text-white'
							: 'bg-gray-600 text-gray-300'}"
						onmousedown={(e: MouseEvent) => e.stopPropagation()}>R</button
					>

					<div class="h-5 border-l border-gray-600"></div>
					<button
						title="Fit Text to Box"
						onclick={toggleFitText}
						class:active={toolbarFitText}
						class="rounded px-1.5 py-0.5 text-xs hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 {toolbarFitText
							? 'bg-blue-600 text-white'
							: 'bg-gray-600 text-gray-300'}"
						onmousedown={(e: MouseEvent) => e.stopPropagation()}>Fit</button
					>
				{/if}

				<div class="h-5 border-l border-gray-600"></div>
				<button
					title="Delete Item"
					onclick={deleteItem}
					onmousedown={(e: MouseEvent) => e.stopPropagation()}
					class="px-1 py-0.5 text-lg text-gray-300 hover:text-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
				>
					🗑️
				</button>
			</div>
		{/if}
	</div>
{/if}

<!-- End of #if itemData -->

<!--
TODO:
- Implement actual drag functionality (on:mousedown on the main div, on:mousemove, on:mouseup on window)
  - Update currentX, currentY and then call updateStore() on drag end.
- Implement actual resize functionality using the handles.
  - Update currentWidth, currentHeight (and potentially X,Y) and then call updateStore() on resize end.
- Flesh out the toolbar with actual controls for each item type.
  - Controls should modify local reactive state (e.g., a temporary color state)
  - An "Apply" button in the toolbar or on-change events would call updateStore().
- Refine text editing, especially the binding or update mechanism for textContentForEdit.
- Global selection management (ensure only one element is selected, or manage multiple selections).
- Rotation handle and logic.
- Ensure all editable properties from StructuredDesignProcessedImageItems are covered.
- The `updateStore` function needs to be robust and correctly handle updates for all item types and their specific editable properties.
- Consider debouncing store updates for frequent actions like dragging/resizing if performance becomes an issue.
-->

<style>
	/* Remove all previous .toolbar-item, .toolbar-button, etc. styles as Tailwind is used directly */
	/* Styles for specific interactive states not easily done with pure Tailwind variants, or for consistency */
	.rotation-handle:hover {
		background-color: darkblue;
	}
	/* Tailwind's focus:ring is used, so explicit focus styles might not be needed unless for very custom cases */
</style>
