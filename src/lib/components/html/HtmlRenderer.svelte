<script lang="ts">
	// import { imageEnrichedDesignJsonToHtml } from '$lib/connections/transformers'; // No longer needed directly here
	import { browser } from '$app/environment';
	import { frameStore, persistFrameStore } from '$lib/stores/frame-store.svelte';
	import WaveAnimation from '../artboard/WaveAnimation.svelte';

	let collectedSpanFontFamilies = $state(new Set<string>());

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

	// Function to handle blur events on contenteditable elements
	function handleContentEditableBlur(event: Event) {
		console.log('Blur event triggered', event.target);
		if (htmlContainer) {
			const newHtml = htmlContainer.innerHTML;
			console.log('New HTML:', newHtml);
			// Only update if the HTML actually changed to prevent loops
			if (newHtml !== lastProcessedHtml) {
				lastProcessedHtml = newHtml;
				// Update both raw and processed HTML
				frameStore.html = {
					raw: newHtml,
					processed: newHtml
				};
				persistFrameStore(); // Persist the changes to localStorage
				console.log('Store updated and persisted');
			}
		}
	}

	// Function to sanitize HTML and remove non-HTML elements
	function sanitizeHtml(htmlString: string): { sanitizedString: string; fonts: Set<string> } {
		if (!browser || !htmlString) return { sanitizedString: htmlString, fonts: new Set() };

		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, 'text/html');
		const localFonts = new Set<string>();

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

		// remove all new_image (these are not standard HTML and should be handled by a structured data approach if needed elsewhere)
		const new_imgs = doc.getElementsByTagName('new_image');
		while (new_imgs.length > 0) {
			new_imgs[0].parentNode?.removeChild(new_imgs[0]);
		}
		// Meta tags are now preserved for extractDimensions and other potential uses.

		// Remove event handlers from all elements and handle contenteditable
		const allElements = doc.getElementsByTagName('*');
		for (let i = 0; i < allElements.length; i++) {
			const element = allElements[i];
			const attributes = element.attributes;

			const currentClasses = element.getAttribute('class') || '';
			element.setAttribute('class', `${currentClasses} canvas-item`);

			const attributesToRemove = [];

			for (let j = 0; j < attributes.length; j++) {
				const attrName = attributes[j].name;
				if (attrName.startsWith('on')) {
					attributesToRemove.push(attrName);
				}
			}
			attributesToRemove.forEach((attrName) => element.removeAttribute(attrName));

			if (element.tagName.toLowerCase() === 'span') {
				element.setAttribute('contenteditable', 'true');
				const fontFamily = element.getAttribute('data-font-family');
				if (fontFamily) {
					localFonts.add(fontFamily);
					console.log('fontFamily', fontFamily);
					// add the correct font family to the class attribute as valid tailwind
					// do not replace all the classes, just add the new one

					const currentClasses = element.getAttribute('class') || '';
					// replace font family string spaces with _
					const fontFamilyString = fontFamily.replace(/ /g, '_');
					element.setAttribute('class', `${currentClasses} font-[${fontFamilyString}]`);
				}
			} else {
				element.setAttribute('contenteditable', 'false');
			}
		}

		return { sanitizedString: doc.body.innerHTML, fonts: localFonts };
	}

	let htmlContainer = $state<HTMLDivElement | null>(null);
	let lastProcessedHtml = $state(''); // Track what we last processed to avoid loops

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

	// Effect to update the HTML content and set up event listeners
	$effect(() => {
		if (
			htmlContainer &&
			browser &&
			frameStore.html.raw &&
			frameStore.html.raw !== lastProcessedHtml
		) {
			lastProcessedHtml = frameStore.html.raw;

			const { sanitizedString, fonts } = sanitizeHtml(frameStore.html.raw);
			htmlContainer.innerHTML = sanitizedString || 'no content';

			// Update collected fonts with the new set from current HTML
			collectedSpanFontFamilies = new Set(fonts);

			// Add event listener for blur events at the container level
			htmlContainer.addEventListener('blur', handleContentEditableBlur, true);

			// Trigger image processing after HTML is set
			processImagePrompts();
		}
	});

	let googleFontsLinkForSpans = $derived.by(() => {
		if (!browser || collectedSpanFontFamilies.size === 0) {
			return '';
		}
		const fontFamilies = Array.from(collectedSpanFontFamilies)
			.map((font: string) => font.replace(/ /g, '+'))
			.join('&family=');
		if (!fontFamilies) return '';
		console.log(
			'fontFamilies',
			`https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`
		);
		return `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
	});

	async function processImagePrompts() {
		if (!htmlContainer || !browser) return;

		const imgElements = htmlContainer.querySelectorAll<HTMLImageElement>(
			'img[data-prompt]:not([data-generating="true"]):not([data-generated="true"])'
		);

		if (imgElements.length === 0) {
			return;
		}

		let htmlChanged = false;

		await Promise.all(
			Array.from(imgElements).map(async (img) => {
				const prompt = img.dataset.prompt;
				const removeBg = img.dataset.removeBg;
				if (!prompt) {
					img.removeAttribute('data-prompt'); // Invalid prompt, remove attribute
					return;
				}

				img.setAttribute('data-generating', 'true');
				const imgId = img.id || `img_gen_${Math.random().toString(36).substring(2, 10)}`;
				if (!img.id) {
					img.id = imgId;
				}

				console.log(`Generating image for prompt: "${prompt}" (ID: ${imgId})`);

				try {
					const payload = {
						image_item: {
							item: {
								description: prompt,
								id: imgId,
								remove_background: removeBg === 'true' ? true : false
							}
						}
					};

					const response = await fetch('/api/generate-design/image-pipeline', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(payload)
					});

					if (!response.ok) {
						const errorData = await response.json();
						console.error(
							`Failed to generate image for prompt "${prompt}": ${errorData.error || response.statusText}`
						);
						img.removeAttribute('data-generating');
						// Optionally set a placeholder or alt text indicating failure
						img.alt = `Failed to load image for: ${prompt}`;
						return;
					}

					const result = await response.json();

					if (result.success && result.image_url) {
						img.src = result.image_url;
						img.removeAttribute('data-prompt');
						img.setAttribute('data-generated', 'true');
						img.alt = prompt; // Set alt text from prompt
						htmlChanged = true;
						console.log(`Image generated for prompt "${prompt}": ${result.image_url}`);
					} else {
						console.error(
							`Image generation API call did not return success or URL for prompt "${prompt}"`,
							result
						);
						img.alt = `API error for: ${prompt}`;
					}
				} catch (error) {
					console.error(`Error during image generation for prompt "${prompt}":`, error);
					img.alt = `Exception during generation for: ${prompt}`;
				} finally {
					img.removeAttribute('data-generating');
				}
			})
		);

		if (htmlChanged) {
			const newHtml = htmlContainer.innerHTML;
			// Only update if the HTML actually changed to prevent loops
			if (newHtml !== lastProcessedHtml) {
				lastProcessedHtml = newHtml;
				// Update the store with the new HTML containing generated image URLs
				frameStore.html = {
					raw: newHtml,
					processed: newHtml
				};
				persistFrameStore();
				console.log('Image processing complete, store updated and persisted.');
			}
		}
	}

	// Cleanup effect
	$effect(() => {
		return () => {
			if (htmlContainer) {
				htmlContainer.removeEventListener('blur', handleContentEditableBlur, true);
			}
		};
	});
</script>

<svelte:head>
	{#if googleFontsLinkForSpans}
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
		<link href={googleFontsLinkForSpans} rel="stylesheet" />
	{/if}
</svelte:head>

{#if frameStore.html.raw}
	<div
		bind:this={htmlContainer}
		id={frameStore.frame.id}
		data-width={frameStore.frame.width}
		data-height={frameStore.frame.height}
		data-x={0}
		data-y={0}
		data-z-index={0}
		class=" border-2 border-border bg-background shadow-lg"
	>
		{#if frameStore.isLoading}
			<WaveAnimation variant="loading" backdropBlur={10} animationSpeed={5} />
		{/if}
	</div>
{:else}
	<div
		class=" overflow-hidden border-2 border-dashed border-border bg-white shadow-lg"
		id={frameStore.frame.id}
		data-width={frameStore.frame.width}
		data-height={frameStore.frame.height}
		data-x={0}
		data-y={0}
		data-z-index={0}
	>
		{#if frameStore.isLoading}
			<WaveAnimation variant="loading" backdropBlur={10} animationSpeed={5} />
		{:else}
			<WaveAnimation variant="waiting" backdropBlur={10} animationSpeed={30} />
		{/if}
	</div>
{/if}
