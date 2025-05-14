<script lang="ts">
	// import { imageEnrichedDesignJsonToHtml } from '$lib/connections/transformers'; // No longer needed directly here
	import { browser } from '$app/environment';
	import { frameStore } from '$lib/stores/frame-store.svelte';
	import WaveAnimation from '../artboard/WaveAnimation.svelte';

	// Function to extract dimensions from HTML
	function extractDimensions(htmlString: string): { width?: number; height?: number } {
		if (!browser || !htmlString) return {};

		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, 'text/html');
		const meta_tag = doc.getElementsByTagName('meta');

		if (meta_tag.length > 0) {
			const height = meta_tag[0].getAttribute('data-height');
			const width = meta_tag[0].getAttribute('data-width');
			return {
				height: height ? parseInt(height) : undefined,
				width: width ? parseInt(width) : undefined
			};
		}
		return {};
	}

	// Function to sanitize HTML and remove non-HTML elements
	function sanitizeHtml(htmlString: string): string {
		if (!browser || !htmlString) return htmlString;

		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, 'text/html');

		// Remove any script tags
		const scripts = doc.getElementsByTagName('script');
		while (scripts.length > 0) {
			scripts[0].parentNode?.removeChild(scripts[0]);
		}

		// Remove any other potentially dangerous elements
		const iframes = doc.getElementsByTagName('iframe');
		while (iframes.length > 0) {
			iframes[0].parentNode?.removeChild(iframes[0]);
		}
		// remove all imgs
		const imgs = doc.getElementsByTagName('img');
		while (imgs.length > 0) {
			imgs[0].parentNode?.removeChild(imgs[0]);
		}
		// remove all new_image
		const new_imgs = doc.getElementsByTagName('new_image');
		while (new_imgs.length > 0) {
			new_imgs[0].parentNode?.removeChild(new_imgs[0]);
		}
		// remove all meta tags
		const meta_tag = doc.getElementsByTagName('meta');
		while (meta_tag.length > 0) {
			meta_tag[0].parentNode?.removeChild(meta_tag[0]);
		}

		// Remove event handlers from all elements
		const allElements = doc.getElementsByTagName('*');
		for (let i = 0; i < allElements.length; i++) {
			const element = allElements[i];
			const attributes = element.attributes;

			const attributesToRemove = [];

			for (let j = 0; j < attributes.length; j++) {
				const attrName = attributes[j].name;
				if (attrName.startsWith('on')) {
					attributesToRemove.push(attrName);
				}
			}
			// if text made editable
			if (element.innerHTML !== '' || element.innerHTML !== '') {
				element.setAttribute('contenteditable', 'true');
			}
			element.setAttribute('draggable', 'true');
		}

		return doc.body.innerHTML;
	}

	let htmlContainer = $state<HTMLDivElement | null>(null);

	// Computed value for the processed HTML
	let processedHtml = $derived(frameStore.html.raw ? sanitizeHtml(frameStore.html.raw) : '');

	// Effect to handle frame dimensions updates
	$effect(() => {
		if (frameStore.html.raw) {
			const dimensions = extractDimensions(frameStore.html.raw);
			if (dimensions.height !== undefined) {
				frameStore.frame.height = dimensions.height;
			}
			if (dimensions.width !== undefined) {
				frameStore.frame.width = dimensions.width;
			}
		}
	});

	// Update the processed HTML in the store whenever it changes
	$effect(() => {
		if (processedHtml) {
			frameStore.html.processed = processedHtml;
		}
	});

	// Effect to update the HTML content
	$effect(() => {
		if (htmlContainer && browser) {
			htmlContainer.innerHTML = processedHtml || 'no content';
		}
	});
</script>

{#if frameStore.html.processed}
	<div
		id={frameStore.frame.id}
		class="relative overflow-hidden border-2 border-dashed border-border"
		style="width: {frameStore.frame.width}px; height: {frameStore.frame.height}px"
	>
		<div
			bind:this={htmlContainer}
			id="html-content-container"
			class="relative"
			style="width: {frameStore.frame.width}px; height: {frameStore.frame.height}px"
		></div>

		{#if frameStore.isLoading}
			<WaveAnimation variant="loading" backdropBlur={10} animationSpeed={5} />
		{/if}
	</div>
{:else}
	<div
		class="relative flex items-center justify-center overflow-hidden border-2 border-dashed border-border"
		id={frameStore.frame.id}
		style="width: {frameStore.frame.width}px; height: {frameStore.frame.height}px"
	>
		{#if frameStore.isLoading}
			<WaveAnimation variant="loading" backdropBlur={10} animationSpeed={5} />
		{:else}
			<WaveAnimation variant="waiting" backdropBlur={10} animationSpeed={30} />
		{/if}
	</div>
{/if}
