<script lang="ts">
	import { frameStore, resetFrame } from '$lib/stores/frame-store.svelte';
	import { Trash } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import ChatPane from '../../ChatPane.svelte';
	import PasteImage from '../../PasteImage.svelte';

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
		}
	}
</script>

<div
	class="absolute right-5 top-5 z-50 max-h-[95vh] w-[400px] overflow-y-auto rounded-lg bg-card/30 shadow-lg backdrop-blur-sm"
>
	<div class="flex h-full w-full flex-col overflow-hidden">
		<Tabs.Root value="assistant" class="flex min-h-0 flex-1 flex-col overflow-hidden">
			<Tabs.List class="flex w-full flex-shrink-0 flex-row gap-2 bg-card p-1">
				<Tabs.Trigger class="" value="setup">Artboard Info</Tabs.Trigger>
				<Tabs.Trigger class="" value="assistant">AI Assistant</Tabs.Trigger>
				<Tabs.Trigger class="" value="images">Images</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="setup" class="h-full p-2">
				<div class="space-y-4">
					<div class="space-y-2">
						<Label>Frame Dimensions</Label>
						<div class="grid grid-cols-2 gap-2">
							<div class="space-y-2">
								<Label for="width">Width</Label>
								<Input
									id="width"
									type="number"
									bind:value={frameStore.frame.width}
									min="1"
									class="w-full"
								/>
							</div>
							<div class="space-y-2">
								<Label for="height">Height</Label>
								<Input
									id="height"
									type="number"
									bind:value={frameStore.frame.height}
									min="1"
									class="w-full"
								/>
							</div>
						</div>
					</div>

					<div class="space-y-2">
						<Label>Actions</Label>
						<div class="flex flex-col gap-2">
							<Button variant="outline" onclick={resetFrame} class="w-full">
								<Trash class="mr-2 h-4 w-4" />
								Clear Design
							</Button>
						</div>
					</div>

					{#if frameStore.design_concept}
						<div class="space-y-2">
							<Label>Design Concept</Label>
							<div class="rounded-lg border bg-card text-sm text-card-foreground">
								<ScrollArea direction="vertical" class="h-48 p-2">
									{frameStore.design_concept}
								</ScrollArea>
							</div>
						</div>
					{/if}
					{#if frameStore.html.raw}
						<div class="space-y-2">
							<Label>RAW HTML</Label>
							<div class="rounded-lg border bg-card text-sm text-card-foreground">
								<ScrollArea direction="vertical" class="h-64 p-2">
									{frameStore.html.raw}
								</ScrollArea>
							</div>
						</div>
					{/if}
					{#if frameStore.html.processed}
						<div class="space-y-2">
							<Label>PROCESSED HTML</Label>
							<div class="rounded-lg border bg-card text-sm text-card-foreground">
								<ScrollArea direction="vertical" class="h-64 p-2">
									{frameStore.html.processed}
								</ScrollArea>
							</div>
						</div>
					{/if}
				</div>
			</Tabs.Content>

			<Tabs.Content value="assistant" class="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden">
				<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
					<ChatPane />
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

					{#if frameStore.images.uploaded && frameStore.images.uploaded.length > 0}
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
</div>
