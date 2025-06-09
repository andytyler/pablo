import { browser } from '$app/environment';
import { addMessageToFrameStore } from './frame-messages-store.svelte';

// Define image item structure
export type ImageItem = {
	id: string;
	url: string;
	description: string;
	// Additional metadata can be added as needed
};

// --- Independent State Variables ---
// Wrap primitives in objects to avoid linter confusion with .value
export const isLoading = $state({ value: false });
export const selected_element = $state<{ value: HTMLElement | null }>({ value: null });
export const design_concept = $state<{ value: string | null }>({ value: null });
export const generationError = $state<{ message: string }>({ message: '' });
// These are already objects, so they are fine as they are.
export const frame = $state({ id: 'frame-container-99485', width: 450, height: 800 });
export const chat_settings = $state({ skip_concept: true, stream: false });
export const html = $state<{ raw: string | null; processed: string | null }>({
	raw: null,
	processed: null
});
export const images = $state<{ all: ImageItem[]; uploaded: ImageItem[]; generated: ImageItem[] }>({
	all: [],
	uploaded: [],
	generated: []
});

// --- Initialization and Persistence ---
function initializeState() {
	if (!browser) return;

	try {
		const persisted = localStorage.getItem('frame_state');
		if (persisted) {
			const p = JSON.parse(persisted);
			isLoading.value = p.isLoading ?? false;
			generationError.message = p.generationError ?? '';
			design_concept.value = p.design_concept ?? null;
			frame.id = p.frame?.id ?? 'frame-container-99485';
			frame.width = p.frame?.width ?? 450;
			frame.height = p.frame?.height ?? 800;
			chat_settings.skip_concept = p.chat_settings?.skip_concept ?? true;
			chat_settings.stream = p.chat_settings?.stream ?? false;
			html.raw = p.html?.raw ?? null;
			html.processed = p.html?.processed ?? null;
			images.all = p.images?.all ?? [];
			images.uploaded = p.images?.uploaded ?? [];
			images.generated = p.images?.generated ?? [];
		}
	} catch (error) {
		console.warn('Failed to load frame state from localStorage:', error);
	}
}

export function persistFrameStore() {
	if (!browser) return;
	try {
		const stateToPersist = {
			isLoading: isLoading.value,
			generationError: generationError.message,
			design_concept: design_concept.value,
			frame,
			chat_settings,
			html,
			images
		};
		localStorage.setItem('frame_state', JSON.stringify(stateToPersist));
	} catch (error) {
		console.warn('Failed to persist frame state:', error);
	}
}

// Initialize on load
initializeState();

// --- Store-like Functions ---
export function addImageToFrameStore(type: 'uploaded' | 'generated', imageItem: ImageItem) {
	if (type === 'uploaded') {
		images.uploaded.push(imageItem);
	} else if (type === 'generated') {
		images.generated.push(imageItem);
	}
	images.all.push(imageItem);
	addMessageToFrameStore('image', [
		{
			role: 'user',
			content: [{ type: 'image_url', image_url: { url: imageItem.url, detail: 'high' } }]
		}
	]);
	addMessageToFrameStore('assistant', [
		{
			role: 'assistant',
			content: [
				{
					type: 'text',
					text: `Above is a generated image, ID: ${imageItem.id}, Image generated for prompt "${imageItem.description}", URL: ${imageItem.url}`
				}
			]
		}
	]);

	persistFrameStore();
}

export function removeImageFromFrameStore(id: string) {
	images.all = images.all.filter((img) => img.id !== id);
	images.uploaded = images.uploaded.filter((img) => img.id !== id);
	images.generated = images.generated.filter((img) => img.id !== id);
	persistFrameStore();
}

export function resetFrame() {
	isLoading.value = false;
	selected_element.value = null;
	design_concept.value = null;
	generationError.message = '';
	frame.id = 'frame-container-99485';
	frame.width = 600;
	frame.height = 600;
	html.raw = null;
	html.processed = null;
	images.all = [];
	images.uploaded = [];
	images.generated = [];
	chat_settings.skip_concept = false;
	chat_settings.stream = false;
	persistFrameStore();
}
