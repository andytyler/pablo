<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import VisionChat from './VisionChat.svelte';

	// Canvas selector to target for screenshots
	export let canvasSelector: string = '#design-canvas';

	// State for collapsing the assistant panel
	let isCollapsed = false;
</script>

<div
	class="design-assistant-container fixed right-0 top-20 z-40 flex h-[calc(100vh-120px)] transition-all duration-300 ease-in-out"
	style:transform={isCollapsed ? 'translateX(calc(100% - 40px))' : 'translateX(0)'}
>
	<!-- Toggle button -->
	<Button
		variant="outline"
		size="icon"
		class="absolute -left-10 top-4 h-10 w-10 rounded-full border shadow-md"
		on:click={() => (isCollapsed = !isCollapsed)}
	>
		{#if isCollapsed}
			<ChevronLeft class="h-5 w-5" />
		{:else}
			<ChevronRight class="h-5 w-5" />
		{/if}
	</Button>

	<!-- Chat panel -->
	<Card.Root class="flex w-[400px] flex-col overflow-hidden border shadow-lg">
		<Card.Header class="bg-muted/50 p-4">
			<Card.Title>Design Assistant</Card.Title>
			<Card.Description>
				Ask questions about your design and get AI-powered feedback
			</Card.Description>
		</Card.Header>

		<Separator />

		<Card.Content class="flex-1 overflow-hidden p-0">
			<VisionChat {canvasSelector} />
		</Card.Content>
	</Card.Root>
</div>
