/**
 * Captures a screenshot of a design element and returns it as a base64 encoded string
 * @param designSelector - CSS selector for the design element to capture
 * @returns Promise that resolves to a base64 encoded string of the image, or null if capture fails
 */
export async function captureCanvasScreenshot(designSelector: string): Promise<string | null> {
	try {
		// Get the design element
		const designElement = document.querySelector(designSelector);

		if (!designElement) {
			console.error('Design element not found with selector:', designSelector);
			return null;
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

		// Convert to base64 image data URL
		const dataUrl = canvas.toDataURL('image/png');

		// Extract the base64 part by removing the data URL prefix
		const base64Image = dataUrl.split(',')[1];

		return base64Image;
	} catch (error) {
		console.error('Error capturing design screenshot:', error);
		return null;
	}
}
