import { browser } from '$app/environment';
import type { ChatMessageWithMeta } from '$lib/types';

export const chat_history = $state<{ messages: ChatMessageWithMeta[] }>({ messages: [] });

// Helper functions
function generateId() {
	return Math.random().toString(36).substring(2, 10);
}

export function addMessage(
	chat_role: ChatMessageWithMeta['style'],
	content: ChatMessageWithMeta['content']
) {
	const message: ChatMessageWithMeta = {
		id: generateId(),
		style: chat_role,
		timestamp: new Date(),
		content
	};
	chat_history.messages = [...chat_history.messages, message];
	return message;
}
export function removeMessage(id: string) {
	chat_history.messages = chat_history.messages.filter((message) => message.id !== id);
}

export function clearMessages() {
	if (browser) {
		localStorage.removeItem('chat_history');
	}
	chat_history.messages = [];
}

export function initMessages() {
	// Initialize messages from localStorage if available
	if (browser) {
		const storedMessages = localStorage.getItem('chat_history');
		if (storedMessages) {
			try {
				const parsedMessages: { messages: ChatMessageWithMeta[] } = JSON.parse(storedMessages);
				// Convert string timestamps back to Date objects
				parsedMessages.messages.forEach((msg: any) => {
					if (typeof msg.timestamp === 'string') {
						msg.timestamp = new Date(msg.timestamp);
					}
				});
				chat_history.messages = parsedMessages.messages;
			} catch (error) {
				console.error('Failed to parse stored chat history:', error);
			}
		}
	}
}
