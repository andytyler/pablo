<script lang="ts">
	import { Layer, Rect, Stage } from 'svelte-konva';
</script>

<Stage config={{ width: window.innerWidth, height: window.innerHeight }}>
	<Layer>
		<Rect config={{ x: 100, y: 100, width: 400, height: 200, fill: 'blue' }} />
		<Rect
			config={{
				x: 400,
				y: 150,
				width: 300,
				height: 300,
				fill: 'red',
				draggable: true
			}}
		/>
	</Layer>
</Stage>
