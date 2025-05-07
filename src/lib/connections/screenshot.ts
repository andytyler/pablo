/**
 * Captures a screenshot of a design element, uploads it to Supabase storage, and returns the public URL
 * @param designSelector - CSS selector for the design element to capture
 * @returns Promise that resolves to an object containing the image URL or error
 */
import { artboardStore } from '$lib/stores/artboard-store.svelte';
import { getImageUrl, uploadImage } from './supabase';

export async function captureCanvasScreenshot(
	designSelector: string
): Promise<{ url: string | null; error: Error | null }> {
	try {
		// Deselect any currently selected item
		if (artboardStore.selectedItemIndex !== null) {
			artboardStore.selectedItemIndex = null;
			// Wait for the DOM to update after deselection
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		// Get the design element
		const designElement = document.querySelector(designSelector);

		if (!designElement) {
			console.error('📸 [screenshot] Design element not found with selector:', designSelector);
			return {
				url: null,
				error: new Error(`Design element not found with selector: ${designSelector}`)
			};
		}

		// Add a longer delay to ensure DOM is settled and fonts are fully loaded before capture
		await new Promise((resolve) => setTimeout(resolve, 250));

		const html2canvas = (await import('html2canvas')).default;
		const designHTMLElement = designElement as HTMLElement; // Cast for convenience

		const canvas = await html2canvas(designHTMLElement, {
			backgroundColor: '#ffffff',
			scale: window.devicePixelRatio, // For better quality
			useCORS: true,
			windowWidth: designHTMLElement.scrollWidth, // Define rendering viewport width based on element's full scrollable width
			windowHeight: designHTMLElement.scrollHeight, // Define rendering viewport height based on element's full scrollable height
			logging: false,
			onclone: (doc, clonedElement) => {
				// Ensure the cloned element itself and its ancestors (up to a reasonable limit or body) are not hiding overflow
				let currentElementForOverflow = clonedElement as HTMLElement | null;
				while (currentElementForOverflow && currentElementForOverflow !== doc.body) {
					currentElementForOverflow.style.setProperty('overflow', 'visible', 'important');
					currentElementForOverflow = currentElementForOverflow.parentElement;
				}

				// Process all elements within the cloned target
				const allElementsInClone = clonedElement.querySelectorAll('*') as NodeListOf<HTMLElement>;
				allElementsInClone.forEach((htmlEl) => {
					htmlEl.style.setProperty('overflow', 'visible', 'important');
				});

				const elementsToStyle = clonedElement.querySelectorAll(
					'p, h1, h2, h3, h4, h5, h6, span, li, td, th, label, button, a, div'
				) as NodeListOf<HTMLElement>;

				elementsToStyle.forEach((htmlEl) => {
					try {
						const hasTextContent = htmlEl.innerText && htmlEl.innerText.trim().length > 0;
						const computedStyle = window.getComputedStyle(htmlEl);

						// Explicitly set font size
						htmlEl.style.fontSize = computedStyle.fontSize;

						// Explicitly set line height
						if (computedStyle.lineHeight === 'normal') {
							htmlEl.style.lineHeight = '1.4'; // A common sensible default for 'normal'
						} else {
							htmlEl.style.lineHeight = computedStyle.lineHeight;
						}

						// Handle inline elements that contain text
						if (computedStyle.display === 'inline' && hasTextContent) {
							htmlEl.style.display = 'inline-block';
							htmlEl.style.verticalAlign = 'top'; // Align to the top of the line box
						}
						// No explicit paddingBottom here, relying on overflow:visible
					} catch (e) {
						// console.warn(`Screenshot onclone style error on element ${htmlEl.tagName}: ${e}`);
					}
				});
			}
		});

		// Convert canvas to blob
		const blob = await new Promise<Blob>((resolve) => {
			canvas.toBlob((blob) => {
				resolve(blob as Blob);
			}, 'image/png');
		});

		// Create a File object with a unique name using timestamp
		const timestamp = new Date().getTime();
		const filename = `canvas_screenshot_${timestamp}.png`;
		const imageFile = new File([blob], filename, { type: 'image/png' });
		console.log('📸 [screenshot] Uploading screenshot:', filename);

		// Upload to Supabase
		const { data, error: uploadError } = await uploadImage(imageFile);

		if (uploadError) {
			console.error('📸 [screenshot] Error uploading screenshot:', uploadError);
			return { url: null, error: uploadError };
		}

		// Get the public URL
		const { url, error } = await getImageUrl(filename);

		return { url, error };
	} catch (error) {
		console.error('📸 [screenshot] Error capturing or uploading design screenshot:', error);
		return { url: null, error: error instanceof Error ? error : new Error(String(error)) };
	}
}
