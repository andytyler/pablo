<script lang="ts">
	import type { Message } from '$lib/types';
	import InfoIcon from '@lucide/svelte/icons/info';

	let { message }: { message: Message } = $props();
</script>

{#if message.chat_role === 'user'}
	<!-- User or Assistant message style -->
	<div class="flex flex-col {message.chat_role === 'user' ? 'items-end' : 'items-start'}">
		<div
			class="max-w-[85%] rounded-lg p-3 {message.chat_role === 'user'
				? 'bg-primary text-primary-foreground'
				: 'bg-muted'}"
		>
			{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
		</div>
		<div
			class="mt-1 flex items-center gap-2 text-xs text-muted-foreground {message.chat_role ===
			'user'
				? 'justify-end'
				: ''}"
		>
			<span>{message.chat_role === 'user' ? 'You' : 'AI Assistant'}</span>
			<span>•</span>
			<span>{message.timestamp.toLocaleString()}</span>
		</div>
	</div>{/if}

{#if message.chat_role === 'assistant'}
	<div class="flex flex-col items-start">
		<span class="text-xs">
			{message.content[0].type === 'text'
				? message.content[0].text
				: JSON.stringify(message.content)}
		</span>
	</div>
{/if}

{#if message.chat_role === 'system'}
	<!-- System message style -->
	<div class="flex flex-col items-center">
		<div class="max-w-[85%] rounded-lg bg-gray-100 p-1 text-center dark:bg-gray-600">
			<div class="flex items-center justify-center gap-1">
				<InfoIcon class="h-4 w-4" />
				<span class="text-xs">
					{message.content[0].type === 'text'
						? message.content[0].text
						: JSON.stringify(message.content)}
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

{#if message.chat_role === 'info'}
	<div class="flex flex-col items-center">
		<span class="text-xs">
			{message.content[0].type === 'text'
				? message.content[0].text
				: JSON.stringify(message.content)}
		</span>
	</div>
{/if}
{#if message.chat_role === 'error'}
	<div class="flex flex-col items-center">
		<span class="text-xs">
			{message.content[0].type === 'text'
				? message.content[0].text
				: JSON.stringify(message.content)}
		</span>
	</div>
{/if}
{#if message.chat_role === 'image'}
	<div class="flex flex-col items-center">
		<span class="text-xs">
			{message.content[0].type === 'image_url'
				? message.content[0].image_url.url
				: JSON.stringify(message.content)}
		</span>
	</div>
{/if}
