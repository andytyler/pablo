import { browser } from '$app/environment';
import type { ChatMessageWithMeta } from '$lib/types';

export const frame_chat_messages = $state<{ messages: ChatMessageWithMeta[] }>(
	initMessagesFromFrameStore()
);

// Helper functions
function generateId() {
	return Math.random().toString(36).substring(2, 10);
}

export function addMessageToFrameStore(
	message_style: ChatMessageWithMeta['style'],
	content: ChatMessageWithMeta['content']
) {
	const message: ChatMessageWithMeta = {
		id: generateId(),
		style: message_style,
		timestamp: new Date(),
		content
	};
	frame_chat_messages.messages = [...frame_chat_messages.messages, message];
	persistFrameMessageStore();
	return message;
}

export function persistFrameMessageStore() {
	if (browser) {
		localStorage.setItem('frame_chat_messages', JSON.stringify(frame_chat_messages));
	}
}

export function removeMessageFromFrameStore(id: string) {
	frame_chat_messages.messages = frame_chat_messages.messages.filter(
		(message) => message.id !== id
	);
}

export function clearMessagesFromFrameStore() {
	if (browser) {
		localStorage.removeItem('frame_chat_messages');
	}
	frame_chat_messages.messages = [];
}

export function initMessagesFromFrameStore(): { messages: ChatMessageWithMeta[] } {
	// Initialize messages from localStorage if available
	if (browser) {
		const storedMessages = localStorage.getItem('frame_chat_messages');
		if (storedMessages) {
			try {
				const parsedMessages: { messages: ChatMessageWithMeta[] } = JSON.parse(storedMessages);
				// Convert string timestamps back to Date objects
				parsedMessages.messages.forEach((msg: any) => {
					if (typeof msg.timestamp === 'string') {
						msg.timestamp = new Date(msg.timestamp);
					}
				});
				return parsedMessages;
			} catch (error) {
				console.error('Failed to parse stored frame chat history:', error);
				return { messages: [] };
			}
		}
	}
	return { messages: [] };
}
