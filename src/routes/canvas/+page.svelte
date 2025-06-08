<script lang="ts">
	import CanvasBoard from '$lib/components/html/canvas-board/CanvasBoard.svelte';
	import HtmlRenderer from './../../lib/components/html/HtmlRenderer.svelte';
	import ActionPanel from './../../lib/components/html/canvas-board/panels/ActionPanelContainer.svelte';
</script>

<CanvasBoard>
	<HtmlRenderer />
</CanvasBoard>

<ActionPanel />
