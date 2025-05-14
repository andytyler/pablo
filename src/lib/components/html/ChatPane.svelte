<script lang="ts">
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
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

	async function handleSubmit() {
		if (!user_input.trim()) {
			console.error('No prompt provided');
			return;
		}

		frameStore.isLoading = true;
		generationError = ''; // Clear previous errors
		prompt = user_input; // Store the current input as the prompt
		user_input = ''; // Clear the input field immediately

		let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

		try {
			// 1. Capture Screenshot
			const screenshotResult = await captureCanvasScreenshot(`#${frameStore.frame.id}`);
			if (screenshotResult.error || !screenshotResult.url) {
				throw new Error(screenshotResult.error?.message || 'Failed to capture canvas screenshot');
			}
			const canvasScreenshotUrl = screenshotResult.url;

			addMessageToFrameStore('image', [
				{
					role: 'user',
					content: [{ type: 'image_url', image_url: { url: canvasScreenshotUrl, detail: 'high' } }]
				}
			]);
			addMessageToFrameStore('user', [{ role: 'user', content: [{ type: 'text', text: prompt }] }]);

			// 2. Generate Design with Timeout
			const designGenerationPromise = fetch('/api/generate-design/html-design', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					prompt,
					previous_design_html: frameStore.html.raw || '<div>Blank Canvas</div>',
					current_height: frameStore.frame.height,
					current_width: frameStore.frame.width,
					chat_history_messages: frame_chat_messages.messages,
					skip_concept: frameStore.chat_settings.skip_concept
				})
			});

			const timeoutPromise = new Promise<never>((_, reject) => {
				timeoutId = setTimeout(() => {
					reject(new Error('Design generation timed out after 180 seconds'));
				}, 180000); // 180 seconds (3 minutes)
			});

			// Race the API call against the timeout
			const response = await Promise.race([designGenerationPromise, timeoutPromise]);

			// If we reach here, the fetch completed (successfully or with an error status) before the timeout
			if (timeoutId) {
				clearTimeout(timeoutId); // Clear the timeout
				timeoutId = undefined;
			}

			if (!response.ok) {
				let errorResponseMessage = `Failed to generate design (status: ${response.status})`;
				try {
					const errorData = await response.json();
					errorResponseMessage = errorData.message || errorData.error || errorResponseMessage;
				} catch (e) {
					// Ignore if parsing error body fails, stick to original message
				}
				throw new Error(errorResponseMessage);
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
		} catch (err: any) {
			// Catch any error, including the timeout or screenshot error
			console.error('Error in handleSubmit:', err);
			generationError = err.message || 'An unexpected error occurred during the process.';
			if (timeoutId) {
				// Ensure timeout is cleared if an error occurred while it was active
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}
		} finally {
			if (timeoutId) {
				// Final safety clear for timeout, e.g. if try block exited unexpectedly
				clearTimeout(timeoutId);
			}
			frameStore.isLoading = false; // Ensure loading state is always reset
		}
	}
</script>

<div class="bg-sidebar-background relative flex h-full flex-col overflow-hidden px-2 pb-2">
	<!-- Messages area with ScrollArea -->
	<ScrollArea orientation="vertical" class="relative min-h-0 flex-1" id="chat-scroll-area">
		<div class="space-y-2 pb-2">
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
	</ScrollArea>

	<!-- Input area - fixed at bottom of container -->
	<div class="bg-sidebar-background rounded-t-xl">
		<form onsubmit={handleSubmit} class="gap-1">
			<div class="relative">
				<Textarea
					id="prompt-textarea"
					class="max-h-40 min-h-24 w-full resize-y overflow-y-auto rounded-xl border border-border bg-card p-2 pr-14 text-sm text-white/90 outline-none placeholder:text-white/40"
					placeholder="Imagine Anything..."
					bind:value={user_input}
					disabled={frameStore.isLoading}
				/>
				<Button
					class="bg- absolute bottom-3 right-3 h-6 rounded-lg px-1 transition-colors duration-200 hover:bg-accent"
					type="submit"
					size="sm"
					variant="outline"
					disabled={frameStore.isLoading || !user_input.trim()}
				>
					{#if frameStore.isLoading}
						<Loader2 class="h-4 w-4 animate-spin text-white" />
					{:else}
						<Send class="h-4 w-4 text-white" /> Send
					{/if}
				</Button>
			</div>

			<div class="flex items-center justify-between px-1">
				<div class="flex h-full items-center gap-3">
					<Switch
						class="h-5 w-10 bg-popover data-[state=checked]:bg-accent"
						id="concept-toggle"
						name="concept-toggle"
						bind:checked={frameStore.chat_settings.skip_concept}
					/>
					<label
						for="concept-toggle"
						class="flex h-full items-center gap-2.5 text-xs font-medium leading-none text-white"
					>
						{#if frameStore.chat_settings.skip_concept}
							<Ban class="h-4 w-4 text-muted" />
							<span class="text-muted">Concept OFF</span>
						{:else}
							<div class="flex items-center gap-1 rounded-md bg-accent px-1.5 py-1">
								<Lightbulb class="h-4 w-4 text-accent-foreground" />
								<span class="text-accent-foreground">Concept ON</span>
							</div>
						{/if}
					</label>
				</div>

				<Button
					variant="outline"
					size="sm"
					class="h-7 rounded-full px-2 text-sm font-medium hover:bg-destructive hover:text-destructive-foreground"
					onclick={() => {
						clearMessagesFromFrameStore();
					}}
				>
					<Trash2 class="h-4 w-4" />
					Clear Chat
				</Button>
			</div>
		</form>
	</div>
</div>
