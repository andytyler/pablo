<script lang="ts">
	import CanvasBoard from '$lib/components/html/canvas-board/CanvasBoard.svelte';
</script>

<CanvasBoard>
	<div
		class="canvas-item bg-blue-300 p-4"
		data-x="10"
		data-y="20"
		data-width="200"
		data-height="150"
		data-rotation="0"
	>
		My Dynamic Item 1
	</div>
	<div
		class="canvas-item bg-green-300 p-2"
		data-x="250"
		data-y="100"
		data-width="100"
		data-height="100"
		data-rotation="45"
		style="border-radius: 50%;"
	>
		My Dynamic Item 2
	</div>
</CanvasBoard>
