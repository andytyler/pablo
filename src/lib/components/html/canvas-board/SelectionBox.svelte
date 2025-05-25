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
	let accentColour = $state('blue');

	// Type for processed edge information
	type EdgeInfo = {
		top?: boolean;
		right?: boolean;
		bottom?: boolean;
		left?: boolean;
	};

	const boxStyle = $derived(() => {
		if (!selectedItem) return 'display: none; pointer-events: none;';
		return `
			position: absolute;
			left: ${selectedItem.x}px;
			top: ${selectedItem.y}px;
			width: ${selectedItem.width}px;
			height: ${selectedItem.height}px;
			transform: rotate(${selectedItem.rotation || 0}deg);
			transform-origin: 0 0;
			border: 1px solid ${accentColour};
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
			// Helper function to detect if the current resize is on a corner
			const isCornerResize = (edges: EdgeInfo) => {
				return (
					(edges.top && edges.left) ||
					(edges.top && edges.right) ||
					(edges.bottom && edges.left) ||
					(edges.bottom && edges.right)
				);
			};

			// Helper function to handle corner resize specifically
			const handleCornerResize = (
				event: InteractResizeEvent,
				edges: EdgeInfo,
				angleRad: number
			) => {
				const cosToLocal = Math.cos(-angleRad);
				const sinToLocal = Math.sin(-angleRad);
				const cosToGlobal = Math.cos(angleRad);
				const sinToGlobal = Math.sin(angleRad);

				const screen_dx = event.dx / zoom; // Pointer movement in canvas units
				const screen_dy = event.dy / zoom;

				// Rotate pointer movement to element's local coordinate system
				const pointer_dx_local = screen_dx * cosToLocal - screen_dy * sinToLocal;
				const pointer_dy_local = screen_dx * sinToLocal + screen_dy * cosToLocal;

				let dWidth = 0;
				let dHeight = 0;
				let dxLocal = 0;
				let dyLocal = 0;

				if (edges.top && edges.left) {
					// Top-left corner
					dWidth = -pointer_dx_local;
					dHeight = -pointer_dy_local;
					dxLocal = pointer_dx_local;
					dyLocal = pointer_dy_local;
				} else if (edges.top && edges.right) {
					// Top-right corner
					dWidth = pointer_dx_local;
					dHeight = -pointer_dy_local;
					dxLocal = 0; // x doesn't change for element's origin
					dyLocal = pointer_dy_local;
				} else if (edges.bottom && edges.left) {
					// Bottom-left corner
					dWidth = -pointer_dx_local;
					dHeight = pointer_dy_local;
					dxLocal = pointer_dx_local;
					dyLocal = 0; // y doesn't change for element's origin
				} else if (edges.bottom && edges.right) {
					// Bottom-right corner
					dWidth = pointer_dx_local;
					dHeight = pointer_dy_local;
					dxLocal = 0; // x,y don't change for element's origin
					dyLocal = 0;
				}

				if (event.shiftKey && selectedItem && selectedItem.width > 0 && selectedItem.height > 0) {
					accentColour = 'green';
					const aspectRatio = selectedItem.width / selectedItem.height;
					const initial_dWidth = dWidth;
					const initial_dHeight = dHeight;

					// Determine dominant axis based on pointer movement in local coordinates
					if (
						Math.abs(pointer_dx_local * selectedItem.height) >
						Math.abs(pointer_dy_local * selectedItem.width)
					) {
						// Horizontal pointer movement is more significant for this aspect ratio
						dWidth = initial_dWidth;
						dHeight = initial_dWidth / aspectRatio; // sign will be consistent
					} else {
						// Vertical pointer movement is more significant (or equal)
						dHeight = initial_dHeight;
						dWidth = initial_dHeight * aspectRatio; // sign will be consistent
					}

					// Recalculate dxLocal, dyLocal for fixed opposite corner
					if (edges.top && edges.left) {
						dxLocal = -dWidth;
						dyLocal = -dHeight;
					} else if (edges.top && edges.right) {
						dxLocal = 0;
						dyLocal = -dHeight;
					} else if (edges.bottom && edges.left) {
						dxLocal = -dWidth;
						dyLocal = 0;
					} else if (edges.bottom && edges.right) {
						dxLocal = 0;
						dyLocal = 0;
					}
				} else {
					accentColour = 'blue';
				}

				// Rotate local translation back to global axes
				const gdx = dxLocal * cosToGlobal - dyLocal * sinToGlobal;
				const gdy = dxLocal * sinToGlobal + dyLocal * cosToGlobal;

				return {
					cdx: gdx,
					cdy: gdy,
					cdw: dWidth,
					cdh: dHeight
				};
			};

			// Helper function to handle edge resize (non-corner)
			const handleEdgeResize = (event: InteractResizeEvent, edges: EdgeInfo, angleRad: number) => {
				const cosToLocal = Math.cos(-angleRad);
				const sinToLocal = Math.sin(-angleRad);
				const cosToGlobal = Math.cos(angleRad);
				const sinToGlobal = Math.sin(angleRad);

				const screen_dx = event.dx / zoom; // Pointer movement in canvas units
				const screen_dy = event.dy / zoom;

				// Rotate pointer movement to element's local coordinate system
				const pointer_dx_local = screen_dx * cosToLocal - screen_dy * sinToLocal;
				const pointer_dy_local = screen_dx * sinToLocal + screen_dy * cosToLocal;

				let dWidth = 0;
				let dHeight = 0;
				let dxLocal = 0;
				let dyLocal = 0;

				if (edges.left) {
					dWidth = -pointer_dx_local;
					dxLocal = pointer_dx_local;
				} else if (edges.right) {
					dWidth = pointer_dx_local;
					// dxLocal = 0; // Element's origin x does not change
				}

				if (edges.top) {
					dHeight = -pointer_dy_local;
					dyLocal = pointer_dy_local;
				} else if (edges.bottom) {
					dHeight = pointer_dy_local;
					// dyLocal = 0; // Element's origin y does not change
				}
				// The above logic for dxLocal/dyLocal in non-shift edge resize was slightly off, fixing it for clarity too
				// For left edge: dWidth = -pdx, dxLocal = pdx (Correct)
				// For right edge: dWidth = pdx, dxLocal = 0 (Correct)
				// For top edge: dHeight = -pdy, dyLocal = pdy (Correct)
				// For bottom edge: dHeight = pdy, dyLocal = 0 (Correct)
				// Let's ensure the if/else structure correctly sets dxLocal/dyLocal to 0 when needed.
				if (edges.left) {
					// dWidth = -pointer_dx_local already set
					// dxLocal = pointer_dx_local already set
				} else if (edges.right) {
					// dWidth = pointer_dx_local already set
					dxLocal = 0;
				}

				if (edges.top) {
					// dHeight = -pointer_dy_local already set
					// dyLocal = pointer_dy_local already set
				} else if (edges.bottom) {
					// dHeight = pointer_dy_local already set
					dyLocal = 0;
				}

				if (event.shiftKey && selectedItem && selectedItem.width > 0 && selectedItem.height > 0) {
					accentColour = 'green';
					const aspectRatio = selectedItem.width / selectedItem.height;
					const initial_dWidth = dWidth; // dWidth from non-shift logic
					const initial_dHeight = dHeight; // dHeight from non-shift logic (will be 0 if horizontal, or vice-versa)

					if (edges.left || edges.right) {
						// Horizontal edge resize initiated
						dWidth = initial_dWidth; // This is the primary change
						dHeight = dWidth / aspectRatio;
					} else if (edges.top || edges.bottom) {
						// Vertical edge resize initiated
						dHeight = initial_dHeight; // This is the primary change
						dWidth = dHeight * aspectRatio;
					}

					// Adjust dxLocal, dyLocal for scaling from center
					dxLocal = -dWidth / 2;
					dyLocal = -dHeight / 2;
				} else {
					accentColour = 'blue';
				}

				// Rotate local translation back to global axes
				const gdx = dxLocal * cosToGlobal - dyLocal * sinToGlobal;
				const gdy = dxLocal * sinToGlobal + dyLocal * cosToGlobal;

				return {
					cdx: gdx,
					cdy: gdy,
					cdw: dWidth,
					cdh: dHeight
				};
			};

			// Resizable interaction setup
			resizeInteractable = interact(boundingBoxElement).resizable({
				edges: {
					top: '.resize-handle.t, .resize-handle.tr, .resize-handle.tl',
					bottom: '.resize-handle.b, .resize-handle.br, .resize-handle.bl',
					left: '.resize-handle.l, .resize-handle.tl, .resize-handle.bl',
					right: '.resize-handle.r, .resize-handle.tr, .resize-handle.br'
				},
				listeners: {
					move(event: InteractResizeEvent) {
						if (!selectedItem) return;

						const eventEdges = event.edges || {};
						const currentActiveEdges: EdgeInfo = {
							top: !!eventEdges.top,
							left: !!eventEdges.left,
							bottom: !!eventEdges.bottom,
							right: !!eventEdges.right
						};

						const angleRad = ((selectedItem.rotation || 0) * Math.PI) / 180;

						// Choose the appropriate handler based on whether it's a corner or edge resize
						const resizeResult = isCornerResize(currentActiveEdges)
							? handleCornerResize(event, currentActiveEdges, angleRad)
							: handleEdgeResize(event, currentActiveEdges, angleRad);

						const { cdx, cdy, cdw, cdh } = resizeResult;

						// Apply the changes if they are significant
						if (cdw !== 0 || cdh !== 0 || cdx !== 0 || cdy !== 0) {
							onUpdateElement({ dx: cdx, dy: cdy, dWidth: cdw, dHeight: cdh });
						}
					}
				},
				modifiers: [
					// interact.modifiers.restrictSize({ min: { width: 200 / zoom, height: 200 / zoom } })
				],
				inertia: false
			});

			// Draggable interaction for the selection box
			dragInteractable = interact(boundingBoxElement).draggable({
				listeners: {
					move(event: InteractDragEvent) {
						if (!selectedItem) return;

						// Handle rotation for dragging - adjust movement based on rotation
						// const angleRad = ((selectedItem.rotation || 0) * Math.PI) / 180;
						let dx = event.dx / zoom;
						let dy = event.dy / zoom;

						// If there's rotation, we don't need to transform the movement vectors
						// because dragging should follow screen coordinates

						if (dx !== 0 || dy !== 0) {
							onUpdateElement({ dx, dy });
						}
					}
				},
				inertia: true
				// Removing modifiers to prevent potential conflict with item dragging
				// modifiers: [
				// 	interact.modifiers.restrict({
				// 		restriction: 'parent',
				// 		endOnly: true
				// 	})
				// ]
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

							// Calculate center with more precision
							const screenCenterX = rect.left + rect.width / 2;
							const screenCenterY = rect.top + rect.height / 2;

							// Calculate current angle from center to pointer
							const currentAngle =
								(Math.atan2(event.clientY - screenCenterY, event.clientX - screenCenterX) * 180) /
								Math.PI;

							// Calculate rotation change
							let deltaRotationFromStart = currentAngle - startAngle;
							let newTargetRotationDeg = (startRotation + deltaRotationFromStart) % 360;

							// Normalize to 0-360
							if (newTargetRotationDeg < 0) newTargetRotationDeg += 360;

							// Enhanced snap behavior with more common angles
							const snapThreshold = 5; // Maintained for non-shift snapping
							const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315];

							if (event.shiftKey) {
								accentColour = 'red';
								// If Shift is pressed, find the absolutely closest snap angle
								let minAngularDifference = Infinity;
								let closestSnapAngle = newTargetRotationDeg;

								for (const angle of snapAngles) {
									const diff = Math.abs(newTargetRotationDeg - angle);
									// Consider wrap-around distance (e.g., 350deg is 10deg away from 0deg)
									const angularDifference = Math.min(diff, 360 - diff);

									if (angularDifference < minAngularDifference) {
										minAngularDifference = angularDifference;
										closestSnapAngle = angle;
									}
								}
								newTargetRotationDeg = closestSnapAngle;
							} else {
								accentColour = 'blue';
								// Snapping logic if Shift is NOT pressed, with improved diff calculation
								const closestSnap = snapAngles.find((snap) => {
									const diff = Math.abs(newTargetRotationDeg - snap);
									const effectiveDiff = Math.min(diff, 360 - diff); // Correctly handles wrap-around
									return effectiveDiff < snapThreshold;
								});

								if (closestSnap !== undefined) {
									newTargetRotationDeg = closestSnap;
								}
							}

							const actualDeltaRotation = newTargetRotationDeg - (selectedItem.rotation || 0);

							if (actualDeltaRotation !== 0) {
								const currentX = selectedItem.x;
								const currentY = selectedItem.y;
								const currentW = selectedItem.width;
								const currentH = selectedItem.height;
								const currentRotationDeg = selectedItem.rotation || 0;
								const currentRotationRad = currentRotationDeg * (Math.PI / 180);

								const newTargetRotationRad = newTargetRotationDeg * (Math.PI / 180);

								// Calculate current global center (canvas coordinates)
								// Pivot for CSS transform is (currentX, currentY) due to transform-origin: 0 0
								const unrotatedCenterXRel = currentW / 2;
								const unrotatedCenterYRel = currentH / 2;

								const globalCenterX =
									currentX +
									unrotatedCenterXRel * Math.cos(currentRotationRad) -
									unrotatedCenterYRel * Math.sin(currentRotationRad);
								const globalCenterY =
									currentY +
									unrotatedCenterXRel * Math.sin(currentRotationRad) +
									unrotatedCenterYRel * Math.cos(currentRotationRad);

								// Calculate the new top-left position (canvas coordinates) that would keep the global center invariant
								// when rotating to newTargetRotationRad around this new top-left.
								const newTopLeftX =
									globalCenterX -
									(unrotatedCenterXRel * Math.cos(newTargetRotationRad) -
										unrotatedCenterYRel * Math.sin(newTargetRotationRad));
								const newTopLeftY =
									globalCenterY -
									(unrotatedCenterXRel * Math.sin(newTargetRotationRad) +
										unrotatedCenterYRel * Math.cos(newTargetRotationRad));

								const dxForUpdate = newTopLeftX - currentX;
								const dyForUpdate = newTopLeftY - currentY;

								onUpdateElement({
									dx: dxForUpdate,
									dy: dyForUpdate,
									dRotation: actualDeltaRotation
								});
							}
						}
					},
					inertia: false,
					modifiers: [
						// Optional but can be useful for precision
						interact.modifiers.restrict({
							restriction: 'parent',
							endOnly: true
						})
					]
				});
			}
		}

		return () => {
			if (resizeInteractable) resizeInteractable.unset();
			if (dragInteractable) dragInteractable.unset();
			if (rotateInteractable) rotateInteractable.unset();
			accentColour = 'blue';
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
				border: 1px solid ${accentColour};
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
				border: 1px solid ${accentColour};
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
				border: 1px solid ${accentColour};
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
				border: 1px solid ${accentColour};
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
				border: 1px solid ${accentColour};
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
				border: 1px solid ${accentColour};
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
				border: 1px solid ${accentColour};
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
				border: 1px solid ${accentColour};
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
				border: 1px solid ${accentColour};
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
		background-color: accentColour;
		border-color: white;
	}

	.rotate-handle:active {
		cursor: grabbing;
	}

	.rotate-handle:hover {
		background-color: accentColour;
		border-color: white;
		cursor: grab;
	}
</style>
