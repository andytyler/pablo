import { writable } from 'svelte/store';

// Define the store types
export type HtmlState = {
	content: string;
	selectedElement: HTMLElement | null;
	elementStyles: Record<string, string>;
	modified: boolean;
	isLoading: boolean;
	isWaiting: boolean;
	design_json: string | null;
	design_concept: string | null;
	chat_messages: { role: string; content: string }[];
};

// Create the initial state
const initialState: HtmlState = {
	content: '',
	selectedElement: null,
	elementStyles: {},
	// do this to store json and concept string and also use this to add a blur for the loaing state
	// also add chats histroy
	design_json: null,
	design_concept: null,
	chat_messages: [],
	isLoading: false,
	isWaiting: false,
	modified: false
};

// Create the HTML content store
// Create the writable store
export const htmlStore = writable<HtmlState>(initialState);
