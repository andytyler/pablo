<script lang="ts">
	// import { imageEnrichedDesignJsonToHtml } from '$lib/connections/transformers'; // No longer needed directly here
	import { artboardStore } from '$lib/stores/artboard-store.svelte'; // artboardHTMLStore is no longer primary here
	import { onDestroy, onMount } from 'svelte';
	import EditbleWrapper from './EditbleWrapper.svelte';
	import WaveAnimation from './WaveAnimation.svelte';
	// Import the new wrapper

	// Use $props() for Svelte 5 with proper typing
	let { canvasWidth = 800, canvasHeight = 600 } = $props<{
		canvasWidth?: number;
		canvasHeight?: number;
	}>();

	// References
	let canvasContainerId = 'canvas-container-' + Math.random().toString(36).substring(2, 9); // Unique ID for multiple renderers if ever needed

	// The design JSON is now directly used for rendering items
	let designJson = $derived(artboardStore.image_enriched_design_json);

	// Function for handling clicks on the artboard background to deselect items
	function handleArtboardBackgroundClick(event: MouseEvent) {
		// If the click is directly on this container (not bubbled from a child like EditbleWrapper which stops propagation)
		// then deselect any currently selected item.
		if (event.target === event.currentTarget) {
			if (artboardStore.selectedItemIndex !== null) {
				artboardStore.selectedItemIndex = null;
				// console.log('Artboard background clicked, deselected item.');
			}
		}
	}

	// Function to fit text within containers (might still be useful if text elements within EditbleWrapper need it,
	// or could be moved/adapted into EditbleWrapper if direct DOM manipulation for text fitting is still desired there)
	// For now, let's keep it, but its usage context changes.
	function fitTextInContainers() {
		const textElements = document.querySelectorAll('.fit-text-via-script'); // Example class, if needed

		textElements.forEach((el) => {
			const element = el as HTMLElement;
			const container = element;
			// ... (rest of the fitTextInContainers logic)
			// This function may need significant rework or removal if text fitting is handled entirely by CSS or within EditbleWrapper
		});
	}

	// Watch for content changes - this might not be needed in the same way
	// $effect(() => {
	// 	if (artboardHTMLStore.html) { // We are not using artboardHTMLStore.html anymore
	// 		setTimeout(fitTextInContainers, 0);
	// 	}
	// });

	// Resize handling
	onMount(() => {
		// setTimeout(fitTextInContainers, 100); // Initial call if still used

		const resizeObserver = new ResizeObserver(() => {
			// fitTextInContainers(); // Call if still used
		});

		const container = document.getElementById(canvasContainerId);
		if (container) {
			resizeObserver.observe(container);
		}

		return () => {
			if (container) {
				resizeObserver.disconnect();
			}
		};
	});

	onDestroy(() => {
		// const container = document.getElementById(canvasContainerId);
		// if (container) { /* ... disconnect observer if needed ... */ }
	});
</script>

{#if designJson && designJson.items && designJson.items.length > 0}
	<div
		class="design-canvas-area relative flex bg-gray-100 dark:bg-gray-900"
		id={canvasContainerId}
		style="width: {canvasWidth}px; height: {canvasHeight}px; background-color: {designJson.background ||
			'#ffffff'}; overflow: {artboardStore.selectedItemIndex === null ? 'hidden' : 'visible'};"
		onclick={handleArtboardBackgroundClick}
	>
		{#each designJson.items as item, index ((item.item as { id?: string })?.id || index)}
			<!-- Use item.item.id for images if available, or index as fallback key -->
			<EditbleWrapper itemData={item} itemIndex={index} />
		{/each}
	</div>
{:else}
	<div
		class="design-canvas-area relative flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-900"
		id={canvasContainerId}
		style="width: {canvasWidth}px; height: {canvasHeight}px"
		onclick={handleArtboardBackgroundClick}
	>
		{#if artboardStore.isLoading}
			<WaveAnimation borderWidth={18} animationSpeed={3} variant="loading" />
			<div class="z-10 text-center text-muted-foreground">Loading...</div>
		{:else if artboardStore.isWaiting}
			<WaveAnimation borderWidth={20} animationSpeed={4} variant="waiting" />
			<div class="z-10 text-center text-muted-foreground">Waiting...</div>
		{:else}
			<div class="z-10 text-center text-muted-foreground">
				New Artboard - Start by describing your design!
			</div>
		{/if}
	</div>
{/if}

<style>
	.design-canvas-area {
		position: relative;
		/* Minimal essential style. All other comments and example styles removed. */
	}
</style>
