<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';

	let { children } = $props();
</script>

<ModeWatcher />
<div class="min-h-screen bg-background text-foreground">
	{@render children()}
</div>
