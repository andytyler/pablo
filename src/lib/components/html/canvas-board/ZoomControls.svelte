<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Minus, Plus, RotateCcw } from 'lucide-svelte';

	type Props = {
		zoom: number;
		panX: number;
		panY: number;
		minZoom?: number;
		maxZoom?: number;
		defaultZoom?: number;
		defaultPanX?: number;
		defaultPanY?: number;
		zoomFactor?: number;
	};

	// Props that will be bound to the parent's state
	let {
		zoom = $bindable(),
		panX = $bindable(),
		panY = $bindable(),
		minZoom = $bindable(0.1),
		maxZoom = $bindable(5),
		defaultZoom = $bindable(1),
		defaultPanX = $bindable(0),
		defaultPanY = $bindable(0),
		zoomFactor = 1.2
	}: Props = $props();

	// Derived state for display
	let displayZoom = $derived(Math.round(zoom * 100));

	function handleZoomIn() {
		zoom = Math.min(maxZoom, zoom * zoomFactor);
	}

	function handleZoomOut() {
		zoom = Math.max(minZoom, zoom / zoomFactor);
	}

	function handleResetView() {
		zoom = defaultZoom;
		panX = defaultPanX;
		panY = defaultPanY;
	}
</script>

<div
	class="absolute bottom-5 left-5 z-50 flex select-none items-center gap-2 rounded-lg bg-card/30 p-2 font-mono shadow-lg backdrop-blur-sm"
>
	<div class="min-w-[50px] px-3 py-1.5 text-center text-sm text-card-foreground">
		{displayZoom}%
	</div>

	<Button variant="outline" size="icon" onclick={handleZoomIn} aria-label="Zoom In"
		><Plus class="w-4" /></Button
	>
	<Button variant="outline" size="icon" onclick={handleZoomOut} aria-label="Zoom Out"
		><Minus class="w-4" /></Button
	>
	<Button variant="outline" size="icon" onclick={handleResetView} aria-label="Reset View"
		><RotateCcw class="w-4" /></Button
	>
</div>
