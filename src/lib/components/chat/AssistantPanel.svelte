<script lang="ts">
	import ArtboardAssets from '$lib/components/generated-assets/ArtboardAssets.svelte';
	import PasteImage from '$lib/components/pasteImage/PasteImage.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import { artboardStore } from '$lib/stores/artboard-store.svelte';
	import VisionChat from './VisionChat.svelte';

	// Props using Svelte 5 syntax
	let { canvasSelector = '#design-canvas' } = $props();

	// Track active tab
</script>

<div class="flex w-full flex-col overflow-hidden">
	<!-- Chat panel -->
	<Tabs.Root value="assistant" class="">
		<Tabs.List class="flex w-full flex-row gap-2 bg-card p-1">
			<Tabs.Trigger class="" value="setup">Artboard Info</Tabs.Trigger>
			<Tabs.Trigger class="" value="assistant">AI Assistant</Tabs.Trigger>
			<Tabs.Trigger class="" value="images">Images</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="setup" class="h-full">
			<div class="flex-1 overflow-hidden">
				<h2 class="mb-2 text-sm font-medium">Artboard Information</h2>
				<div class="text-xs">
					<p class="text-md mb-2">
						Current Size: {artboardStore.artboard_width} × {artboardStore.artboard_height}px
					</p>
					<h2 class="mb-2 text-sm font-medium">Current Design JSON</h2>
					<pre class="text-xs">
						{JSON.stringify(artboardStore.image_enriched_design_json, null, 2) || 'No design yet'}
					</pre>
				</div>
			</div>
		</Tabs.Content>

		<Tabs.Content value="assistant" class="mt-0 h-full flex-1 ">
			<div class="flex-1 overflow-hidden">
				<div class=" bg-muted/50 p-2">
					<h3 class="text-lg font-semibold">Design Assistant</h3>
					<p class="text-sm text-muted-foreground">
						Ask questions, get feedback, or generate HTML designs with AI
					</p>
				</div>

				<Separator />

				<VisionChat {canvasSelector} />
			</div>
		</Tabs.Content>

		<Tabs.Content value="images" class="h-full">
			<div class="flex-1 overflow-hidden">
				<div class="bg-muted/50 p-2">
					<h3 class="text-lg font-semibold">Image Management</h3>
					<p class="text-sm text-muted-foreground">
						Upload images by pasting, dragging or selecting files
					</p>
				</div>

				<Separator />

				<div class="p-4">
					<PasteImage />
				</div>

				<div class="p-4 pt-0">
					<ArtboardAssets />
				</div>

				{#if artboardStore.uploaded_images && artboardStore.uploaded_images.length > 0}
					<div class="px-4 pt-2">
						<h3 class="text-sm font-medium">Available in Design</h3>
						<p class="mb-2 text-xs text-muted-foreground">
							These images are available to use in your design. Ask the AI assistant to include
							them.
						</p>
					</div>
				{/if}
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
