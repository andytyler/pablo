<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import * as ScrollArea from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { artboardStore } from '$lib/stores/artboard-store.svelte';
	import Image from 'lucide-svelte/icons/image';
</script>

<div class="flex flex-col gap-4">
	<div class="bg-muted/50 p-2">
		<h3 class="text-lg font-semibold">Artboard Assets</h3>
		<p class="text-sm text-muted-foreground">All images available in the current design</p>
	</div>

	<Separator />

	{#if artboardStore.all_images?.length > 0}
		<div class="mt-2">
			<p class="mb-2 text-sm font-medium">
				All Images ({artboardStore.all_images?.length})
			</p>
			<ScrollArea.Root class="h-[300px]">
				<div class="grid grid-cols-2 gap-3 p-1 md:grid-cols-3">
					{#each artboardStore.all_images as image}
						<Card class="relative overflow-hidden">
							<div class="relative aspect-square w-full">
								<img
									src={image.url}
									alt={image.description || 'Design image'}
									class="h-full w-full object-cover"
								/>
								<div class="absolute bottom-0 left-0 right-0 bg-background/80 p-1 text-xs">
									{image.description || 'No description'}
								</div>
							</div>
						</Card>
					{/each}
				</div>
				<ScrollArea.Scrollbar orientation="vertical" />
			</ScrollArea.Root>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
			<Image class="mb-2 h-10 w-10" />
			<p>No images in the current design</p>
			<p class="mt-1 text-xs">Images added to the design will appear here</p>
		</div>
	{/if}
</div>
