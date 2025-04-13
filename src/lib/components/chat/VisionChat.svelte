<script lang="ts">
	import { browser } from '$app/environment';
	import * as ScrollArea from '$lib/components/ui/scroll-area';
	import { captureCanvasScreenshot } from '$lib/connections/screenshot';
	import { htmlStore } from '$lib/stores/htmlStore';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import InfoIcon from '@lucide/svelte/icons/info';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Paintbrush from '@lucide/svelte/icons/paintbrush';
	import { onMount } from 'svelte';
	import { Button } from '../ui/button';
	import { Textarea } from '../ui/textarea';
	// Props using Svelte 5 syntax
	let {
		canvasSelector = '#design-canvas',
		placeholder = 'Ask something about your design...',
		canvasWidth = 500,
		canvasHeight = 700
	} = $props();

	// Types
	type Message = {
		id: string;
		role: 'user' | 'assistant' | 'system';
		content: string | any;
		timestamp: Date;
	};

	// State using Svelte 5 runes
	let messages = $state<Message[]>([]);
	let prompt = $state('');
	let isCapturingImage = $state(false);
	let isGeneratingHTML = $state(false);
	let generationError = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Scroll to bottom whenever messages change or component mounts
	function scrollToBottom() {
		// Find the viewport element (first child of the scrollArea)
		const viewport = document.getElementById('scroll-area')?.getElementsByTagName('div')[0];
		if (viewport) {
			setTimeout(() => {
				viewport.scrollTop = viewport.scrollHeight;
			}, 10);
		}
	}

	$effect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	});

	onMount(() => {
		scrollToBottom();
	});

	// Initialize from localStorage
	$effect(() => {
		if (browser) {
			const storedMessages = localStorage.getItem('chat_history');
			if (storedMessages) {
				try {
					const parsedMessages = JSON.parse(storedMessages);
					// Convert string timestamps back to Date objects
					parsedMessages.forEach((msg: any) => {
						if (typeof msg.timestamp === 'string') {
							msg.timestamp = new Date(msg.timestamp);
						}
					});
					messages = parsedMessages;
				} catch (error) {
					console.error('Failed to parse stored chat history:', error);
				}
			}
		}
	});

	// Save to localStorage whenever messages change
	$effect(() => {
		if (browser) {
			localStorage.setItem('chat_history', JSON.stringify(messages));
		}
	});

	// Helper functions
	function generateId() {
		return Math.random().toString(36).substring(2, 10);
	}

	function addMessage(role: Message['role'], content: string | any) {
		const message: Message = {
			id: generateId(),
			role,
			content,
			timestamp: new Date()
		};
		messages = [...messages, message];
		return message;
	}

	function clearMessages() {
		if (browser) {
			localStorage.removeItem('chat_history');
		}
		messages = [];
	}

	// Function to generate HTML from text prompt
	async function generateDesign() {
		if (!prompt.trim()) {
			console.error('No prompt provided');
			return;
		}

		isGeneratingHTML = true;
		generationError = '';

		try {
			// Capture the current design state as a screenshot
			const { url, error } = await captureCanvasScreenshot(canvasSelector);

			if (error) {
				throw new Error(error.message);
			}

			addMessage('user', `${prompt}`);
			// Add a system message for logging the HTML generation request
			addMessage('system', 'Generating design...');

			// Call the HTML generation API with the prompt, current HTML and screenshot
			const response = await fetch('/api/generate-design', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					prompt: prompt.trim(),
					image_url: url,
					design_json: $htmlStore.design_json,
					current_html: $htmlStore.content,
					artboard_size: `width: ${canvasWidth}px, height: ${canvasHeight}px`
				})
			});
			// Clear the prompt
			prompt = '';

			const data = await response.json();
			console.log('[generate-html] 🈂️ 4 RAW HTML Response from API:', data);

			if (!response.ok || data.error) {
				throw new Error(data.error || 'Failed to generate HTML');
			}

			// Update the HTML store directly
			if (data && data.html) {
				addMessage('assistant', data.design_concept);
				console.log('[VisionChat] Current HTML store content:', $htmlStore.content);
				console.log('[VisionChat] New HTML content to set:', data.html);
				$htmlStore.content = data.html;
				$htmlStore.design_concept = data.design_concept;
				$htmlStore.design_json = data.design_json_processed;
				console.log('[VisionChat] Updated HTML store content:', $htmlStore.content);
			} else {
				throw new Error('Generated HTML response is missing or invalid');
			}
		} catch (e) {
			console.error('Error generating HTML:', e);
			generationError = e instanceof Error ? e.message : 'Failed to generate HTML';
			addMessage('system', `HTML generation failed: ${generationError}`);
		} finally {
			isGeneratingHTML = false;
		}
	}
