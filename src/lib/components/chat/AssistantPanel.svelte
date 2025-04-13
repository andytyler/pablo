<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import VisionChat from './VisionChat.svelte';

	// Props using Svelte 5 syntax
	let { canvasSelector = '#design-canvas', canvasWidth = 500, canvasHeight = 700 } = $props();

	// Track active tab
</script>

<div class="flex w-full flex-col overflow-hidden">
	<!-- Chat panel -->
	<Tabs.Root value="assistant">
		<Tabs.List class="flex w-full flex-row gap-2 bg-card p-2">
			<Tabs.Trigger class="" value="setup">Artboard Info</Tabs.Trigger>
			<Tabs.Trigger class="" value="assistant">AI Assistant</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="assistant">
			<div class="flex h-full flex-col">
				<div class="bg-muted/50 p-3">
					<h3 class="text-lg font-semibold">Design Assistant</h3>
					<p class="text-sm text-muted-foreground">
						Ask questions, get feedback, or generate HTML designs with AI
					</p>
				</div>

				<Separator />

				<VisionChat {canvasSelector} {canvasWidth} {canvasHeight} />
			</div>
		</Tabs.Content>

		<Tabs.Content value="setup" class="h-full p-4">
			<div class="flex-1 overflow-hidden">
				<h3 class="mb-2 text-sm font-medium">Artboard Information</h3>
				<div class="text-xs text-muted-foreground">
					<p>Current Size: {canvasWidth} × {canvasHeight}px</p>
					<p class="mt-1">Click on any element to edit its properties.</p>
				</div>
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
