<script lang="ts">
	import type { ChatMessageWithMeta } from '$lib/types';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import InfoIcon from '@lucide/svelte/icons/info';

	let { message }: { message: ChatMessageWithMeta } = $props();

	// Helper function to extract text content from OpenAI message format
	function extractContent(content: any[]): string {
		if (!Array.isArray(content)) return String(content);

		return content
			.map((item) => {
				if (typeof item === 'string') return item;
				if (item.role && Array.isArray(item.content)) {
					return extractContent(item.content);
				}
				if (item.content && Array.isArray(item.content)) {
					return extractContent(item.content);
				}
				if (typeof item.content === 'string') return item.content;
				if (item.text) return item.text;
				if (item.type === 'text' && item.text) return item.text;
				return '';
			})
			.filter(Boolean)
			.join('\n');
	}

	// Function to check if content contains images
	function containsImages(content: any[]): boolean {
		if (!Array.isArray(content)) return false;

		return content.some((item) => {
			if (item.role && Array.isArray(item.content)) {
				return containsImages(item.content);
			}
			if (item.content && Array.isArray(item.content)) {
				return containsImages(item.content);
			}
			return (
				item.type === 'image_url' ||
				(item.content && typeof item.content === 'object' && item.content.type === 'image_url')
			);
		});
	}

	// Extract image URLs from content
	function extractImages(content: any[]): { url: string; alt: string }[] {
		if (!Array.isArray(content)) return [];

		const images: { url: string; alt: string }[] = [];

		content.forEach((item) => {
			if (item.role && Array.isArray(item.content)) {
				images.push(...extractImages(item.content));
			} else if (item.content && Array.isArray(item.content)) {
				images.push(...extractImages(item.content));
			} else if (item.type === 'image_url' && item.image_url) {
				images.push({
					url: item.image_url.url,
					alt: 'AI generated image'
				});
			} else if (
				item.content &&
				typeof item.content === 'object' &&
				item.content.type === 'image_url' &&
				item.content.image_url
			) {
				images.push({
					url: item.content.image_url.url,
					alt: 'AI generated image'
				});
			}
		});

		return images;
	}
</script>

{#if message.style === 'user'}
	<div class="flex w-full flex-col items-end py-1 transition-opacity duration-200">
		<div class="max-w-[85%] rounded-xl bg-primary px-3 py-2 text-primary-foreground shadow-sm">
			<div class="prose prose-xs dark:prose-invert text-xs">
				{#if Array.isArray(message.content)}
					{extractContent(message.content)}

					{#if containsImages(message.content)}
						<div class="mt-1 flex flex-wrap gap-1">
							{#each extractImages(message.content) as image}
								<img
									src={image.url}
									alt={image.alt}
									class="mt-1 h-auto max-h-48 w-auto max-w-full rounded-lg object-contain"
								/>
							{/each}
						</div>
					{/if}
				{:else}
					{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
				{/if}
			</div>
		</div>
		<div class="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground opacity-70">
			<span class="font-medium">You</span>
			<span>•</span>
			<span>{message.timestamp.toLocaleString()}</span>
		</div>
	</div>
{/if}

{#if message.style === 'assistant'}
	<div class="flex w-full flex-col items-start py-1 transition-opacity duration-200">
		<div class="max-w-[85%] rounded-xl bg-muted px-3 py-2 shadow-sm">
			<div class="prose prose-xs dark:prose-invert text-xs">
				{#if Array.isArray(message.content)}
					{extractContent(message.content)}

					{#if containsImages(message.content)}
						<div class="mt-1 flex flex-wrap gap-1">
							{#each extractImages(message.content) as image}
								<img
									src={image.url}
									alt={image.alt}
									class="mt-1 h-auto max-h-48 w-auto max-w-full rounded-lg object-contain"
								/>
							{/each}
						</div>
					{/if}
				{:else}
					{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
				{/if}
			</div>
		</div>
		<div class="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground opacity-70">
			<span class="font-medium">AI Assistant</span>
			<span>•</span>
			<span>{message.timestamp.toLocaleString()}</span>
		</div>
	</div>
{/if}

{#if message.style === 'system'}
	<div class="flex w-full flex-col items-center py-1 transition-opacity duration-200">
		<div
			class="max-w-[90%] rounded-lg bg-blue-50 px-3 py-2 text-center shadow-sm dark:bg-blue-950/30"
		>
			<div class="flex items-center justify-center gap-1">
				<InfoIcon class="h-3 w-3 text-blue-500 dark:text-blue-400" />
				<span class="text-xs font-medium text-blue-700 dark:text-blue-300">
					{#if Array.isArray(message.content)}
						{extractContent(message.content)}
					{:else}
						{typeof message.content === 'string'
							? message.content
							: JSON.stringify(message.content)}
					{/if}
				</span>
			</div>
		</div>
		<div class="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground opacity-80">
			<span>System</span>
			<span>•</span>
			<span>{message.timestamp.toLocaleString()}</span>
		</div>
	</div>
{/if}

{#if message.style === 'info'}
	<div class="flex w-full flex-col items-center py-1">
		<div
			class="max-w-[90%] rounded-lg bg-amber-50 px-3 py-2 text-center shadow-sm dark:bg-amber-950/30"
		>
			<div class="flex items-center justify-center gap-1">
				<InfoIcon class="h-3 w-3 text-amber-500 dark:text-amber-400" />
				<span class="text-xs font-medium text-amber-700 dark:text-amber-300">
					{#if Array.isArray(message.content)}
						{extractContent(message.content)}
					{:else}
						{typeof message.content === 'string'
							? message.content
							: JSON.stringify(message.content)}
					{/if}
				</span>
			</div>
		</div>
	</div>
{/if}

{#if message.style === 'error'}
	<div class="flex w-full flex-col items-center py-1">
		<div
			class="max-w-[90%] rounded-lg bg-red-50 px-3 py-2 text-center shadow-sm dark:bg-red-950/30"
		>
			<div class="flex items-center justify-center gap-1">
				<AlertCircleIcon class="h-3 w-3 text-red-500 dark:text-red-400" />
				<span class="text-xs font-medium text-red-700 dark:text-red-300">
					{#if Array.isArray(message.content)}
						{extractContent(message.content)}
					{:else}
						{typeof message.content === 'string'
							? message.content
							: JSON.stringify(message.content)}
					{/if}
				</span>
			</div>
		</div>
	</div>
{/if}

{#if message.style === 'image' && message.content[0]?.role === 'user'}
	<div class="flex w-full flex-col items-end py-1 transition-opacity duration-200">
		<div class="max-w-[85%] space-y-1">
			{#each message.content as chat}
				{#if chat.role === 'user'}
					{#each chat.content as content}
						{#if typeof content === 'string'}
							<div class="rounded-xl bg-primary px-3 py-2 text-primary-foreground shadow-sm">
								<div class="prose prose-xs dark:prose-invert text-xs">
									{content}
								</div>
							</div>
						{:else if content.type === 'image_url'}
							<div class="overflow-hidden rounded-lg shadow-sm">
								<img
									class="h-auto w-48 max-w-full object-cover"
									src={content.image_url.url}
									alt="User shared image"
								/>
							</div>
						{/if}
					{/each}
				{/if}
			{/each}
		</div>
		<div class="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground opacity-70">
			<span class="font-medium">You</span>
			<span>•</span>
			<span>{message.timestamp.toLocaleString()}</span>
		</div>
	</div>
{/if}
