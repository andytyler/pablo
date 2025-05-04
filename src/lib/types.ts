// place files you want to import through the `$lib` alias in this folder.

import type OpenAI from 'openai';

// Types
export type Message = {
	id: string;
	chat_role: 'user' | 'assistant' | 'system' | 'info' | 'error' | 'image'; // we filter out 'info' messages when we pass this to AI
	timestamp: Date;
	content: OpenAI.ChatCompletionContentPart[];
};

// HTML rendering types
export type DesignItem = {
	id: string;
	item: any;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation: number;
	zIndex: number;
	opacity: number;
};

export type Design = {
	concept?: string;
	background: string;
	artboard: {
		width: number;
		height: number;
	};
	items: DesignItem[];
};
