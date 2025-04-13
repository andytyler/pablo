/**
 * Captures a screenshot of a design element, uploads it to Supabase storage, and returns the public URL
 * @param designSelector - CSS selector for the design element to capture
 * @returns Promise that resolves to an object containing the image URL or error
 */
import { getImageUrl, uploadImage } from './supabase';

export async function captureCanvasScreenshot(
	designSelector: string
): Promise<{ url: string | null; error: Error | null }> {
	try {
		// Get the design element
		const designElement = document.querySelector(designSelector);

		if (!designElement) {
			console.error('📸 [screenshot] Design element not found with selector:', designSelector);
			return {
				url: null,
				error: new Error(`Design element not found with selector: ${designSelector}`)
			};
		}

		// Use html2canvas to capture HTML element as an image
		// We need to dynamically import the library to avoid server-side rendering issues
		const html2canvas = (await import('html2canvas')).default;
		const canvas = await html2canvas(designElement as HTMLElement, {
			backgroundColor: '#ffffff',
			scale: 1,
			logging: false,
			useCORS: true
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
