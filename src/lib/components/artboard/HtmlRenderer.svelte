<script lang="ts">
	import { imageEnrichedDesignJsonToHtml } from '$lib/connections/transformers';
	// Component to render HTML content directly in the design artboard
	// This will accept HTML string and display it in a container
	import { artboardHTMLStore, artboardStore } from '$lib/stores/artboard-store.svelte';
	import { onMount } from 'svelte';

	// Use $props() for Svelte 5 with proper typing
	let { canvasWidth = 500, canvasHeight = 700 } = $props<{
		canvasWidth?: number;
		canvasHeight?: number;
	}>();

	// References
	let canvasContainerId = 'canvas-container';

	$effect(() => {
		if (!artboardStore.image_enriched_design_json) return;
		artboardHTMLStore.html = imageEnrichedDesignJsonToHtml(
			artboardStore.image_enriched_design_json
		);
	});

	// Function to fit text within containers
	function fitTextInContainers() {
		// Find all elements with the fit-text class
		const textElements = document.querySelectorAll('.fit-text');

		textElements.forEach((el) => {
			const element = el as HTMLElement;
			const container = element;
			const text = element.textContent || '';

			// Start with a base font size and adjust
			let fontSize = 100; // in percentage
			element.style.fontSize = `${fontSize}%`;

			// Binary search to find the optimal font size
			let minSize = 10;
			let maxSize = 1000;

			while (maxSize - minSize > 1) {
				fontSize = Math.floor((minSize + maxSize) / 2);
				element.style.fontSize = `${fontSize}%`;

				// Check if text overflows
				if (
					container.scrollHeight > container.clientHeight ||
					container.scrollWidth > container.clientWidth
				) {
					maxSize = fontSize;
				} else {
					minSize = fontSize;
				}
			}

			// Set the final size slightly smaller to ensure it fits
			element.style.fontSize = `${minSize * 0.95}%`;
		});
	}

	// Watch for content changes
	$effect(() => {
		if (artboardHTMLStore.html) {
			// Use setTimeout to ensure the DOM has updated
			setTimeout(fitTextInContainers, 0);
		}
	});

	// Resize handling
	onMount(() => {
		// Initial text fitting
		setTimeout(fitTextInContainers, 100);

		// Adjust text on window resize
		const resizeObserver = new ResizeObserver(() => {
			fitTextInContainers();
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
</script>

{#if artboardHTMLStore.html}
	<div
		class="relative flex overflow-hidden"
		id={canvasContainerId}
		style="width: {canvasWidth}px; height: {canvasHeight}px"
	>
		{@html artboardHTMLStore.html}
	</div>
{:else}
	<div
		class="relative flex items-center justify-center overflow-hidden"
		id={canvasContainerId}
		style="width: {canvasWidth}px; height: {canvasHeight}px"
	>
		{#if artboardStore.isLoading}
			<div class="text-center text-muted-foreground">Loading...</div>
		{:else if artboardStore.isWaiting}
			<div class="text-center text-muted-foreground">Waiting...</div>
		{:else}
			<div class="text-center text-muted-foreground">New Artboard</div>
		{/if}
	</div>
{/if}
