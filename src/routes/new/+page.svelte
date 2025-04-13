<script lang="ts">
	import Artboard from '$lib/components/artboard/Artboard.svelte';
	import AssistantPanel from '$lib/components/chat/AssistantPanel.svelte';
	// Import Lucide icons
	// Import the HTML store

	// Type definitions to match JSDoc in shapes.js
	interface Rectangle {
		type: 'rectangle';
		x: number;
		y: number;
		width: number;
		height: number;
	}

	interface Circle {
		type: 'circle';
		x: number;
		y: number;
		radius: number;
	}

	interface TextBox {
		type: 'text';
		x: number;
		y: number;
		width: number;
		height: number;
		text: string;
		fontFamily: string;
		fontSize: number;
		textAlign: string;
		fontWeight: string;
		fontStyle: string;
		color: string;
	}

	type Shape = Rectangle | Circle | TextBox;

	// Font options
	const fontFamilies = [
		'Arial, sans-serif',
		'Helvetica, sans-serif',
		'Georgia, serif',
		'Times New Roman, serif',
		'Courier New, monospace',
		'Verdana, sans-serif'
	];

	const textAlignOptions = ['left', 'center', 'right'];
	const fontWeightOptions = ['normal', 'bold'];
	const fontStyleOptions = ['normal', 'italic'];

	// Design board state
	let canvasWidth = $state(500);
	let canvasHeight = $state(700);
</script>

<div class="flex h-screen w-screen flex-1 flex-row overflow-hidden">
	<!-- Design canvas with artboard controls -->
	<div class="relative flex flex-1 flex-row">
		<!-- Artboard size controls -->
		<div
			class="absolute left-1/2 top-0 z-10 m-2 mx-auto flex flex-row justify-center gap-4 self-center rounded-full bg-card px-12 py-2 shadow-md backdrop-blur-sm"
		>
			<div class="flex items-center gap-2">
				<label for="canvas-width" class="text-sm text-muted-foreground">Width:</label>
				<input
					id="canvas-width"
					type="number"
					bind:value={canvasWidth}
					class="w-20 rounded-md border px-2 py-1 text-sm"
				/>
			</div>
			<div class="flex items-center gap-2">
				<label for="canvas-height" class="text-sm text-muted-foreground">Height:</label>
				<input
					id="canvas-height"
					type="number"
					bind:value={canvasHeight}
					class="w-20 rounded-md border px-2 py-1 text-sm"
				/>
			</div>
		</div>

		<!-- Artboard  -->
		<Artboard {canvasWidth} {canvasHeight} />

		<!-- Design Assistant - Integrated into main UI -->
		<div class="w-1/4 border-l">
			<AssistantPanel canvasSelector="#design-canvas" {canvasWidth} {canvasHeight} />
		</div>
	</div>
</div>
