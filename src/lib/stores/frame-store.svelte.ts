import { browser } from '$app/environment';

// Define image item structure
export type ImageItem = {
	id: string;
	url: string;
	description: string;
	// Additional metadata can be added as needed
};

// Define the store types
export type FrameState = {
	isLoading: boolean;
	selected_element: HTMLElement | null;
	design_concept: string | null;
	frame: {
		id: string;
		width: number;
		height: number;
	};
	chat_settings: {
		skip_concept: boolean;
		stream: boolean; // Enable streaming option
	};
	html: {
		raw: string | null;
		processed: string | null;
	};
	images: {
		all: ImageItem[];
		uploaded: ImageItem[];
		generated: ImageItem[];
	};
};

const defaultFrameState: FrameState = {
	isLoading: false,
	selected_element: null,
	design_concept: null,
	frame: { id: 'frame-container-99485', width: 450, height: 800 },
	chat_settings: {
		skip_concept: true,
		stream: false
	},
	html: {
		raw: null,
		processed: null
	},
	images: {
		all: [],
		uploaded: [],
		generated: []
	}
};

// Initialize frame store with persisted state or defaults
function getInitialState(): FrameState {
	try {
		if (browser) {
			const persisted = localStorage.getItem('frame_state');
			if (persisted) {
				const parsed = JSON.parse(persisted);
				// Validate the parsed data has the correct shape
				return {
					...defaultFrameState, // Ensure all fields exist by spreading defaults first
					...parsed // Override with any valid persisted values
				};
			}
		}
	} catch (error) {
		console.warn('Failed to load frame state from localStorage:', error);
	}
	return defaultFrameState;
}

export const frameStore = $state<FrameState>(getInitialState());

// Helper to persist state changes
export function persistFrameStore() {
	try {
		localStorage.setItem('frame_state', JSON.stringify(frameStore));
	} catch (error) {
		console.warn('Failed to persist frame state:', error);
	}
}

export function addImageToFrameStore(type: 'uploaded' | 'generated', image: ImageItem) {
	if (type === 'uploaded') {
		frameStore.images.uploaded.push(image);
		frameStore.images.all.push(image);
	} else if (type === 'generated') {
		frameStore.images.generated.push(image);
		frameStore.images.all.push(image);
	}
	persistFrameStore(); // Persist after modifications
}

export function removeImageFromFrameStore(id: string) {
	frameStore.images.all = frameStore.images.all.filter((image) => image.id !== id);
	frameStore.images.uploaded = frameStore.images.uploaded.filter((image) => image.id !== id);
	frameStore.images.generated = frameStore.images.generated.filter((image) => image.id !== id);
	persistFrameStore(); // Persist after modifications
}

export function resetFrame() {
	frameStore.frame.id = 'frame-container-99485';
	frameStore.frame.width = 600;
	frameStore.frame.height = 600;
	frameStore.html.processed = null;
	frameStore.html.raw = null;
	frameStore.design_concept = null;
	frameStore.images.all = [];
	frameStore.images.uploaded = [];
	frameStore.images.generated = [];
	frameStore.isLoading = false;
	frameStore.selected_element = null;
	frameStore.chat_settings.skip_concept = false;
	frameStore.chat_settings.stream = false;

	persistFrameStore(); // Persist after modifications
}
