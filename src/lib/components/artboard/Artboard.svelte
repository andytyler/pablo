<script lang="ts">
	import HtmlRenderer from '../HtmlRenderer.svelte';

	// Props using Svelte 5 syntax
	let { canvasWidth = 500, canvasHeight = 700 } = $props<{
		canvasWidth?: number;
		canvasHeight?: number;
	}>();
</script>

<div class="flex h-full w-full flex-1 items-center justify-center bg-background">
	<!-- FRAME -->
	<div
		id="design-canvas"
		class=" flex-0 overflow-hidden rounded-md border-2 border-dashed border-border bg-white"
	>
		<HtmlRenderer {canvasWidth} {canvasHeight} />
	</div>
</div>
