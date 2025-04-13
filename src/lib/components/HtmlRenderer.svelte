<script lang="ts">
	// Component to render HTML content directly in the design artboard
	// This will accept HTML string and display it in a container
	import { htmlStore } from '$lib/stores/htmlStore';

	// Use $props() for Svelte 5 with proper typing
	let { canvasWidth = 500, canvasHeight = 700 } = $props<{
		canvasWidth?: number;
		canvasHeight?: number;
	}>();

	// References
	let canvasContainerId = 'canvas-container';
</script>

<div
	class="relative overflow-hidden"
	id={canvasContainerId}
	style="width: {canvasWidth}px; height: {canvasHeight}px"
>
	{#if $htmlStore.content}
		{@html $htmlStore.content}
	{:else if $htmlStore.isLoading}
		<div class="text-center text-muted-foreground">Loading...</div>
	{:else if $htmlStore.isWaiting}
		<div class="text-center text-muted-foreground">Waiting...</div>
	{:else}
		<div class="text-center text-muted-foreground">No content</div>
	{/if}
</div>
