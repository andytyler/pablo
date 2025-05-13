<script lang="ts">
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import * as ScrollArea from '$lib/components/ui/scroll-area';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { captureCanvasScreenshot } from '$lib/connections/screenshot';
	import {
		addMessageToFrameStore,
		clearMessagesFromFrameStore,
		frame_chat_messages
	} from '$lib/stores/frame-messages-store.svelte';
	import { frameStore, persistFrameStore } from '$lib/stores/frame-store.svelte';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import Ban from '@lucide/svelte/icons/ban';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { Send } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import ChatMessage from '../common/ChatMessage.svelte';

	// State using Svelte 5 runes
	let user_input = $state('');
	let prompt = $state('');
	let isCapturingImage = $state(false);
	let isGeneratingHTML = $state(false);
	let generationError = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Scroll to bottom whenever messages change or component mounts
	function scrollToBottom() {
		// Find the viewport element (first child of the scrollArea)
		const viewport = document.getElementById('chat-scroll-area')?.getElementsByTagName('div')[0];
		if (viewport) {
			setTimeout(() => {
				viewport.scrollTop = viewport.scrollHeight;
			}, 10);
		}
	}

	onMount(() => {
		scrollToBottom();

		// Load chat settings from localStorage if available
		if (browser) {
			const promptTextarea = document.getElementById('prompt-textarea');
			if (promptTextarea) {
				promptTextarea.focus();
				promptTextarea.addEventListener('keydown', function (e) {
					if (!(e.key === 'Enter' && (e.metaKey || e.ctrlKey))) return;

					if (e.target && 'form' in e.target) {
						const formElement = e.target.form as HTMLFormElement;
						formElement?.submit();
					}
				});
			}
		}
	});

	$effect(() => {
		if (frame_chat_messages.messages.length > 0) {
			scrollToBottom();
		}
	});

	// Save to localStorage whenever messages change
	$effect(() => {
		if (browser) {
			persistFrameStore();
		}
	});

	// // Function to generate design using the two-step approach with separate endpoints
	// async function executeDesignPipeline() {
	// 	if (!user_input.trim()) {
	// 		console.error('No prompt provided');
	// 		addMessageToFrameStore('user', [
	// 			{
	// 				role: 'user',
	// 				content: [{ type: 'text', text: 'No prompt provided' }]
	// 			}
	// 		]);
	// 		return;
	// 	}

	// 	try {
	// 		// Capture the current design state as a screenshot
	// 		const { url: canvasScreenshotUrl, error } = await captureCanvasScreenshot(CANVAS_SELECTOR);

	// 		if (error || !canvasScreenshotUrl) {
	// 			throw new Error(error?.message || 'Failed to capture canvas screenshot');
	// 		}

	// 		addMessageToFrameStore('image', [
	// 			{
	// 				role: 'user',
	// 				content: [{ type: 'image_url', image_url: { url: canvasScreenshotUrl, detail: 'high' } }]
	// 			}
	// 		]);

	// 		addMessageToFrameStore('user', [
	// 			{ role: 'user', content: [{ type: 'text', text: user_input }] }
	// 		]);

	// 		// Set initial loading state
	// 		frameStore.isLoading = true;
	// 		user_input = '';
	// 		// Step 1: Get design JSON with image placeholders
	// 		addMessageToFrameStore('info', [
	// 			{
	// 				role: 'assistant',
	// 				content: [{ type: 'text', text: 'Step 1: Generating design structure...' }]
	// 			}
	// 		]);

	// 		const designResponse = await fetch('/api/generate-design/step1', {
	// 			method: 'POST',
	// 			headers: {
	// 				'Content-Type': 'application/json'
	// 			},
	// 			body: JSON.stringify({
	// 				prompt: user_input.trim(),
	// 				previous_design_html:
	// 					typeof frameStore.html.processed === 'string'
	// 						? frameStore.html.processed
	// 						: JSON.stringify(frameStore.html.processed || '{}'),
	// 				artboard_size: `width: ${frameStore.frame.width}px, height: ${frameStore.frame.height}px`,
	// 				skip_concept: frameStore.chat_settings.skip_concept,
	// 				chat_history_messages: frame_chat_messages.messages
	// 			})
	// 		});

	// 		if (!designResponse.ok) {
	// 			const errorData = await designResponse.json();
	// 			console.error('Failed to generate design structure:', errorData);
	// 			throw new Error(errorData.error || 'Failed to generate design structure');
	// 		}

	// 		let step_one_response: {
	// 			design_html: string;
	// 			design_generation_id: string;
	// 			step_one_concept: string;
	// 		} = await designResponse.json();
	// 		console.log('step1Response', step_one_response);

	// 		// Add defensive checking for required properties
	// 		if (!step_one_response || !step_one_response.design_html) {
	// 			throw new Error('Invalid response structure: design_html is missing');
	// 		}

	// 		frameStore.html.processed = step_one_response.design_html;

	// 		if (step_one_response.step_one_concept) {
	// 			addMessageToFrameStore('assistant', [
	// 				{
	// 					role: 'assistant',
	// 					content: [{ type: 'text', text: step_one_response.step_one_concept }]
	// 				}
	// 			]);
	// 		}

	// 		addMessageToFrameStore('info', [
	// 			{
	// 				role: 'user',
	// 				content: [{ type: 'text', text: 'Design structure created. Generating images...' }]
	// 			}
	// 		]);

	// 		// Clear the prompt and complete
	// 		frameStore.isLoading = false;
	// 		addMessageToFrameStore('info', [
	// 			{ role: 'assistant', content: [{ type: 'text', text: 'Design created successfully!' }] }
	// 		]);
	// 	} catch (e) {
	// 		console.error('Error generating design:', e);
	// 		generationError = e instanceof Error ? e.message : 'Failed to generate design';
	// 		addMessageToFrameStore('error', [
	// 			{
	// 				role: 'user',
	// 				content: [{ type: 'text', text: `Design generation failed: ${generationError}` }]
	// 			}
	// 		]);
	// 		frameStore.isLoading = false;
	// 	} finally {
	// 		isGeneratingHTML = false;
	// 	}
	// }

	async function handleSubmit() {
		if (!user_input.trim()) {
			console.error('No prompt provided');
			return;
		}
		frameStore.isLoading = true;
		prompt = user_input;

		// Capture the current design state as a screenshot
		const { url: canvasScreenshotUrl, error } = await captureCanvasScreenshot(
			`#${frameStore.frame.id}`
		);

		if (error || !canvasScreenshotUrl) {
			throw new Error(error?.message || 'Failed to capture canvas screenshot');
		}

		addMessageToFrameStore('image', [
			{
				role: 'user',
				content: [{ type: 'image_url', image_url: { url: canvasScreenshotUrl, detail: 'high' } }]
			}
		]);
		addMessageToFrameStore('user', [
			{ role: 'user', content: [{ type: 'text', text: user_input }] }
		]);
		user_input = '';
		try {
			const response = await fetch('/api/generate-design/html-design', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					prompt,
					previous_design_html: frameStore.html.raw || '',
					artboard_size: `${frameStore.frame.width}x${frameStore.frame.height}`,
					chat_history_messages: frame_chat_messages.messages,
					skip_concept: frameStore.chat_settings.skip_concept
				})
			});

			if (!response.ok) {
				throw new Error('Failed to generate design');
			}

			const data = await response.json();
			console.log('🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷');
			console.log(data);
			console.log('🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷');

			// Update the frame store with the new design
			frameStore.design_concept = data.design_concept;
			frameStore.html.raw = data.design_html;

			// Add messages to chat history
			addMessageToFrameStore('assistant', [
				{ role: 'assistant', content: [{ type: 'text', text: data.design_concept }] }
			]);
		} catch (error) {
			console.error('Error generating design:', error);
			// Handle error appropriately
			frameStore.isLoading = false;
		} finally {
			frameStore.isLoading = false;
		}
	}
