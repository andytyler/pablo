<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { createEventDispatcher } from 'svelte';
	import VisionChat from './VisionChat.svelte';

	// Use $props() instead of export let for Svelte 5
	let { canvasSelector = '#design-canvas', currentHtml = '' } = $props();

	// Event dispatcher for HTML generation
	const dispatch = createEventDispatcher<{
		generateHTML: { html: string };
	}>();

	// Handle HTML generation from VisionChat
	function handleGenerateHTML(html: string) {
		dispatch('generateHTML', { html });
	}
</script>

<div class="design-assistant-container flex h-full flex-col">
	<!-- Chat panel -->
	<Card.Root class="flex h-full flex-col overflow-hidden border shadow-md">
		<Card.Header class="bg-muted/50 p-3">
			<Card.Title>Design Assistant</Card.Title>
			<Card.Description>
				Ask questions, get feedback, or generate HTML designs with AI
			</Card.Description>
		</Card.Header>

		<Separator />

		<Card.Content class="flex-1 overflow-hidden p-0">
			<VisionChat {canvasSelector} {currentHtml} onGenerateHTML={handleGenerateHTML} />
		</Card.Content>
	</Card.Root>
</div>
