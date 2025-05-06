import type { StructuredDesignProcessedImageItems } from '../../routes/api/generate-design/step1/design';

// Define image item structure
export type ImageItem = {
	id: string;
	url: string;
	description: string;
	// Additional metadata can be added as needed
};

// Define the store types
export type ArtboardState = {
	streamingContent: string; // Content during streaming
	isStreaming: boolean; // Flag to indicate if streaming is active
	selectedElement: HTMLElement | null;
	elementStyles: Record<string, string>;
	modified: boolean;
	isLoading: boolean;
	isWaiting: boolean;
	artboard_width: number;
	artboard_height: number;
	design_concept: string | null;
	chat_messages: { role: string; content: string }[];
	chatSettings: {
		skip_concept: boolean;
		stream: boolean; // Enable streaming option
	};
	// Artboard view controls
	viewSettings: {
		zoom: number;
		panX: number;
		panY: number;
	};
	images: {
		all: ImageItem[];
		uploaded: ImageItem[];
		generated: ImageItem[];
	}; // Array of image URLs uploaded via PasteImage component
	uploaded_images: ImageItem[]; // Array of image URLs uploaded via PasteImage component
	all_images: ImageItem[];
	design_json: any | null;
	image_enriched_design_json: StructuredDesignProcessedImageItems | null;
	fabricCanvasObjectsArray: fabric.Object[] | null; // For storing Fabric.js canvas state
	current_generation_id: string | null;
	selectedItemIndex: number | null;
};

// Create the initial state
const initialArtboardState: ArtboardState = {
	streamingContent: '', // For showing streaming progress
	isStreaming: false,
	selectedElement: null,
	elementStyles: {},
	// do this to store json and concept string and also use this to add a blur for the loaing state
	// also add chats histroy
	design_json: null,
	design_concept: null,
	chat_messages: [],
	isLoading: false,
	artboard_width: 700,
	artboard_height: 1000,
	isWaiting: false,
	modified: false,
	chatSettings: {
		skip_concept: false,
		stream: true // Enable streaming by default
	},
	// Initialize view settings
	viewSettings: {
		zoom: 1,
		panX: 0,
		panY: 0
	},
	uploaded_images: [],
	all_images: [],
	images: {
		all: [],
		uploaded: [],
		generated: []
	},
	image_enriched_design_json: null,
	fabricCanvasObjectsArray: null,
	current_generation_id: null,
	selectedItemIndex: null
};

export const artboardStore = $state<ArtboardState>(initialArtboardState);

export const artboardHTMLStore = $state<{ html: string }>({ html: '' });

export function initArtboardStore() {
	const artboard_history = localStorage.getItem('artboard_history');
	if (artboard_history) {
		artboardStore.image_enriched_design_json = JSON.parse(artboard_history);
	}

	const artboard_dimensions = localStorage.getItem('artboard_dimensions');
	if (artboard_dimensions) {
		artboardStore.artboard_width = JSON.parse(artboard_dimensions).width;
		artboardStore.artboard_height = JSON.parse(artboard_dimensions).height;
	}

	// Load view settings if available
	const view_settings = localStorage.getItem('artboard_view_settings');
	if (view_settings) {
		artboardStore.viewSettings = JSON.parse(view_settings);
	}
}

export function addImageToStore(type: 'uploaded' | 'generated', image: ImageItem) {
	if (type === 'uploaded') {
		artboardStore.uploaded_images.push(image);
		artboardStore.all_images.push(image);
	} else if (type === 'generated') {
		artboardStore.all_images.push(image);
	}
}

// Reset artboard view to default
export function resetArtboardView() {
	artboardStore.viewSettings.zoom = 1;
	artboardStore.viewSettings.panX = 0;
	artboardStore.viewSettings.panY = 0;

	// Save to localStorage
	localStorage.setItem('artboard_view_settings', JSON.stringify(artboardStore.viewSettings));
}

// Update zoom level
export function updateZoom(newZoom: number) {
	artboardStore.viewSettings.zoom = Math.max(0.3, Math.min(newZoom, 3));

	// Save to localStorage
	localStorage.setItem('artboard_view_settings', JSON.stringify(artboardStore.viewSettings));
}

// Update pan position
export function updatePan(x: number, y: number) {
	artboardStore.viewSettings.panX = x;
	artboardStore.viewSettings.panY = y;

	// Save to localStorage
	localStorage.setItem('artboard_view_settings', JSON.stringify(artboardStore.viewSettings));
}
