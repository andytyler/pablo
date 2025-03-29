<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Textarea } from '$lib/components/ui/textarea';
	import { captureCanvasScreenshot } from '$lib/connections/screenshot';
	import { useChat } from '$lib/hooks/useChat';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import SendIcon from '@lucide/svelte/icons/send';

	// Props
	export let canvasSelector: string = '#design-canvas';
	export let placeholder: string = 'Ask something about your design...';

	// State
	let prompt = '';
	let isCapturingImage = false;

	// Chat hook initialization
	const { messages, input, handleSubmit, isLoading, error } = useChat({
		api: '/api/chat'
	});

	// Function to handle sending a message with an image
	async function handleSendWithImage() {
		if (!prompt.trim()) return;

		isCapturingImage = true;
		try {
			// Capture the canvas screenshot
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
</script>

<div class="flex h-full flex-col">
	<div class="flex-1 space-y-4 overflow-y-auto p-4">
		{#if $messages.length === 0}
			<div class="flex h-full items-center justify-center">
				<p class="text-center text-muted-foreground">
					Ask me anything about your design. I'll analyze the image and provide feedback.
				</p>
			</div>
		{:else}
			{#each $messages as message}
				<div class="flex flex-col {message.role === 'user' ? 'items-end' : 'items-start'}">
					<div
						class="max-w-[80%] rounded-lg p-3 {message.role === 'user'
							? 'bg-primary text-primary-foreground'
							: 'bg-muted'}"
					>
						<p>{message.content}</p>
					</div>
					<span class="mt-1 text-xs text-muted-foreground">
						{message.role === 'user' ? 'You' : 'AI Assistant'}
					</span>
				</div>
			{/each}

			{#if $isLoading}
				<div class="flex items-center space-x-2">
					<Loader2 class="h-4 w-4 animate-spin" />
					<p class="text-sm text-muted-foreground">Thinking...</p>
				</div>
			{/if}
		{/if}

		{#if $error}
			<div class="rounded-lg bg-destructive/10 p-3 text-destructive">
				<p>Error: {$error}</p>
			</div>
		{/if}
	</div>

	<Separator />

	<div class="p-4">
		<form on:submit|preventDefault={handleSendWithImage} class="flex items-end gap-2">
			<div class="flex-1">
				<Textarea bind:value={prompt} {placeholder} rows={1} class="min-h-[60px] resize-none" />
			</div>
			<Button
				type="submit"
				disabled={$isLoading || isCapturingImage || !prompt.trim()}
				variant="default"
				class="h-[60px] w-[60px]"
			>
				{#if $isLoading || isCapturingImage}
					<Loader2 class="h-5 w-5 animate-spin" />
				{:else}
					<SendIcon class="h-5 w-5" />
				{/if}
			</Button>
		</form>
	</div>
</div>
