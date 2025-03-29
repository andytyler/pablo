import { get, writable } from 'svelte/store';

type Message = {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
};

type UseChatOptions = {
	api: string;
	initialMessages?: Message[];
	initialInput?: string;
	onError?: (error: Error) => void;
};

export function useChat({ api, initialMessages = [], initialInput = '', onError }: UseChatOptions) {
	// Create writable stores for state
	const messages = writable<Message[]>(initialMessages);
	const input = writable(initialInput);
	const isLoading = writable(false);
	const error = writable<string | null>(null);

	// Generate a unique ID for messages
	const generateId = () => Math.random().toString(36).substring(2, 10);

	// Function to add a user message to the conversation
	function addUserMessage(content: string) {
		messages.update((msgs) => [...msgs, { id: generateId(), role: 'user', content }]);
	}

	// Function to add an assistant message to the conversation
	function addAssistantMessage(content: string) {
		messages.update((msgs) => [...msgs, { id: generateId(), role: 'assistant', content }]);
	}

	// Function to handle form submission and API call
	async function handleSubmit(
		formData: FormData,
		options?: { prompt?: string; imageBase64?: string | null }
	) {
		const userPrompt = options?.prompt || get(input);
		if (!userPrompt) return;

		error.set(null);
		isLoading.set(true);

		// Add user message to the conversation
		addUserMessage(userPrompt);

		try {
			// Prepare the messages to send (without IDs)
			let messagesList: { role: string; content: string }[] = [];
			const currentMessages = get(messages);
			messagesList = currentMessages.map((msg) => ({ role: msg.role, content: msg.content }));

			// Make the API call
			const response = await fetch(api, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					prompt: userPrompt,
					imageBase64: options?.imageBase64 || null,
					messages: messagesList.slice(0, -1) // Exclude the latest user message
				})
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Parse the JSON response
			const data = await response.json();

			if (data.error) {
				throw new Error(data.error);
			}

			// Add the assistant's response to the conversation
			addAssistantMessage(data.message);

			// Clear the input
			input.set('');
		} catch (e) {
			const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
			error.set(errorMessage);
			if (onError) onError(e instanceof Error ? e : new Error(errorMessage));
		} finally {
			isLoading.set(false);
		}
	}

	return {
		messages,
		input,
		handleSubmit,
		isLoading,
		error
	};
}
