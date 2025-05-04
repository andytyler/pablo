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
	design_json: string | null;
	design_json_partial: any; // Partial design JSON during streaming
	artboard_width: number;
	artboard_height: number;
	design_concept: string | null;
	chat_messages: { role: string; content: string }[];
	chatSettings: {
		skip_concept: boolean;
		stream: boolean; // Enable streaming option
	};
	uploadedImages: ImageItem[]; // Array of image URLs uploaded via PasteImage component
	allImages: ImageItem[];
	image_enriched_design_json: StructuredDesignProcessedImageItems | null;
	current_generation_id: string | null;
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
	design_json_partial: null,
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
	uploadedImages: [], // Initialize as empty array
	allImages: [], // Initialize as empty array
	image_enriched_design_json: null,
	current_generation_id: null
};

export const artboardStore = $state<ArtboardState>(initialArtboardState);

export const artboardHTMLStore = $state<{ html: string }>({ html: '' });
