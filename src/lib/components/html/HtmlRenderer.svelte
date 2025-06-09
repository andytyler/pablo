<script lang="ts">
	// import { imageEnrichedDesignJsonToHtml } from '$lib/connections/transformers'; // No longer needed directly here
	import { browser } from '$app/environment';
	import {
		addImageToFrameStore,
		frame,
		html as frameHtml,
		isLoading,
		persistFrameStore,
		selected_element
	} from '$lib/stores/frame-store.svelte';
	import WaveAnimation from './canvas-board/WaveAnimation.svelte';

	let collectedFontStyles = $state(new Map<string, Set<string>>());

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
				frameHtml.raw = newHtml;
				frameHtml.processed = newHtml;

				persistFrameStore(); // Persist the changes to localStorage
				console.log('Store updated and persisted');
			}
		}
	}

	// Function to sanitize HTML and remove non-HTML elements
	function sanitizeHtml(htmlString: string): {
		sanitizedString: string;
		fonts: Map<string, Set<string>>;
	} {
		if (!browser || !htmlString) return { sanitizedString: htmlString, fonts: new Map() };

		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, 'text/html');
		const localFontStyles = new Map<string, Set<string>>();

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
			const element = allElements[i] as HTMLElement; // Cast to HTMLElement for style property
			const attributes = element.attributes;

			const currentClasses = element.getAttribute('class') || '';
			element.setAttribute('class', `${currentClasses} canvas-item`);

			// Apply positioning and dimension styles from data attributes
			const x = element.dataset.x;
			const y = element.dataset.y;
			const width = element.dataset.width;
			const height = element.dataset.height;
			const zIndex = element.dataset.zIndex;
			const rotation = element.dataset.rotation;

			let styleString = element.getAttribute('style') || '';

			if (x !== undefined) styleString += `position: absolute; left: ${x}px; `;
			if (y !== undefined) styleString += `top: ${y}px; `;
			if (width !== undefined) styleString += `width: ${width}px; `;
			if (height !== undefined) styleString += `height: ${height}px; `;
			if (zIndex !== undefined) styleString += `z-index: ${zIndex}; `;
			if (rotation !== undefined) styleString += `transform: rotate(${rotation}deg); `;

			const dataFontFamilyFromDataset = element.dataset.fontFamily;
			if (dataFontFamilyFromDataset) {
				const fontFamilyNameToApply = dataFontFamilyFromDataset.replace(/_/g, ' ');
				if (styleString && !styleString.trim().endsWith(';') && styleString.trim() !== '') {
					styleString += '; ';
				}
				styleString += `font-family: "${fontFamilyNameToApply}", sans-serif; `;
			}

			// Attempt to parse font-size from Tailwind-like classes (e.g., text-[48px])
			const fontSizeClass = Array.from(element.classList).find((cls) => /^text-\[.*\]$/.test(cls));
			if (fontSizeClass) {
				const match = fontSizeClass.match(/^text-\[(.*)\]$/);
				if (match && match[1]) {
					const fontSizeValue = match[1];
					if (styleString && !styleString.trim().endsWith(';') && styleString.trim() !== '') {
						styleString += '; ';
					}
					styleString += `font-size: ${fontSizeValue}; `;
				}
			}

			if (styleString) {
				element.setAttribute('style', styleString.trim());
			}

			const attributesToRemove = [];

			for (let j = 0; j < attributes.length; j++) {
				const attrName = attributes[j].name;
				if (attrName.startsWith('on')) {
					attributesToRemove.push(attrName);
				}
			}
			attributesToRemove.forEach((attrName) => element.removeAttribute(attrName));

			if (element.getAttribute('data-font-family')) {
				element.setAttribute('contenteditable', 'true');
				const fontFamily = element.getAttribute('data-font-family');
				if (fontFamily) {
					if (!localFontStyles.has(fontFamily)) {
						localFontStyles.set(fontFamily, new Set<string>());
					}
					const weights = localFontStyles.get(fontFamily)!;
					weights.add('400'); // Add 400 as a default weight

					// Tailwind font weight classes mapping
					const tailwindWeightMap: Record<string, string> = {
						'font-thin': '100',
						'font-extralight': '200',
						'font-light': '300',
						'font-normal': '400',
						'font-medium': '500',
						'font-semibold': '600',
						'font-bold': '700',
						'font-extrabold': '800',
						'font-black': '900'
					};

					element.classList.forEach((cls) => {
						if (tailwindWeightMap[cls]) {
							weights.add(tailwindWeightMap[cls]);
						}
					});

					// Add font family to class for Tailwind JIT
					const currentElementClasses = element.getAttribute('class') || '';
					const fontFamilyClass = fontFamily.replace(/ /g, '_');
					if (!currentElementClasses.includes(`font-[${fontFamilyClass}]`)) {
						element.setAttribute('class', `${currentElementClasses} font-[${fontFamilyClass}]`);
					}
					console.log('fontFamily', fontFamily, 'weights', Array.from(weights));
				}
			} else {
				element.setAttribute('contenteditable', 'false');
			}
		}

		return { sanitizedString: doc.body.innerHTML, fonts: localFontStyles };
	}

	let htmlContainer = $state<HTMLDivElement | null>(null);
	let lastProcessedHtml = $state(''); // Track what we last processed to avoid loops

	// Effect to handle frame dimensions updates
	$effect(() => {
		if (frameHtml.raw) {
			const dimensions = extractDimensions(frameHtml.raw);
			if (dimensions.height !== undefined) {
				frame.height = dimensions.height;
			}
			if (dimensions.width !== undefined) {
				frame.width = dimensions.width;
			}
		}
	});

	// Effect to update the HTML content and set up event listeners
	$effect(() => {
		if (htmlContainer && browser && frameHtml.raw && frameHtml.raw !== lastProcessedHtml) {
			lastProcessedHtml = frameHtml.raw;

			const { sanitizedString, fonts } = sanitizeHtml(frameHtml.raw);
			htmlContainer.innerHTML = sanitizedString || 'no content';

			// Update collected fonts with the new set from current HTML
			collectedFontStyles = new Map(fonts);

			// Add event listener for blur events at the container level
			htmlContainer.addEventListener('blur', handleContentEditableBlur, true);

			// Trigger image processing after HTML is set
			processImagePrompts();
		}
	});

	let googleFontsLinkForSpans = $derived.by(() => {
		if (!browser || collectedFontStyles.size === 0) {
			return '';
		}
		const familyParams: string[] = [];
		for (const [family, weights] of collectedFontStyles) {
			const familyName = family.replace(/ /g, '+');
			if (weights.size > 0) {
				const sortedWeights = Array.from(weights)
					.map((w) => parseInt(w, 10))
					.sort((a, b) => a - b);
				familyParams.push(`${familyName}:wght@${sortedWeights.join(';')}`);
			} else {
				// Fallback: if no weights collected (should not happen due to default '400'),
				// just request the family. Google Fonts defaults to 400.
				familyParams.push(familyName);
			}
		}

		if (familyParams.length === 0) return '';
		const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${familyParams.join('&family=')}&display=swap`;
		console.log('fontFamilies URL', googleFontsUrl);
		return googleFontsUrl;
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
				if (img.dataset.generated === 'true') {
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
						//add image to the image store
						addImageToFrameStore('generated', {
							id: imgId,
							url: result.image_url,
							description: prompt
						});
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
				frameHtml.raw = newHtml;
				frameHtml.processed = newHtml;
				persistFrameStore();
				console.log('Image processing complete, store updated and persisted.');
			}
		}
	}

	function handleSelectionChange() {
		if (!browser) return;
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			let node: Node | null = selection.getRangeAt(0).startContainer;
			// Traverse up to find the parent element that is a direct child of the container
			while (node && node.parentElement !== htmlContainer) {
				node = node.parentElement;
			}
			if (node && node instanceof HTMLElement) {
				selected_element.value = node;
				console.log('Selected element:', selected_element.value);
			}
		} else {
			selected_element.value = null;
		}
	}

	// Cleanup effect
	$effect(() => {
		if (browser) {
			document.addEventListener('selectionchange', handleSelectionChange);
		}
		return () => {
			if (htmlContainer) {
				htmlContainer.removeEventListener('blur', handleContentEditableBlur, true);
			}
			if (browser) {
				document.removeEventListener('selectionchange', handleSelectionChange);
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

{#if frameHtml.raw}
	<div
		bind:this={htmlContainer}
		id={frame.id}
		style="width: {frame.width}px; height: {frame.height}px;"
		class={`border-2 border-border bg-background shadow-lg ${isLoading.value ? 'relative overflow-hidden' : ''} ${isLoading.value ? 'z-[101]' : 'z-0'}`}
	>
		{#if isLoading.value}
			<WaveAnimation variant="loading" backdropBlur={10} animationSpeed={5} />
		{/if}
	</div>
{:else}
	<div
		id={frame.id}
		style="width: {frame.width}px; height: {frame.height}px;"
		class="relative overflow-hidden rounded-sm border-2 border-border bg-background shadow-lg"
	>
		{#if isLoading.value}
			<WaveAnimation variant="loading" backdropBlur={10} animationSpeed={5} />
		{:else}
			<WaveAnimation variant="waiting" backdropBlur={10} animationSpeed={30} />
		{/if}
	</div>
{/if}
