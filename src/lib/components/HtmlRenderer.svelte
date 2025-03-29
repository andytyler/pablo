<script lang="ts">
	// Component to render HTML content directly in the design artboard
	// This will accept HTML string and display it in a container

	// Use $props() for Svelte 5
	let { htmlContent = '', width = '100%', height = '100%', containerClass = '' } = $props();
</script>

<div class="html-renderer {containerClass}" style:width style:height>
	{@html htmlContent}
</div>

<style>
	.html-renderer {
		position: relative;
		overflow: auto;
	}
</style>