</script>

<div class="relative flex h-full flex-col overflow-hidden bg-[#131620]">
	<!-- Header -->
	<div class="flex items-center px-6 py-3">
		<div class="flex items-center gap-2.5">
			<div class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#3b82f6]"></div>
			<h3 class="text-base font-medium text-white/90">AI Design Assistant</h3>
		</div>
	</div>

	<!-- Messages area with ScrollArea -->
	<ScrollArea.Root class="relative flex-1 px-4" id="chat-scroll-area">
		<div class="space-y-4 pb-4">
			{#if frame_chat_messages.messages.length === 0}
				<div class="flex h-[300px] flex-col items-center justify-center py-8 text-center">
					<div class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#1e293b]">
						<Send class="h-6 w-6 rotate-[15deg] text-[#3b82f6]" />
					</div>
					<p class="text-xl font-medium text-white/90">Let's create something amazing</p>
					<p class="mt-2 text-base text-white/60">Describe your design and I'll bring it to life</p>
				</div>
			{:else}
				{#each frame_chat_messages.messages.flat() as message (message.id)}
					<ChatMessage {message} />
				{/each}
			{/if}

			{#if isLoading || isCapturingImage || isGeneratingHTML}
				<div class="flex justify-center py-6">
					<div class="flex flex-col items-center gap-3">
						<div class="relative">
							<div
								class="h-10 w-10 animate-spin rounded-full border-2 border-[#3b82f6]/30 border-t-[#3b82f6]"
							></div>
							<div class="absolute inset-0 flex items-center justify-center">
								<div class="h-5 w-5 rounded-full bg-[#131620]"></div>
							</div>
						</div>
						<span class="text-sm text-white/60">Generating your design...</span>
					</div>
				</div>
			{/if}

			{#if error || generationError}
				<div
					class="mx-auto max-w-[90%] rounded-md border border-red-500/20 bg-red-500/10 p-4 text-red-400"
				>
					<div class="flex items-center gap-2">
						<AlertTriangle class="h-5 w-5 flex-shrink-0" />
						<span>Error: {error || generationError}</span>
					</div>
				</div>
			{/if}
		</div>
		<ScrollArea.Scrollbar orientation="vertical" />
	</ScrollArea.Root>

	<!-- Input area - fixed at bottom of container -->
	<div class="px-4 pb-4 pt-2">
		<form onsubmit={handleSubmit} class="space-y-3">
			<div class="relative">
				<Textarea
					id="prompt-textarea"
					class="max-h-40 min-h-24 w-full resize-y overflow-y-auto rounded-xl border-[#2a3042] bg-[#171c2c] p-4 pr-14 text-base text-white/90 placeholder:text-white/40 focus-visible:border-[#3b82f6]/50 focus-visible:ring-1 focus-visible:ring-[#3b82f6]/20"
					placeholder="Describe your design..."
					bind:value={user_input}
					disabled={frameStore.isLoading}
				/>
				<Button
					class="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-[#3b82f6] p-0 transition-colors duration-200 hover:bg-[#2563eb]"
					type="submit"
					size="icon"
					disabled={frameStore.isLoading || !user_input.trim()}
				>
					{#if frameStore.isLoading}
						<Loader2 class="h-5 w-5 animate-spin text-white" />
					{:else}
						<Send class="h-5 w-5 text-white" />
					{/if}
				</Button>
			</div>

			<div class="flex items-center justify-between px-1">
				<div class="flex h-full items-center gap-3">
					<Switch
						class="h-5 w-10 bg-card data-[state=checked]:bg-[#3b82f6]"
						id="concept-toggle"
						name="concept-toggle"
						bind:checked={frameStore.chat_settings.skip_concept}
					/>
					<label
						for="concept-toggle"
						class="flex h-full items-center gap-1.5 text-sm font-medium leading-none text-white"
					>
						{#if frameStore.chat_settings.skip_concept}
							<Ban class="h-4 w-4 text-white" />
						{:else}
							<Lightbulb class="h-4 w-4 text-[#3b82f6]" />
						{/if}
						{frameStore.chat_settings.skip_concept ? 'Skip Concept' : 'Include Concept'}
					</label>
				</div>

				<Button
					variant="outline"
					size="sm"
					class="h-8 rounded-full px-3 text-sm font-medium hover:bg-destructive hover:text-destructive-foreground"
					onclick={() => {
						clearMessagesFromFrameStore();
					}}
				>
					<Trash2 class="mr-2 h-4 w-4" />
					Clear Chat
				</Button>
			</div>
		</form>
	</div>
</div>
