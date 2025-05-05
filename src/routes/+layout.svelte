<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';

	let { children } = $props();

	import { onMount } from 'svelte';

	onMount(() => {
		const link = document.createElement('link');
		link.href = 'https://pagecdn.io/lib/easyfonts/fonts.css';
		link.rel = 'stylesheet';
		document.head.appendChild(link);
	});
</script>

<ModeWatcher />
<div class="min-h-screen bg-background text-foreground">
	{@render children()}
</div>