</script>

<div class="relative h-full overflow-hidden bg-white">
	<div class="relative flex h-[calc(100vh-300px)] flex-col">
		<!-- Messages area with ScrollArea -->
		<ScrollArea.Root class="flex-1 px-2" id="scroll-area">
			{#each messages as message (message.id)}
				{#if message.role === 'system'}
					<!-- System message style -->
					<div class="flex flex-col items-center">
						<div class="max-w-[85%] rounded-lg bg-gray-100 p-1 text-center dark:bg-gray-600">
							<div class="flex items-center justify-center gap-1">
								<InfoIcon class="h-4 w-4" />
								<span class="text-xs">
									{typeof message.content === 'string'
										? message.content
										: JSON.stringify(message.content)}
								</span>
							</div>
						</div>
						<div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
							<span>System</span>
							<span>•</span>
							<span>{message.timestamp.toLocaleString()}</span>
						</div>
					</div>
				{:else}
					<!-- User or Assistant message style -->
					<div class="flex flex-col {message.role === 'user' ? 'items-end' : 'items-start'}">
						<div
							class="max-w-[85%] rounded-lg p-3 {message.role === 'user'
								? 'bg-primary text-primary-foreground'
								: 'bg-muted'}"
						>
							{typeof message.content === 'string'
								? message.content
								: JSON.stringify(message.content)}
						</div>
						<div
							class="mt-1 flex items-center gap-2 text-xs text-muted-foreground {message.role ===
							'user'
								? 'justify-end'
								: ''}"
						>
							<span>{message.role === 'user' ? 'You' : 'AI Assistant'}</span>
							<span>•</span>
							<span>{message.timestamp.toLocaleString()}</span>
						</div>
					</div>
				{/if}
			{/each}

			{#if isLoading || isCapturingImage || isGeneratingHTML}
				<div class="flex justify-center py-4">
					<Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			{/if}

			{#if error || generationError}
				<div class="rounded-md bg-destructive/10 p-3 text-destructive">
					<div class="flex items-center gap-2">
						<AlertTriangle class="h-4 w-4" />
						<span>Error: {error || generationError}</span>
					</div>
				</div>
			{/if}
			<ScrollArea.Scrollbar orientation="vertical" />
		</ScrollArea.Root>
	</div>

	<!-- Input area - fixed at bottom of container -->
	<div class="m-4h-full relative bottom-0 left-0 right-0 flex-1 px-4">
		<form
			onsubmit={(e) => {
				generateDesign();
				if ((e as any).metaKey || (e as any).ctrlKey) {
				}
			}}
			class="flex flex-col gap-4"
		>
			<Textarea
				bind:value={prompt}
				{placeholder}
				class="resize-vertical h-32 min-h-24  rounded border-2 border-border bg-background p-1 text-sm focus:border-background focus:outline-none focus:ring-2 focus:ring-primary"
				disabled={isLoading || isCapturingImage || isGeneratingHTML}
			/>
			<Button
				type="submit"
				class="absolute bottom-6 right-6 ml-auto flex gap-2 p-1 px-2"
				size="xs"
				variant="default"
				disabled={isLoading || isCapturingImage || isGeneratingHTML || !prompt.trim()}
			>
				{#if isGeneratingHTML}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Creating...
				{:else}
					<Paintbrush class="mr-2 h-4 w-4" />
					Generate Design
				{/if}
			</Button>
		</form>
	</div>
</div>
