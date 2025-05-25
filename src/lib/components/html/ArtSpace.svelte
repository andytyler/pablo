<script lang="ts">
	import { frameStore, resetFrame } from '$lib/stores/frame-store.svelte';
	import { Trash } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import HtmlRenderer from './HtmlRenderer.svelte';

	// Local state for drag handling
	let isDragging = $state(false);
	let startDragX = $state(0);
	let startDragY = $state(0);
	let frameContainer: HTMLElement;

	// // Function to handle clicks on the artboard background itself
	// function handleArtboardBackgroundClick(event: MouseEvent) {
	// 	if (browser) {
	// 		let gridDots: HTMLElement | null = document.getElementById('grid-dots');
	// 		// Ensure the click is directly on the artboardContainer and not its children
	// 		// and that we are not in a dragging operation (though onclick typically doesn't fire after a drag, this is an extra check)
	// 		if (event.target === frameContainer || event.target === gridDots) {
	// 			if (frameStore.selected_element !== null) {
	// 				frameStore.selected_element = null;
	// 			}
	// 		}
	// 	}
	// }

	// function clearArtboard() {
	// 	frameStore.html.processed = null;
	// 	frameStore.frame.width = 300;
	// 	frameStore.frame.height = 400;
	// }

	// // --- Google Fonts Loading ---
	// let uniqueFonts = $derived(() => {
	// 	const design = frameStore.html.processed;
	// 	if (!design || !design.items || design.items.length === 0) {
	// 		return [];
	// 	}
	// 	const allFonts = design.items
	// 		.filter((itemWrapper) => {
	// 			if (itemWrapper && itemWrapper.item && itemWrapper.item.type === 'text') {
	// 				// Assuming TextItem might have a font property
	// 				const font = (itemWrapper.item as { font?: string }).font;
	// 				return typeof font === 'string' && font.trim() !== '';
	// 			}
	// 			return false;
	// 		})
	// 		.map((itemWrapper) => (itemWrapper.item as { font: string }).font);

	// 	return [...new Set(allFonts)];
	// });

	// let googleFontsLink = $derived(() => {
	// 	if (!uniqueFonts || uniqueFonts().length === 0) {
	// 		return '';
	// 	}
	// 	const fontFamilies = uniqueFonts()
	// 		.map((font: string) => font.replace(/ /g, '+'))
	// 		.join('&family=');
	// 	return `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
	// });
	// // --- End Google Fonts Loading ---

	// // Handle mouse wheel for zooming
	// function handleWheel(event: WheelEvent) {
	// 	event.preventDefault();
	// 	const delta = -Math.sign(event.deltaY);
	// 	if (delta > 0) {
	// 		updateZoom(zoom + 0.05);
	// 	} else {
	// 		updateZoom(zoom - 0.05);
	// 	}
	// }

	// // Handle mouse drag for panning
	// function handleMouseDown(event: MouseEvent) {
	// 	if (event.button === 0) {
	// 		// Left mouse button
	// 		isDragging = true;
	// 		startDragX = event.clientX - panX;
	// 		startDragY = event.clientY - panY;
	// 	}
	// }

	// function handleMouseMove(event: MouseEvent) {
	// 	if (isDragging) {
	// 		const newPanX = event.clientX - startDragX;
	// 		const newPanY = event.clientY - startDragY;
	// 		updatePan(newPanX, newPanY);
	// 	}
	// }

	// function handleMouseUp() {
	// 	isDragging = false;
	// }

	// // Update grid dots according to zoom
	// $effect(() => {
	// 	if (browser) {
	// 		const gridDots = document.getElementById('grid-dots');
	// 		if (gridDots) {
	// 			gridDots.style.backgroundSize = `${gridSize}px ${gridSize}px`;
	// 			gridDots.style.backgroundImage = `radial-gradient(circle, #444 ${dotSize}px, transparent ${dotSize}px)`;
	// 			// Move background position with pan to create the infinite canvas effect
	// 			const offsetX = (panX % gridSize) / zoom;
	// 			const offsetY = (panY % gridSize) / zoom;
	// 			gridDots.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
	// 		}
	// 	}
	// });

	// onMount(() => {
	// 	// Add event listeners for wheel and mouse events
	// 	if (artboardContainer) {
	// 		artboardContainer.addEventListener('wheel', handleWheel, { passive: false });
	// 	}

	// 	// Add document-level event listeners for drag that might go beyond container
	// 	document.addEventListener('mousemove', handleMouseMove);
	// 	document.addEventListener('mouseup', handleMouseUp);

	// 	return () => {
	// 		// Clean up event listeners on component destroy
	// 		if (artboardContainer) {
	// 			artboardContainer.removeEventListener('wheel', handleWheel);
	// 		}
	// 		document.removeEventListener('mousemove', handleMouseMove);
	// 		document.removeEventListener('mouseup', handleMouseUp);
	// 	};
	// });
</script>

<div
	class="relative flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(theme(colors.slate.500)_0.5px,transparent_0.5px)] [background-size:16px_16px]"
>
	<div class="z-10 flex flex-col items-start gap-2">
		<div class="flex flex-row items-center gap-2">
			<!-- SIZE CONTROLS -->
			<div class="flex flex-row items-center gap-2">
				<label for="canvas-width" class="text-sm text-muted-foreground">Width:</label>
				<input
					id="canvas-width"
					type="number"
					bind:value={frameStore.frame.width}
					class="flex-0 w-16 max-w-min rounded-md border bg-card px-2 py-1 text-sm text-muted-foreground focus:outline-none focus:ring-0"
				/>
			</div>
			<div class="flex items-center gap-2">
				<label for="canvas-height" class="text-sm text-muted-foreground">Height:</label>
				<input
					id="canvas-height"
					type="number"
					bind:value={frameStore.frame.height}
					class="flex-0 w-16 max-w-min rounded-md border bg-card px-2 py-1 text-sm text-muted-foreground focus:outline-none focus:ring-0"
				/>
			</div>
		</div>
		<HtmlRenderer />
		<div class="flex flex-row items-end gap-2">
			<Button variant="outline" size="icon" onclick={resetFrame} title="Clear Artboard">
				<Trash class="h-4 w-4" />
			</Button>
		</div>
	</div>
</div>
