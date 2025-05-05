// place files you want to import through the `$lib` alias in this folder.

import type OpenAI from 'openai';

// Types
export type ChatMessageWithMeta = {
	id: string;
	timestamp: Date;
	style: 'user' | 'assistant' | 'system' | 'info' | 'error' | 'image'; // we filter out 'info' messages when we pass this to AI
	content: OpenAI.ChatCompletionMessageParam[];
};

// HTML rendering types
export type DesignElement = {
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
	items: DesignElement[];
};
