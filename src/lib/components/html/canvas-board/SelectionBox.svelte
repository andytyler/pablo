<script lang="ts">
	import type {
		DragEvent as InteractDragEvent,
		ResizeEvent as InteractResizeEvent
	} from '@interactjs/types';
	import interact from 'interactjs';
	// import { onMount, onDestroy, derived, effect } from 'svelte'; // Not needed in Svelte 5 runes mode for derived/effect

	// Props type definition
	interface SelectedItemType {
		element?: HTMLElement | null;
		x: number;
		y: number;
		width: number;
		height: number;
		rotation: number; // Added for rotation support
	}

	interface $$Props {
		selectedItem: SelectedItemType | null;
		zoom: number;
		onUpdateElement: (detail: {
			dx?: number;
			dy?: number;
			dWidth?: number;
			dHeight?: number;
			dRotation?: number; // Added for rotation updates
		}) => void;
	}
	let { selectedItem, zoom, onUpdateElement }: $$Props = $props();

	let boundingBoxElement: HTMLDivElement | undefined = $state();
	let resizeInteractable: Interact.Interactable | null = null;
	let dragInteractable: Interact.Interactable | null = null; // For dragging the selection box
	let rotateInteractable: Interact.Interactable | null = null; // Added for rotation
	let startAngle = $state(0);
	let startRotation = $state(0);

	const boxStyle = $derived(() => {
		if (!selectedItem) return 'display: none; pointer-events: none;';
		return `
			position: absolute;
			left: ${selectedItem.x}px;
			top: ${selectedItem.y}px;
			width: ${selectedItem.width}px;
			height: ${selectedItem.height}px;
			transform: rotate(${selectedItem.rotation || 0}deg);
			transform-origin: center center;
			border: 1px solid #007bff;
			box-sizing: border-box;
			pointer-events: auto;
			touch-action: none;
			cursor: move;
		`;
	});

	const handleSizeScreen = 8; // Desired screen size of handles in px
	let handleSizeCanvas = $derived(handleSizeScreen / zoom); // Actual size in canvas space
	const rotateHandleOffset = $derived(30 / zoom); // Distance of rotation handle from element

	$effect(() => {
		if (resizeInteractable) {
			resizeInteractable.unset();
			resizeInteractable = null;
		}
		if (dragInteractable) {
			dragInteractable.unset();
			dragInteractable = null;
		}
		if (rotateInteractable) {
			rotateInteractable.unset();
			rotateInteractable = null;
		}

		if (boundingBoxElement && selectedItem) {
			// Resizable interaction setup
			resizeInteractable = interact(boundingBoxElement).resizable({
				// only trigger resize when dragging the actual handles
				edges: {
					top: '.resize-handle.t, .resize-handle.tr, .resize-handle.tl',
					bottom: '.resize-handle.b, .resize-handle.br, .resize-handle.bl',
					left: '.resize-handle.l, .resize-handle.tl, .resize-handle.bl',
					right: '.resize-handle.r, .resize-handle.tr, .resize-handle.br'
				},
				listeners: {
					move(event: InteractResizeEvent) {
						if (!selectedItem) return;
						const dr = event.deltaRect || { left: 0, top: 0, width: 0, height: 0 };

						// current rotation in radians
						const angleRad = ((selectedItem.rotation || 0) * Math.PI) / 180;
						const cos = Math.cos(-angleRad);
						const sin = Math.sin(-angleRad);

						// extract the raw pointer movement at the active handle
						const px = event.edges?.left ? dr.left : event.edges?.right ? dr.width : 0;
						const py = event.edges?.top ? dr.top : event.edges?.bottom ? dr.height : 0;

						// project that movement into the element's local axes
						const localX = px * cos - py * sin;
						const localY = px * sin + py * cos;

						// compute size (dWidth, dHeight) and positional (dx, dy) changes in local space
						const dWidth = event.edges?.left ? -localX : event.edges?.right ? localX : 0;
						const dHeight = event.edges?.top ? -localY : event.edges?.bottom ? localY : 0;
						const dx = event.edges?.left ? localX : 0;
						const dy = event.edges?.top ? localY : 0;

						// convert back to canvas space
						const cdx = dx / zoom;
						const cdy = dy / zoom;
						const cdw = dWidth / zoom;
						const cdh = dHeight / zoom;

						// only trigger update if anything changed
						if (cdw !== 0 || cdh !== 0 || cdx !== 0 || cdy !== 0) {
							onUpdateElement({ dWidth: cdw, dHeight: cdh, dx: cdx, dy: cdy });
						}
					}
				},
				modifiers: [
					interact.modifiers.restrictSize({
						min: { width: 20 / zoom, height: 20 / zoom }
					})
				],
				inertia: false
			});

			// Draggable interaction for the selection box
			dragInteractable = interact(boundingBoxElement).draggable({
				listeners: {
					move(event: InteractDragEvent) {
						const dx = event.dx / zoom;
						const dy = event.dy / zoom;
						if (dx !== 0 || dy !== 0) {
							onUpdateElement({ dx, dy });
						}
					}
				},
				inertia: true
			});

			// Rotation interaction
			const rotateHandle = boundingBoxElement.querySelector('.rotate-handle') as HTMLElement;
			if (rotateHandle) {
				rotateInteractable = interact(rotateHandle).draggable({
					listeners: {
						start(event: InteractDragEvent) {
							if (!selectedItem || !boundingBoxElement) return;
							const rect = boundingBoxElement.getBoundingClientRect();
							const centerX = rect.left + rect.width / 2;
							const centerY = rect.top + rect.height / 2;

							// Store the start angle and current rotation
							startAngle =
								(Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
							startRotation = selectedItem.rotation || 0;
						},
						move(event: InteractDragEvent) {
							if (!selectedItem || !boundingBoxElement) return;
							const rect = boundingBoxElement.getBoundingClientRect();
							const centerX = rect.left + rect.width / 2;
							const centerY = rect.top + rect.height / 2;

							// Calculate current angle
							const currentAngle =
								(Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;

							// Calculate rotation change
							let deltaRotation = currentAngle - startAngle;
							let newRotation = (startRotation + deltaRotation) % 360;

							// Normalize to 0-360
							if (newRotation < 0) newRotation += 360;

							// Snap to common angles (0, 90, 180, 270) when close
							const snapThreshold = 5;
							const snapAngles = [0, 90, 180, 270];
							const closestSnap = snapAngles.find(
								(snap) => Math.abs((newRotation - snap + 360) % 360) < snapThreshold
							);

							if (closestSnap !== undefined) {
								newRotation = closestSnap;
							}

							const dRotation = newRotation - (selectedItem.rotation || 0);
							if (dRotation !== 0) {
								onUpdateElement({ dRotation });
							}
						}
					},
					inertia: false
				});
			}
		}

		return () => {
			if (resizeInteractable) resizeInteractable.unset();
			if (dragInteractable) dragInteractable.unset();
			if (rotateInteractable) rotateInteractable.unset();
		};
	});
</script>

{#if selectedItem}
	<div
		bind:this={boundingBoxElement}
		class="selection-box"
		style={boxStyle()}
		data-testid="selection-box"
	>
		<!-- Resize Handles -->
		<div
			class="resize-handle tl"
			style="
				width: {handleSizeCanvas}px;
				height: {handleSizeCanvas}px;
				position: absolute;
				top: -{handleSizeCanvas / 2}px;
				left: -{handleSizeCanvas / 2}px;
				cursor: nwse-resize;
				background-color: white;
				border: 1px solid #007bff;
				border-radius: 50%;
				pointer-events: auto;
				z-index: 10;
			"
		></div>
		<div
			class="resize-handle t"
			style="
				width: {handleSizeCanvas}px;
				height: {handleSizeCanvas}px;
				position: absolute;
				top: -{handleSizeCanvas / 2}px;
				left: calc(50% - {handleSizeCanvas / 2}px);
				cursor: ns-resize;
				background-color: white;
				border: 1px solid #007bff;
				border-radius: 50%;
				pointer-events: auto;
				z-index: 10;
			"
		></div>
		<div
			class="resize-handle tr"
			style="
				width: {handleSizeCanvas}px;
				height: {handleSizeCanvas}px;
				position: absolute;
				top: -{handleSizeCanvas / 2}px;
				right: -{handleSizeCanvas / 2}px;
				cursor: nesw-resize;
				background-color: white;
				border: 1px solid #007bff;
				border-radius: 50%;
				pointer-events: auto;
				z-index: 10;
			"
		></div>
		<div
			class="resize-handle l"
			style="
				width: {handleSizeCanvas}px;
				height: {handleSizeCanvas}px;
				position: absolute;
				top: calc(50% - {handleSizeCanvas / 2}px);
				left: -{handleSizeCanvas / 2}px;
				cursor: ew-resize;
				background-color: white;
				border: 1px solid #007bff;
				border-radius: 50%;
				pointer-events: auto;
				z-index: 10;
			"
		></div>
		<div
			class="resize-handle r"
			style="
				width: {handleSizeCanvas}px;
				height: {handleSizeCanvas}px;
				position: absolute;
				top: calc(50% - {handleSizeCanvas / 2}px);
				right: -{handleSizeCanvas / 2}px;
				cursor: ew-resize;
				background-color: white;
				border: 1px solid #007bff;
				border-radius: 50%;
				pointer-events: auto;
				z-index: 10;
			"
		></div>
		<div
			class="resize-handle bl"
			style="
				width: {handleSizeCanvas}px;
				height: {handleSizeCanvas}px;
				position: absolute;
				bottom: -{handleSizeCanvas / 2}px;
				left: -{handleSizeCanvas / 2}px;
				cursor: nesw-resize;
				background-color: white;
				border: 1px solid #007bff;
				border-radius: 50%;
				pointer-events: auto;
				z-index: 10;
			"
		></div>
		<div
			class="resize-handle b"
			style="
				width: {handleSizeCanvas}px;
				height: {handleSizeCanvas}px;
				position: absolute;
				bottom: -{handleSizeCanvas / 2}px;
				left: calc(50% - {handleSizeCanvas / 2}px);
				cursor: ns-resize;
				background-color: white;
				border: 1px solid #007bff;
				border-radius: 50%;
				pointer-events: auto;
				z-index: 10;
			"
		></div>
		<div
			class="resize-handle br"
			style="
				width: {handleSizeCanvas}px;
				height: {handleSizeCanvas}px;
				position: absolute;
				bottom: -{handleSizeCanvas / 2}px;
				right: -{handleSizeCanvas / 2}px;
				cursor: nwse-resize;
				background-color: white;
				border: 1px solid #007bff;
				border-radius: 50%;
				pointer-events: auto;
				z-index: 10;
			"
		></div>

		<!-- Rotation Handle -->
		<div
			class="rotate-handle"
			style="
				position: absolute;
				top: -{rotateHandleOffset}px;
				left: calc(50% - {handleSizeCanvas / 2}px);
				width: {handleSizeCanvas}px;
				height: {handleSizeCanvas}px;
				background-color: white;
				border: 1px solid #007bff;
				border-radius: 50%;
				cursor: grab;
				pointer-events: auto;
				z-index: 11;
			"
		></div>
	</div>
{/if}

<style>
	.resize-handle:hover {
		background-color: #007bff;
		border-color: white;
	}

	.rotate-handle:active {
		cursor: grabbing;
	}

	.rotate-handle:hover {
		background-color: #007bff;
		border-color: white;
		cursor: grab;
	}
</style>
