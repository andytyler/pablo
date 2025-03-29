/**
 * Captures a screenshot of a canvas element and returns it as a base64 encoded string
 * @param canvasSelector - CSS selector for the canvas element to capture
 * @returns Promise that resolves to a base64 encoded string of the canvas image, or null if capture fails
 */
export async function captureCanvasScreenshot(canvasSelector: string): Promise<string | null> {
	try {
		// Get the canvas element
		const canvas = document.querySelector<HTMLCanvasElement>(canvasSelector);

		if (!canvas) {
			console.error('Canvas element not found with selector:', canvasSelector);
			return null;
		}

		// Convert canvas to base64 image data URL
		const dataUrl = canvas.toDataURL('image/png');

		// Extract the base64 part by removing the data URL prefix
		const base64Image = dataUrl.split(',')[1];

		return base64Image;
	} catch (error) {
		console.error('Error capturing canvas screenshot:', error);
		return null;
	}
}
