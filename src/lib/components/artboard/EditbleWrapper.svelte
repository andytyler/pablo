<script lang="ts">
	import { artboardStore } from '$lib/stores/artboard-store.svelte';
	import { onDestroy, onMount } from 'svelte';
	import type {
		EnrichedImageItem,
		RectItem,
		StructuredDesignProcessedImageItems,
		TextItem
	} from '../../../routes/api/generate-design/step1/design';

	// Svelte 5 Props
	type ItemInStore = StructuredDesignProcessedImageItems['items'][number];
	let { itemData, itemIndex }: { itemData: ItemInStore; itemIndex: number } = $props();

	// Local reactive state for the wrapper
	let isSelected = $state(false);
	let currentX = $state(itemData.x);
	let currentY = $state(itemData.y);
	let currentWidth = $state(itemData.width);
	let currentHeight = $state(itemData.height);
	let currentRotation = $state(itemData.rotation);
	let currentOpacity = $state(itemData.opacity); // Assuming opacity is 0-100

	// Element-specific data (e.g., text content, image URL)
	let textContentForEdit = $state(
		itemData.item.type === 'text' ? (itemData.item as TextItem).text : ''
	);

	$effect(() => {
		if (itemData.item.type === 'text') {
			textContentForEdit = (itemData.item as TextItem).text;
		}
		// Update local reactive state if itemData changes from the store externally
		// This is important if another process modifies the item, so the wrapper reflects it.
		currentX = itemData.x;
		currentY = itemData.y;
		currentWidth = itemData.width;
		currentHeight = itemData.height;
		currentRotation = itemData.rotation;
		currentOpacity = itemData.opacity;
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

	function updateStore() {
		const currentDesign = artboardStore.image_enriched_design_json;
		if (currentDesign && currentDesign.items && currentDesign.items[itemIndex]) {
			const updatedItems = [...currentDesign.items];
			const itemToUpdate = JSON.parse(JSON.stringify(updatedItems[itemIndex])) as ItemInStore;

			itemToUpdate.x = Math.round(currentX);
			itemToUpdate.y = Math.round(currentY);
			itemToUpdate.width = Math.max(10, Math.round(currentWidth)); // Min width 10px
			itemToUpdate.height = Math.max(10, Math.round(currentHeight)); // Min height 10px
			itemToUpdate.rotation = currentRotation;
			itemToUpdate.opacity = currentOpacity;

			if (itemToUpdate.item.type === 'text') {
				(itemToUpdate.item as TextItem).text = textContentForEdit;
			} else if (itemToUpdate.item.type === 'enriched_image') {
				// TODO: Add image properties (e.g., description, or if URL changes)
			} else if (itemToUpdate.item.type === 'rectangle') {
				// TODO: Add rect properties (fill, stroke)
			}

			updatedItems[itemIndex] = itemToUpdate;
			artboardStore.image_enriched_design_json = {
				...currentDesign,
				items: updatedItems
			};
			artboardStore.modified = true; // Indicate that the design has been changed
		}
	}

	// --- Interaction Handlers ---
	function handleClick(event: MouseEvent) {
		event.stopPropagation();
		if (!isResizing && !isDragging) {
			// Only handle click if not part of a resize/drag op
			if (!isSelected) {
				isSelected = true;
			}
		}
		console.log('Element selected:', itemData.item.type, itemIndex, isSelected);
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
			opacity: ${currentOpacity / 100};
			border: ${isSelected ? '2px dashed blue' : '1px solid transparent'};
			cursor: ${isDragging ? 'grabbing' : isSelected && !activeHandle ? 'grab' : activeHandle ? getCursorForHandle(activeHandle) : 'pointer'};
			user-select: none;
			box-shadow: ${isSelected ? '0 0 5px rgba(0,0,255,0.5)' : 'none'};
		`;
	});

	const contentStyleBase = `width: 100%; height: 100%; display: block; box-sizing: border-box; pointer-events: none;`;

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
</script>

<div style={wrapperStyle()} onclick={handleClick} onmousedown={onDragMouseDown}>
	{#if itemValue().type === 'text'}
		{@const textItem = itemValue() as TextItem}
		<div
			contenteditable={isSelected && !isDragging && !isResizing}
			style="{contentStyleBase} pointer-events: {isSelected && !isDragging && !isResizing
				? 'auto'
				: 'none'}; /* Allow pointer events on text only when editable */
						font-family: {textItem.font};
						color: {textItem.fontColor};
						font-weight: {textItem.fontWeight};
						text-align: {textItem.align};
						font-style: {textItem.italic ? 'italic' : 'normal'};
						text-decoration: {textItem.underline ? 'underline' : 'none'};
						white-space: {textItem.wrap ? 'normal' : 'nowrap'};
						overflow: hidden;
						display: flex;
            align-items: center;
            justify-content: {textItem.align === 'center'
				? 'center'
				: textItem.align === 'right'
					? 'flex-end'
					: 'flex-start'};"
			oninput={handleTextChange}
			onblur={handleTextBlur}
		>
			{textItem.text}
		</div>
	{:else if itemValue().type === 'enriched_image'}
		{@const imageItem = itemValue() as EnrichedImageItem}
		<img
			src={imageItem.url}
			alt={imageItem.description || 'Image'}
			style="{contentStyleBase} object-fit: cover;"
			draggable="false"
		/>
	{:else if itemValue().type === 'rectangle'}
		{@const rectItem = itemValue() as RectItem}
		<div
			style="{contentStyleBase}
						background-color: {rectItem.fill};
						border: {rectItem.strokeWidth}px solid {rectItem.stroke};"
		></div>
	{:else if itemValue().type === 'new_image' || itemValue().type === 'existing_image'}
		<div
			style="{contentStyleBase} background-color: #eee; display:flex; align-items:center; justify-content:center; text-align:center; color: #777; font-size: 0.8em; padding: 5px;"
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
			onmousedown={(e) => onResizeMouseDown(e, 'nw')}
		></div>
		<div
			data-handle="ne"
			style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; top: {negOffset}; right: {negOffset}; cursor: nesw-resize;"
			onmousedown={(e) => onResizeMouseDown(e, 'ne')}
		></div>
		<div
			data-handle="sw"
			style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; bottom: {negOffset}; left: {negOffset}; cursor: nesw-resize;"
			onmousedown={(e) => onResizeMouseDown(e, 'sw')}
		></div>
		<div
			data-handle="se"
			style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; bottom: {negOffset}; right: {negOffset}; cursor: nwse-resize;"
			onmousedown={(e) => onResizeMouseDown(e, 'se')}
		></div>

		<div
			data-handle="n"
			style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; top: {negOffset}; left: {centerOffset}; cursor: ns-resize;"
			onmousedown={(e) => onResizeMouseDown(e, 'n')}
		></div>
		<div
			data-handle="s"
			style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; bottom: {negOffset}; left: {centerOffset}; cursor: ns-resize;"
			onmousedown={(e) => onResizeMouseDown(e, 's')}
		></div>
		<div
			data-handle="w"
			style="{commonStaticStyle} width: {handleWidth}; height: {handleHeight}; top: {centerOffset}; left: {negOffset}; cursor: ew-resize;"
			onmousedown={(e) => onResizeMouseDown(e, 'w')}
		></div>

		<div
			data-handle="e"
			style="position: absolute; background: blue; border: 1px solid white; z-index: 11; width: {resizeHandleSize}px; height: {resizeHandleSize}px; top: calc(50% - {resizeHandleOffset}px); right: -{resizeHandleOffset}px; cursor: ew-resize;"
			onmousedown={(e) => onResizeMouseDown(e, 'e')}
		></div>

		<div
			style="position: absolute; top: -35px; left: 0; background: white; border: 1px solid #ccc; padding: 5px; z-index: 10; white-space: nowrap;"
		>
			Toolbar for {itemValue().type}
		</div>
	{/if}
</div>

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
