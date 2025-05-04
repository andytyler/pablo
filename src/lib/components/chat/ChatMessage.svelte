<script lang="ts">
	import type { ChatMessageWithMeta } from '$lib/types';
	import InfoIcon from '@lucide/svelte/icons/info';

	let { message }: { message: ChatMessageWithMeta } = $props();
</script>

{#if message.style === 'user'}
	<!-- User or Assistant message style -->
	<div class="flex flex-col {message.style === 'user' ? 'items-end' : 'items-start'}">
		<div
			class="max-w-[85%] rounded-lg p-3 {message.style === 'user'
				? 'bg-primary text-primary-foreground'
				: 'bg-muted'}"
		>
			{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
		</div>
		<div
			class="mt-1 flex items-center gap-2 text-xs text-muted-foreground {message.style === 'user'
				? 'justify-end'
				: ''}"
		>
			<span>{message.style === 'user' ? 'You' : 'AI Assistant'}</span>
			<span>•</span>
			<span>{message.timestamp.toLocaleString()}</span>
		</div>
	</div>{/if}

{#if message.style === 'assistant'}
	<div class="flex flex-col items-start">
		<span class="text-xs">
			{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
		</span>
	</div>
{/if}

{#if message.style === 'system'}
	<!-- System message style -->
	<div class="flex flex-col items-center">
		<div class="max-w-[85%] rounded-lg bg-gray-100 p-1 text-center dark:bg-gray-600">
			<div class="flex items-center justify-center gap-1">
				<InfoIcon class="h-4 w-4" />
				<span class="text-xs">
					{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
				</span>
			</div>
		</div>
		<div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
			<span>System</span>
			<span>•</span>
			<span>{message.timestamp.toLocaleString()}</span>
		</div>
	</div>
{/if}

{#if message.style === 'info'}
	<div class="flex flex-col items-center">
		<span class="text-xs">
			{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
		</span>
	</div>
{/if}
{#if message.style === 'error'}
	<div class="flex flex-col items-center">
		<span class="text-xs">
			{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
		</span>
	</div>
{/if}
{#if message.style === 'image' && message.content[0].role === 'user'}
	{#each message.content as chat}
		<div class="flex flex-col items-end overflow-hidden rounded-lg">
			<span class="text-xs">
				{#if chat.role === 'user'}
					{#each chat.content as content}
						{#if typeof content === 'string'}
							{content}
						{:else if content.type === 'image_url'}
							<img
								class="object-fit m-2 h-full w-48 overflow-hidden rounded-lg"
								src={content.image_url.url}
								alt={content.image_url.url}
							/>
						{/if}
					{/each}
				{/if}
			</span>
		</div>
	{/each}
{/if}
