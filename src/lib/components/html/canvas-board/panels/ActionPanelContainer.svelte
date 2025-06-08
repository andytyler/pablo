<script lang="ts">
	import { design_concept, frame, html, images, resetFrame } from '$lib/stores/frame-store.svelte';
	import { Trash } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import PasteImage from '../../PasteImage.svelte';
	import ChatMessages from './ChatMessages.svelte';
	import ChatPane from './ChatPane.svelte';
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
		}
	}
</script>

<div
	class="action-panel-container absolute right-5 top-5 z-50 h-[95%] max-h-[95%] w-[420px] overflow-hidden rounded-lg bg-card/80 shadow-xl backdrop-blur-md"
>
	<div class="flex h-full w-full flex-col overflow-hidden">
		<Tabs.Root value="assistant" class="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
			<Tabs.List class="mx-auto flex w-full gap-2 rounded-none bg-muted/30 p-1">
				<Tabs.Trigger class="text-sm font-medium" value="setup">Artboard</Tabs.Trigger>
				<Tabs.Trigger class="text-sm font-medium" value="assistant">Assistant</Tabs.Trigger>
				<Tabs.Trigger class="text-sm font-medium" value="images">Images</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content
				value="setup"
				class="m-0 h-full p-3 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col"
			>
				<Card.Root class="w-full overflow-y-auto">
					<Card.Header class="p-3 pb-4">
						<Card.Title class="text-lg">Artboard Settings</Card.Title>
						<Card.Description class="text-sm text-muted-foreground">
							Configure your design canvas and view debug information.
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-6">
						<!-- Frame Dimensions -->
						<div class="space-y-3">
							<Label class="text-sm font-semibold">Frame Dimensions</Label>
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-2">
									<Label for="width" class="text-xs text-muted-foreground">Width</Label>
									<Input id="width" type="number" bind:value={frame.width} min="1" class="h-9" />
								</div>
								<div class="space-y-2">
									<Label for="height" class="text-xs text-muted-foreground">Height</Label>
									<Input id="height" type="number" bind:value={frame.height} min="1" class="h-9" />
								</div>
							</div>
						</div>

						<Separator />

						<!-- Actions -->
						<div class="space-y-3">
							<Label class="text-sm font-semibold">Actions</Label>
							<Button variant="destructive" onclick={resetFrame} class="h-9 w-full" size="sm">
								<Trash class="mr-2 h-4 w-4" />
								Clear Design
							</Button>
						</div>

						{#if design_concept.value}
							<Separator />
							<div class="space-y-3">
								<Label class="text-sm font-semibold">Design Concept</Label>
								<Card.Root class="bg-muted/50">
									<Card.Content class="p-3">
										<ScrollArea class="h-32 w-full">
											<p class="text-xs leading-relaxed text-muted-foreground">
												{design_concept.value}
											</p>
										</ScrollArea>
									</Card.Content>
								</Card.Root>
							</div>
						{/if}

						{#if html.raw}
							<Separator />
							<div class="space-y-3">
								<Label class="text-sm font-semibold">Raw HTML</Label>
								<Card.Root class="bg-muted/50">
									<Card.Content class="p-3">
										<ScrollArea class="h-40 w-full">
											<pre
												class="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">{html.raw}</pre>
										</ScrollArea>
									</Card.Content>
								</Card.Root>
							</div>
						{/if}

						{#if html.processed}
							<Separator />
							<div class="space-y-3">
								<Label class="text-sm font-semibold">Processed HTML</Label>
								<Card.Root class="bg-muted/50">
									<Card.Content class="p-3">
										<ScrollArea class="h-40 w-full">
											<pre
												class="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">{html.processed}</pre>
										</ScrollArea>
									</Card.Content>
								</Card.Root>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</Tabs.Content>

			<Tabs.Content
				value="assistant"
				class="m-0 h-full  data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col"
			>
				<div class="flex h-full min-h-0 flex-1 flex-col">
					<div class="flex min-h-0 flex-1 flex-col p-0">
						<ChatMessages />
					</div>
					<div class=" flex h-48 w-full flex-none items-start justify-start p-2 pt-0">
						<ChatPane />
					</div>
				</div>
			</Tabs.Content>

			<Tabs.Content
				value="images"
				class="m-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col"
			>
				<Card.Root class="w-full overflow-y-auto">
					<Card.Header class="p-3 pb-4">
						<Card.Title class="text-lg">Image Management</Card.Title>
						<Card.Description class="text-sm text-muted-foreground">
							Upload images by pasting, dragging or selecting files.
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<PasteImage />

						{#if images.uploaded && images.uploaded.length > 0}
							<Separator />
							<div class="space-y-3">
								<Label class="text-sm font-semibold">Available Images</Label>
								<Card.Root class="bg-muted/50">
									<Card.Content class="p-3">
										<p class="mb-3 text-xs text-muted-foreground">
											These images are available to use in your design. Ask the AI assistant to
											include them.
										</p>
										<div class="grid grid-cols-2 gap-2">
											{#each images.uploaded as image}
												<div class="aspect-square overflow-hidden rounded-md bg-muted">
													<img src={image.url} alt="Uploaded" class="h-full w-full object-cover" />
												</div>
											{/each}
										</div>
									</Card.Content>
								</Card.Root>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
