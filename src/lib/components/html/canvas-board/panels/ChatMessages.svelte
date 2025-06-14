<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { frame_chat_messages } from '$lib/stores/frame-messages-store.svelte';
	import { generationError, isLoading } from '$lib/stores/frame-store.svelte';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import { Send } from 'lucide-svelte';
	import ChatMessage from './ChatMessage.svelte';

	// State using Svelte 5 runes
	let isCapturingImage = $state(false);
	let isGeneratingHTML = $state(false);
	let messagesContainer: HTMLDivElement;

	// Scroll to bottom whenever messages change or component mounts
	function scrollToBottom() {
		if (messagesContainer) {
			// The element exists, scroll to bottom
			setTimeout(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}, 10); // A small delay can help ensure rendering is complete
		}
	}
	$effect(() => {
		if (frame_chat_messages.messages.length > 0) {
			scrollToBottom();
		}
	});
</script>

<ScrollArea class="h-full flex-1" orientation="vertical">
	<div class="h-full space-y-2 p-4" bind:this={messagesContainer}>
		{#if frame_chat_messages.messages.length === 0}
			<div class="flex h-[300px] flex-col items-center justify-center py-8 text-center">
				<div class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
					<Send class="h-6 w-6 rotate-[15deg] text-primary" />
				</div>
				<p class="text-xl font-medium text-foreground">Let's create something amazing</p>
				<p class="mt-2 text-base text-muted-foreground">
					Describe your design and I'll bring it to life
				</p>
			</div>
		{:else}
			{#each frame_chat_messages.messages.flat() as message (message.id)}
				<ChatMessage {message} />
			{/each}
		{/if}

		{#if isLoading.value || isCapturingImage || isGeneratingHTML}
			<div class="flex justify-center py-6">
				<div class="flex flex-col items-center gap-3">
					<div class="relative">
						<div
							class="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
						></div>
						<div class="absolute inset-0 flex items-center justify-center">
							<div class="h-5 w-5 rounded-full bg-muted"></div>
						</div>
					</div>
					<span class="text-sm text-muted-foreground">Generating your design...</span>
				</div>
			</div>
		{/if}

		{#if generationError.message}
			<div
				class="mx-auto max-w-[90%] rounded-md border border-red-500/20 bg-red-500/10 p-4 text-red-400"
			>
				<div class="flex items-center gap-2">
					<AlertTriangle class="h-5 w-5 flex-shrink-0" />
					<span>Error: {generationError.message}</span>
				</div>
			</div>
		{/if}
	</div>
</ScrollArea>
