<script lang="ts">
	import { artboardStore } from '$lib/stores/artboard-store.svelte';
	import HtmlRenderer from './HtmlRenderer.svelte';
</script>

<div class="flex h-full w-full flex-1 items-center justify-center bg-background">
	<div class="flex flex-col gap-2">
		<!-- SIZE CONTROLS -->
		<div class="flex flex-row items-center gap-2">
			<div class="flex items-center gap-2">
				<label for="canvas-width" class="text-sm text-muted-foreground">Width:</label>
				<input
					id="canvas-width"
					type="number"
					bind:value={artboardStore.artboard_width}
					class="flex-0 w-16 max-w-min rounded-md border bg-transparent px-2 py-1 text-sm text-muted-foreground focus:outline-none focus:ring-0"
				/>
			</div>
			<div class="flex items-center gap-2">
				<label for="canvas-height" class="text-sm text-muted-foreground">Height:</label>
				<input
					id="canvas-height"
					type="number"
					bind:value={artboardStore.artboard_height}
					class="flex-0 w-16 max-w-min rounded-md border bg-transparent px-2 py-1 text-sm text-muted-foreground focus:outline-none focus:ring-0"
				/>
			</div>
		</div>
		<!-- FRAME -->
		<div
			id="design-canvas"
			class=" flex-0 overflow-hidden rounded-md border-2 border-dashed border-border bg-white"
		>
			<HtmlRenderer
				canvasWidth={artboardStore.artboard_width}
				canvasHeight={artboardStore.artboard_height}
			/>
		</div>
		<div class="flex flex-row items-start gap-2">
			<p>
				{artboardStore.image_enriched_design_json?.concept}
			</p>
		</div>
	</div>
</div>
