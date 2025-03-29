<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Textarea } from '$lib/components/ui/textarea';
	import { captureCanvasScreenshot } from '$lib/connections/screenshot';
	import { useChat } from '$lib/hooks/useChat';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import CodeIcon from '@lucide/svelte/icons/code';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import SendIcon from '@lucide/svelte/icons/send';

	// Props
	export let canvasSelector: string = '#design-canvas';
	export let placeholder: string = 'Ask something about your design...';
	export let currentHtml: string = '';

	// Event to emit when HTML should be rendered
	export let onGenerateHTML: (html: string) => void = () => {};

	// State
	let prompt = '';
	let isCapturingImage = false;
	let isGeneratingHTML = false;
	let generationError = '';

	// Chat hook initialization
	const { messages, input, handleSubmit, isLoading, error } = useChat({
		api: '/api/chat'
	});

	// Function to handle sending a message with an image
	async function handleSendWithImage() {
		if (!prompt.trim()) return;

		isCapturingImage = true;
		try {
			// Capture the design screenshot using html2canvas
			const imageBase64 = await captureCanvasScreenshot(canvasSelector);

			// Prepare the message content
			const content = prompt;
			prompt = '';

			// Send the message with the image
			await handleSubmit(new FormData(), {
				prompt: content,
				imageBase64
			});
		} catch (e) {
			console.error('Error sending message with image:', e);
		} finally {
			isCapturingImage = false;
		}
	}

	// Function to generate HTML from text prompt
	async function generateHTML() {
		if (!prompt.trim()) return;

		isGeneratingHTML = true;
		generationError = '';

		try {
			// Capture the current design state as a screenshot
			const imageBase64 = await captureCanvasScreenshot(canvasSelector);

			// Call the HTML generation API with the prompt, current HTML and screenshot
			const response = await fetch('/api/generate-html', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					prompt,
					imageBase64,
					currentHtml
				})
			});

			const data = await response.json();

			if (!response.ok || data.error) {
				throw new Error(data.error || 'Failed to generate HTML');
			}

			// Add the messages to the chat
			addUserMessage(`Update design: ${prompt}`);
			addAssistantMessage(
				"I've updated the design based on your request. Check out the new version on the canvas!"
			);

			// Clear the prompt
			prompt = '';

			// Emit event with the generated HTML
			onGenerateHTML(data.html);
		} catch (e) {
			console.error('Error generating HTML:', e);
			generationError = e instanceof Error ? e.message : 'Failed to generate HTML';
		} finally {
			isGeneratingHTML = false;
		}
	}

	// Helper functions to manage messages (copied from useChat implementation)
	function addUserMessage(content: string) {
		const generateId = () => Math.random().toString(36).substring(2, 10);
		messages.update((msgs) => [...msgs, { id: generateId(), role: 'user', content }]);
	}

	function addAssistantMessage(content: string) {
		const generateId = () => Math.random().toString(36).substring(2, 10);
		messages.update((msgs) => [...msgs, { id: generateId(), role: 'assistant', content }]);
	}
</script>

<div class="flex h-full flex-col">
	<!-- Messages -->
	<div class="flex-1 space-y-4 overflow-y-auto p-4">
		{#each $messages as message}
			<div class="flex flex-col {message.role === 'user' ? 'items-end' : 'items-start'}">
				<div
					class="max-w-[85%] rounded-lg p-3 {message.role === 'user'
						? 'bg-primary text-primary-foreground'
						: 'bg-muted'}"
				>
					{message.content}
				</div>
				<span class="mt-1 text-xs text-muted-foreground">
					{message.role === 'user' ? 'You' : 'AI Assistant'}
				</span>
			</div>
		{/each}

		{#if $isLoading || isCapturingImage || isGeneratingHTML}
			<div class="flex justify-center py-4">
				<Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		{/if}

		{#if $error || generationError}
			<div class="rounded-md bg-destructive/10 p-3 text-destructive">
				<div class="flex items-center gap-2">
					<AlertTriangle class="h-4 w-4" />
					<span>Error: {$error || generationError}</span>
				</div>
			</div>
		{/if}
	</div>

	<Separator />

	<!-- Input area -->
	<div class="p-4">
		<form on:submit|preventDefault={handleSendWithImage} class="flex flex-col gap-4">
			<Textarea
				bind:value={prompt}
				{placeholder}
				class="min-h-24 resize-none"
				disabled={$isLoading || isCapturingImage || isGeneratingHTML}
			/>
			<div class="ml-auto flex gap-2">
				<Button
					type="button"
					variant="outline"
					onclick={generateHTML}
					disabled={$isLoading || isCapturingImage || isGeneratingHTML || !prompt.trim()}
				>
					{#if isGeneratingHTML}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Generating...
					{:else}
						<CodeIcon class="mr-2 h-4 w-4" />
						Generate HTML
					{/if}
				</Button>

				<Button
					type="submit"
					disabled={$isLoading || isCapturingImage || isGeneratingHTML || !prompt.trim()}
				>
					{#if $isLoading || isCapturingImage}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{isCapturingImage ? 'Capturing image...' : 'Sending...'}
					{:else}
						<SendIcon class="mr-2 h-4 w-4" />
						Send
					{/if}
				</Button>
			</div>
		</form>
	</div>
</div>
