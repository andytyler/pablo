<script lang="ts">
	import { cn } from '$lib/utils';

	interface $$Props {
		class?: string;
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		rows?: number;
	}

	export let value: string = '';
	export let placeholder: string = '';
	export let disabled: boolean = false;
	export let required: boolean = false;
	export let rows: number = 3;
</script>

<textarea
	class={cn(
		'flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		$$props.class
	)}
	bind:value
	{placeholder}
	{disabled}
	{required}
	{rows}
	{...$$restProps}
/>
