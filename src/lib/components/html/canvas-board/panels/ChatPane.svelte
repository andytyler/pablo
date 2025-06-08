<script lang="ts">
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { captureCanvasScreenshot } from '$lib/connections/screenshot';
	import {
		addMessageToFrameStore,
		clearMessagesFromFrameStore,
		frame_chat_messages
	} from '$lib/stores/frame-messages-store.svelte';
	import {
		chat_settings,
		design_concept,
		frame,
		generationError,
		html,
		isLoading,
		persistFrameStore,
		resetFrame
	} from '$lib/stores/frame-store.svelte';
	import Ban from '@lucide/svelte/icons/ban';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { Send } from 'lucide-svelte';
	import { onMount } from 'svelte';

	// State using Svelte 5 runes
	let user_input = $state('');
	let prompt = $state('');

	onMount(() => {
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

		isLoading.value = true;
		generationError.message = ''; // Clear previous errors
		prompt = user_input; // Store the current input as the prompt
		user_input = ''; // Clear the input field immediately

		let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

		try {
			// 1. Capture Screenshot
			const screenshotResult = await captureCanvasScreenshot(`#${frame.id}`);
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
					previous_design_html: html.raw || '<div>Blank Canvas</div>',
					current_height: frame.height,
					current_width: frame.width,
					chat_history_messages: frame_chat_messages.messages,
					skip_concept: !chat_settings.skip_concept
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
			design_concept.value = data.design_concept;
			html.raw = data.design_html;

			// Add messages to chat history
			addMessageToFrameStore('assistant', [
				{ role: 'assistant', content: [{ type: 'text', text: data.design_concept }] }
			]);
			// Add messages to chat history
			addMessageToFrameStore('info', [
				{ role: 'assistant', content: [{ type: 'text', text: data.design_html }] }
			]);
		} catch (err: any) {
			// Catch any error, including the timeout or screenshot error
			console.error('Error in handleSubmit:', err);
			generationError.message = err.message || 'An unexpected error occurred during the process.';
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
			isLoading.value = false; // Ensure loading state is always reset
		}
	}
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	class="w-full"
>
	<div class="relative w-full">
		<Textarea
			id="prompt-textarea"
			class="max-h-40 min-h-24 w-full resize-y overflow-y-auto rounded-lg border border-border bg-card  p-2 pr-14 text-sm text-white/90 outline-none placeholder:text-white/40"
			placeholder="Imagine Anything..."
			bind:value={user_input}
			disabled={isLoading.value}
		/>
		<Button
			class="absolute bottom-3 right-3 h-6 rounded-lg bg-primary px-1 transition-colors duration-200 hover:bg-accent"
			type="submit"
			size="sm"
			variant="outline"
			disabled={isLoading.value || !user_input.trim()}
		>
			{#if isLoading.value}
				<Loader2 class="h-4 w-4 animate-spin text-white" />
			{:else}
				<Send class="h-4 w-4 text-white" /> Send
			{/if}
		</Button>
	</div>

	<div class="flex items-center justify-between px-1 pt-2">
		<div class="flex h-full items-center gap-3">
			<Switch
				class="h-5 w-10 bg-popover data-[state=checked]:bg-accent"
				id="concept-toggle"
				name="concept-toggle"
				bind:checked={chat_settings.skip_concept}
			/>
			<label
				for="concept-toggle"
				class="flex h-full items-center gap-2.5 text-xs font-medium leading-none text-white"
			>
				{#if chat_settings.skip_concept}
					<div class="flex items-center gap-1 rounded-md bg-accent px-1.5 py-1">
						<Lightbulb class="h-4 w-4 text-accent-foreground" />
						<span class="text-accent-foreground">Concept ON</span>
					</div>
				{:else}
					<Ban class="h-4 w-4 text-muted" />
					<span class="text-muted">Concept OFF</span>
				{/if}
			</label>
		</div>

		<Button
			variant="outline"
			size="sm"
			class="h-7 rounded-full px-2 text-sm font-medium hover:bg-destructive hover:text-destructive-foreground"
			onclick={() => {
				clearMessagesFromFrameStore();
				resetFrame();
			}}
		>
			<Trash2 class="h-4 w-4" />
			Clear Chat
		</Button>
	</div>
</form>
