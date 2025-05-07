<script lang="ts">
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import {
		artboardStore,
		resetArtboardView,
		updatePan,
		updateZoom
	} from '$lib/stores/artboard-store.svelte';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import ZoomIn from '@lucide/svelte/icons/zoom-in';
	import ZoomOut from '@lucide/svelte/icons/zoom-out';
	import { Trash } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import HtmlRenderer from './HtmlRenderer.svelte';

	// Use state from the store
	let zoom = $derived(artboardStore.viewSettings.zoom);
	let panX = $derived(artboardStore.viewSettings.panX);
	let panY = $derived(artboardStore.viewSettings.panY);

	// Local state for drag handling
	let isDragging = $state(false);
	let startDragX = $state(0);
	let startDragY = $state(0);
	let artboardContainer: HTMLElement;

	// Function to handle clicks on the artboard background itself
	function handleArtboardBackgroundClick(event: MouseEvent) {
		if (browser) {
			let gridDots: HTMLElement | null = document.getElementById('grid-dots');
			// Ensure the click is directly on the artboardContainer and not its children
			// and that we are not in a dragging operation (though onclick typically doesn't fire after a drag, this is an extra check)
			if (event.target === artboardContainer || event.target === gridDots) {
				if (artboardStore.selectedItemIndex !== null) {
					artboardStore.selectedItemIndex = null;
				}
			}
		}
	}

	function clearArtboard() {
		artboardStore.image_enriched_design_json = null;
		artboardStore.artboard_width = 600;
		artboardStore.artboard_height = 600;
	}

	// --- Google Fonts Loading ---
	let uniqueFonts = $derived(() => {
		const design = artboardStore.image_enriched_design_json;
		if (!design || !design.items || design.items.length === 0) {
			return [];
		}
		const allFonts = design.items
			.filter((itemWrapper) => {
				if (itemWrapper && itemWrapper.item && itemWrapper.item.type === 'text') {
					// Assuming TextItem might have a font property
					const font = (itemWrapper.item as { font?: string }).font;
					return typeof font === 'string' && font.trim() !== '';
				}
				return false;
			})
			.map((itemWrapper) => (itemWrapper.item as { font: string }).font);

		return [...new Set(allFonts)];
	});

	let googleFontsLink = $derived(() => {
		if (!uniqueFonts || uniqueFonts().length === 0) {
			return '';
		}
		const fontFamilies = uniqueFonts()
			.map((font: string) => font.replace(/ /g, '+'))
			.join('&family=');
		return `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
	});
	// --- End Google Fonts Loading ---

	// Grid properties
	let gridSize = $derived(20 * zoom); // Scale grid size directly with zoom level
	let dotSize = $derived(1 * zoom); // Scale dot size directly with zoom level

	// Reset zoom and pan
	function resetView() {
		resetArtboardView();
	}

	// Zoom in/out functions
	function zoomIn() {
		updateZoom(zoom + 0.1);
	}

	function zoomOut() {
		updateZoom(zoom - 0.1);
	}

	// Handle mouse wheel for zooming
	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		const delta = -Math.sign(event.deltaY);
		if (delta > 0) {
			updateZoom(zoom + 0.05);
		} else {
			updateZoom(zoom - 0.05);
		}
	}

	// Handle mouse drag for panning
	function handleMouseDown(event: MouseEvent) {
		if (event.button === 0) {
			// Left mouse button
			isDragging = true;
			startDragX = event.clientX - panX;
			startDragY = event.clientY - panY;
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (isDragging) {
			const newPanX = event.clientX - startDragX;
			const newPanY = event.clientY - startDragY;
			updatePan(newPanX, newPanY);
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	// Update grid dots according to zoom
	$effect(() => {
		if (browser) {
			const gridDots = document.getElementById('grid-dots');
			if (gridDots) {
				gridDots.style.backgroundSize = `${gridSize}px ${gridSize}px`;
				gridDots.style.backgroundImage = `radial-gradient(circle, #444 ${dotSize}px, transparent ${dotSize}px)`;
				// Move background position with pan to create the infinite canvas effect
				const offsetX = (panX % gridSize) / zoom;
				const offsetY = (panY % gridSize) / zoom;
				gridDots.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
			}
		}
	});

	onMount(() => {
		// Add event listeners for wheel and mouse events
		if (artboardContainer) {
			artboardContainer.addEventListener('wheel', handleWheel, { passive: false });
		}

		// Add document-level event listeners for drag that might go beyond container
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			// Clean up event listeners on component destroy
			if (artboardContainer) {
				artboardContainer.removeEventListener('wheel', handleWheel);
			}
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href={googleFontsLink()} rel="stylesheet" />
</svelte:head>

<div
	aria-label="Artboard"
	role="region"
	class="relative flex h-full w-full flex-1 items-center justify-center bg-background"
	bind:this={artboardContainer}
	onmousedown={handleMouseDown}
	onclick={handleArtboardBackgroundClick}
	style="cursor: {isDragging ? 'grabbing' : 'grab'}; "
>
	<!-- Dotted background pattern -->
	<div id="grid-dots" class="grid-dots absolute inset-0"></div>

	<!-- Zoom controls -->
	<div class="absolute right-4 top-4 z-10 flex flex-row gap-1">
		<Button variant="outline" size="icon" onclick={zoomIn} title="Zoom In">
			<ZoomIn class="h-4 w-4" />
		</Button>
		<Button variant="outline" size="icon" onclick={zoomOut} title="Zoom Out">
			<ZoomOut class="h-4 w-4" />
		</Button>
		<Button variant="outline" size="icon" onclick={resetView} title="Reset View">
			<RotateCcw class="h-4 w-4" />
		</Button>
	</div>

	<!-- Zoom level indicator -->
	<div
		class="absolute bottom-4 right-4 z-50 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground"
	>
		{Math.round(zoom * 100)}%
	</div>

	<div
		class="flex transform flex-col gap-2"
		style="transform: translate({panX}px, {panY}px) scale({zoom});"
	>
		<!-- SIZE CONTROLS -->
		<div class="flex flex-row items-center gap-2">
			<div class="flex items-center gap-2">
				<label for="canvas-width" class="text-sm text-muted-foreground">Width:</label>
				<input
					id="canvas-width"
					type="number"
					bind:value={artboardStore.artboard_width}
					class="flex-0 w-16 max-w-min rounded-md border bg-transparent px-2 py-1 text-sm text-muted-foreground focus:outline-none focus:ring-0"
				/>
			</div>
			<div class="flex items-center gap-2">
				<label for="canvas-height" class="text-sm text-muted-foreground">Height:</label>
				<input
					id="canvas-height"
					type="number"
					bind:value={artboardStore.artboard_height}
					class="flex-0 w-16 max-w-min rounded-md border bg-transparent px-2 py-1 text-sm text-muted-foreground focus:outline-none focus:ring-0"
				/>
			</div>
		</div>
		<!-- FRAME -->
		<div id="design-canvas" class="flex-0 rounded-md border-2 border-dashed border-border bg-white">
			<HtmlRenderer
				canvasWidth={artboardStore.artboard_width}
				canvasHeight={artboardStore.artboard_height}
			/>
		</div>

		<div class="flex flex-row justify-between gap-2">
			<p>
				{artboardStore.image_enriched_design_json?.concept}
			</p>
			<Button variant="outline" size="icon" onclick={clearArtboard} title="Clear Artboard">
				<Trash class="h-4 w-4" />
			</Button>
		</div>
	</div>
</div>

<style>
	/* Dotted background pattern */
	.grid-dots {
		opacity: 0.8;
		/* Background styling is now handled dynamically in the $effect */
	}

	/* Ensure the content maintains crisp text during zoom */
	.transform {
		will-change: transform;
		transform-origin: center center;
		transition: transform 0.05s ease-out;
	}
</style>
