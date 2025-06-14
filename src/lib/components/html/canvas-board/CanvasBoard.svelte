<script lang="ts">
	import { browser } from '$app/environment';
	import type {
		DragEvent as InteractDragEvent,
		InteractEvent,
		PointerEvent as InteractPointerEvent,
		ResizeEvent as InteractResizeEvent
	} from '@interactjs/types';
	import interact from 'interactjs';
	import { onMount } from 'svelte';
	import SelectionBox from './SelectionBox.svelte';
	import ZoomControls from './ZoomControls.svelte';

	// Svelte 5 state variables for pan and zoom
	let panX = $state(0);
	let panY = $state(0);
	let zoom = $state(1);

	// Zoom constraints and sensitivity
	const minZoom = 0.1;
	const maxZoom = 5;
	const zoomSensitivity = 0.001;

	// Element references
	let containerElement: HTMLDivElement | undefined = $state();
	let canvasContentElement: HTMLDivElement | undefined = $state();

	// Interactable instances for cleanup
	let panInteraction: Interact.Interactable | null = null;
	let itemsInteraction: Interact.Interactable | null = null;

	// Add style tracking
	let elementStyles = $state(new Map<HTMLElement, Set<string>>());

	// Modify the selectedItemsData type to include styles
	type SelectedItemDataNonNull = {
		element: HTMLElement;
		x: number;
		y: number;
		width: number;
		height: number;
		rotation: number; // Required for rotation support
		styles?: Set<string>;
		zIndex: number; // Added for z-index support
	};
	type SelectedItemData = SelectedItemDataNonNull | null;

	let selectedItemsData: SelectedItemDataNonNull[] = $state([]);

	let isPanning = $state(false);

	// Marquee Selection State
	let isMarqueeSelecting = $state(false);
	let marqueeScreenStart = $state({ x: 0, y: 0 }); // Viewport coordinates
	let marqueeScreenCurrent = $state({ x: 0, y: 0 }); // Viewport coordinates

	let isSpacebarDown = $state(false);

	// Derived state for what the SelectionBox should display and interact with
	let activeSelectionProperties = $derived(
		(() => {
			if (selectedItemsData.length === 0) {
				return null;
			}
			if (selectedItemsData.length === 1) {
				return selectedItemsData[0]; // Includes element, x, y, width, height, rotation
			}

			// Multiple items selected, calculate group bounding box
			let minX = Infinity;
			let minY = Infinity;
			let maxX = -Infinity;
			let maxY = -Infinity;

			for (const item of selectedItemsData) {
				minX = Math.min(minX, item.x);
				minY = Math.min(minY, item.y);
				maxX = Math.max(maxX, item.x + item.width);
				maxY = Math.max(maxY, item.y + item.height);
			}
			return {
				x: minX,
				y: minY,
				width: maxX - minX,
				height: maxY - minY,
				rotation: 0, // Group selection doesn't have rotation yet
				element: null // Explicitly null, as this is a group
			};
		})()
	);

	// Function to initialize a canvas item
	function initializeCanvasItem(element: HTMLElement) {
		// Store original styles before any modifications
		if (!elementStyles.has(element)) {
			const styles = new Set<string>();
			Array.from(element.classList).forEach((cls) => {
				if (
					cls !== 'canvas-item' &&
					cls !== 'selected' &&
					!cls.startsWith('draggable-') &&
					!cls.startsWith('interact-')
				) {
					styles.add(cls);
				}
			});
			elementStyles.set(element, styles);
		}

		// Apply box-sizing first to ensure consistent dimension reading
		element.style.boxSizing = 'border-box';

		// Read positioning data from data attributes (set by AI-generated HTML)
		const initialX = parseFloat(element.dataset.x || '0');
		const initialY = parseFloat(element.dataset.y || '0');
		const initialWidth = parseFloat(
			element.dataset.width || element.offsetWidth.toString() || '100'
		);
		const initialHeight = parseFloat(
			element.dataset.height || element.offsetHeight.toString() || '100'
		);
		const initialRotation = parseFloat(element.dataset.rotation || '0');
		const initialZIndex = parseInt(element.dataset.zIndex || '0', 10);

		// Apply canvas positioning system - convert data attributes to actual positioning
		element.style.position = 'absolute';
		element.style.left = '0';
		element.style.top = '0';
		element.style.width = `${initialWidth}px`;
		element.style.height = `${initialHeight}px`;
		element.style.transformOrigin = '0 0';
		element.style.transform = `translate(${initialX}px, ${initialY}px) rotate(${initialRotation}deg)`;
		element.style.zIndex = initialZIndex.toString();

		// Ensure necessary interaction styles are set
		element.style.touchAction = 'none';
		element.style.userSelect = 'none';

		// Preserve original classes while ensuring canvas-item is present
		const storedStyles = elementStyles.get(element) || new Set();
		let baseClasses = 'canvas-item';
		storedStyles.forEach((s) => (baseClasses += ` ${s}`));
		if (selectedItemsData.find((item) => item.element === element)) {
			// Persist 'selected' if already selected
			baseClasses += ' selected';
		}
		element.className = baseClasses.trim();
	}

	onMount(() => {
		if (!browser || !containerElement || !canvasContentElement) {
			console.warn('CanvasBoard onMount: Missing required elements or not in browser.');
			return;
		}

		// Initialize existing items
		const initialItems = canvasContentElement.querySelectorAll<HTMLElement>('.canvas-item');
		initialItems.forEach(initializeCanvasItem);

		// Observe for dynamically added items
		const observer = new MutationObserver((mutationsList) => {
			for (const mutation of mutationsList) {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === Node.ELEMENT_NODE) {
							const elementNode = node as HTMLElement;
							if (elementNode.matches && elementNode.matches('.canvas-item')) {
								initializeCanvasItem(elementNode);
							}
							// Also check children if a wrapper was added
							elementNode
								.querySelectorAll<HTMLElement>('.canvas-item')
								.forEach(initializeCanvasItem);
						}
					});
				}
			}
		});

		observer.observe(canvasContentElement, { childList: true, subtree: true });

		// Add style update event listener
		canvasContentElement.addEventListener('styleupdate', ((event: CustomEvent) => {
			const { element, styles } = event.detail;
			handleStyleUpdate(element, styles);
		}) as EventListener);

		// Update the click handler to include style management
		const handleContainerClick = (event: MouseEvent) => {
			const targetElement = event.target as HTMLElement;
			if (
				!event.shiftKey && // Only deselect if shift is not pressed
				(targetElement === containerElement ||
					(targetElement === canvasContentElement &&
						!targetElement.closest('.canvas-item') &&
						!targetElement.closest('.selection-box') &&
						!targetElement.closest('.zoom-controls')))
			) {
				if (!isMarqueeSelecting) {
					// Save styles before deselecting
					selectedItemsData.forEach((item) => {
						const styles = new Set(
							Array.from(item.element.classList).filter(
								(cls) => !cls.startsWith('draggable-') && cls !== 'selected'
							)
						);
						elementStyles.set(item.element, styles);
					});
					selectedItemsData = [];
				}
			}
		};
		containerElement.addEventListener('click', handleContainerClick);

		// 1. Panning for the main container
		panInteraction = interact(containerElement)
			.draggable({
				listeners: {
					move(event: InteractDragEvent) {
						if (!isSpacebarDown) {
							// Should not start if spacebar is not down, as draggable should be disabled
							// but as a safeguard / for clarity:
							return;
						}
						panX += event.dx;
						panY += event.dy;
					}
				},
				enabled: isSpacebarDown // Dynamically enable/disable based on spacebar
			})
			.on('dragstart', (event: InteractEvent) => {
				if (!isSpacebarDown) {
					// Should not start if spacebar is not down, as draggable should be disabled
					// but as a safeguard / for clarity:
					return;
				}
				const target = event.target as HTMLElement;
				if (
					target.closest('.canvas-item') ||
					target.closest('.selection-box') ||
					target.closest('.zoom-controls')
				) {
					return;
				}
				isPanning = true;
				containerElement?.classList.add('panning');
			})
			.on('dragend', () => {
				isPanning = false;
				containerElement?.classList.remove('panning');
			})
			.on('down', (event: InteractEvent) => {
				const originalBrowserEvent = (event as any).originalEvent as MouseEvent;
				if (originalBrowserEvent && originalBrowserEvent.button === 2) {
					event.preventDefault();
				}
			})
			.on('dragmove', (event: InteractDragEvent) => {
				// This is where panX and panY are updated by the listener in draggable options
			});

		// 2. Draggable and Resizable items within the canvasContentElement
		itemsInteraction = interact('.canvas-item', { context: canvasContentElement })
			.draggable({
				inertia: true,
				listeners: {
					move: dragMoveListener,
					end: (event: InteractDragEvent) => {
						// if (selectedItemsData.length === 1 && selectedItemsData[0].element === event.target) {
						// 	const target = event.target as HTMLElement;
						// 	// These are already updated by dragMoveListener, so this might be redundant.
						// 	// selectedItemsData[0].x = parseFloat(target.getAttribute('data-x') || '0');
						// 	// selectedItemsData[0].y = parseFloat(target.getAttribute('data-y') || '0');
						// }
						// The main purpose of this 'end' listener for draggable items might be for any
						// final state saving or logging if needed, beyond what dragMoveListener handles.
						// For now, positions are updated reactively by dragMoveListener.
					}
				},
				modifiers: [
					// interact.modifiers.restrictRect({ restriction: null }) // Explicitly no restriction - This was causing a type error
					// An empty array should mean no modifiers are applied, hence no restrictions from here.
				]
			})
			.resizable({
				edges: { left: true, right: true, bottom: true, top: true },
				listeners: {
					move: resizeMoveListener,
					end: (event: InteractResizeEvent) => {
						if (selectedItemsData.length === 1 && selectedItemsData[0].element === event.target) {
							const target = event.target as HTMLElement;
							selectedItemsData[0].x = parseFloat(target.getAttribute('data-x') || '0');
							selectedItemsData[0].y = parseFloat(target.getAttribute('data-y') || '0');
							selectedItemsData[0].width = parseFloat(target.getAttribute('data-width') || '0');
							selectedItemsData[0].height = parseFloat(target.getAttribute('data-height') || '0');
						}
					}
				},
				modifiers: [
					interact.modifiers.restrictSize({
						min: { width: 10, height: 10 }
					}),
					interact.modifiers.aspectRatio({
						ratio: 'preserve',
						modifiers: [interact.modifiers.restrictSize({ min: { width: 10, height: 10 } })],
						enabled: false // We'll handle aspect ratio through event listeners
					})
				],
				inertia: false
			})
			.on('resizestart', (event: InteractEvent & { shiftKey?: boolean }) => {
				if (event.shiftKey && itemsInteraction) {
					// Enable aspect ratio when shift is pressed
					itemsInteraction.resizable({
						modifiers: [
							interact.modifiers.restrictSize({
								min: { width: 10, height: 10 }
							}),
							interact.modifiers.aspectRatio({
								ratio: 'preserve',
								modifiers: [interact.modifiers.restrictSize({ min: { width: 10, height: 10 } })],
								enabled: true
							})
						]
					});
				}
			})
			.on('resizeend', () => {
				if (itemsInteraction) {
					// Reset modifiers after resize
					itemsInteraction.resizable({
						modifiers: [
							interact.modifiers.restrictSize({
								min: { width: 10, height: 10 }
							}),
							interact.modifiers.aspectRatio({
								ratio: 'preserve',
								modifiers: [interact.modifiers.restrictSize({ min: { width: 10, height: 10 } })],
								enabled: false
							})
						]
					});
				}
			})
			.on('tap', (event: InteractPointerEvent) => {
				const target = event.currentTarget as HTMLElement;
				const shiftKey = (event.originalEvent as MouseEvent).shiftKey;

				// Ensure the target is indeed a canvas-item before proceeding
				if (!target.classList.contains('canvas-item')) {
					return;
				}

				// Get stored styles or create empty set
				const storedStyles = elementStyles.get(target) || new Set<string>();

				const newItemData: SelectedItemDataNonNull = {
					element: target,
					x: parseFloat(target.getAttribute('data-x') || '0'),
					y: parseFloat(target.getAttribute('data-y') || '0'),
					width: parseFloat(target.getAttribute('data-width') || target.offsetWidth.toString()),
					height: parseFloat(target.getAttribute('data-height') || target.offsetHeight.toString()),
					rotation: parseFloat(target.getAttribute('data-rotation') || '0'),
					styles: storedStyles,
					zIndex: parseInt(target.getAttribute('data-z-index') || '0', 10)
				};

				if (shiftKey) {
					const index = selectedItemsData.findIndex((item) => item.element === target);
					if (index > -1) {
						// Item is already selected, remove it
						selectedItemsData = selectedItemsData.filter((_, i) => i !== index);
					} else {
						// Item is not selected, add it
						selectedItemsData = [...selectedItemsData, newItemData];
					}
				} else {
					// No shift key, select only this item
					selectedItemsData = [newItemData];
				}

				// Apply stored styles
				target.className = 'canvas-item selected ' + Array.from(storedStyles).join(' ');

				event.stopImmediatePropagation();
			});

		function dragMoveListener(event: InteractDragEvent) {
			const target = event.target as HTMLElement;

			// Only move the target if it is the currently selected item (and only one item is selected).
			if (selectedItemsData.length !== 1 || selectedItemsData[0].element !== target) {
				return;
			}
			const selectedItem = selectedItemsData[0];
			const rotation = selectedItem.rotation || 0;

			const currentX = selectedItem.x;
			const currentY = selectedItem.y;

			const dxCanvas = event.dx / zoom;
			const dyCanvas = event.dy / zoom;

			const newX = currentX + dxCanvas;
			const newY = currentY + dyCanvas;

			target.style.transform = `translate(${newX}px, ${newY}px) rotate(${rotation}deg)`;
			target.setAttribute('data-x', newX.toString());
			target.setAttribute('data-y', newY.toString());

			selectedItem.x = newX;
			selectedItem.y = newY;
		}

		function resizeMoveListener(event: InteractResizeEvent) {
			const target = event.target as HTMLElement;

			if (selectedItemsData.length !== 1 || selectedItemsData[0].element !== target) {
				return; // Do not resize if not the single selected item
			}
			const selectedItem = selectedItemsData[0];
			const rotation = selectedItem.rotation || 0;

			const newWidthCanvas = event.rect.width / zoom;
			const newHeightCanvas = event.rect.height / zoom;

			target.style.width = `${newWidthCanvas}px`;
			target.style.height = `${newHeightCanvas}px`;
			target.setAttribute('data-width', newWidthCanvas.toString());
			target.setAttribute('data-height', newHeightCanvas.toString());

			let x = selectedItem.x;
			let y = selectedItem.y;

			// Convert deltas to canvas space
			const deltaLeftCanvas = (event.deltaRect?.left || 0) / zoom;
			const deltaTopCanvas = (event.deltaRect?.top || 0) / zoom;

			// If the element is rotated, we need to adjust the position based on the rotation
			if (rotation !== 0) {
				const radians = (rotation * Math.PI) / 180;
				const cos = Math.cos(radians);
				const sin = Math.sin(radians);

				// Adjust position based on rotation
				const dx = deltaLeftCanvas;
				const dy = deltaTopCanvas;
				x += dx * cos - dy * sin;
				y += dx * sin + dy * cos;
			} else {
				x += deltaLeftCanvas;
				y += deltaTopCanvas;
			}

			target.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
			target.setAttribute('data-x', x.toString());
			target.setAttribute('data-y', y.toString());

			selectedItem.x = x;
			selectedItem.y = y;
			selectedItem.width = newWidthCanvas;
			selectedItem.height = newHeightCanvas;
		}

		const wheelListener = (event: WheelEvent) => {
			if (!containerElement) return;
			const targetElement = event.target as HTMLElement;
			if (
				targetElement.closest('.selection-box') ||
				targetElement.closest('.zoom-controls') ||
				targetElement.closest('.action-panel-container')
			) {
				return;
			}
			event.preventDefault();

			const rect = containerElement.getBoundingClientRect();
			const offsetX = event.clientX - rect.left;
			const offsetY = event.clientY - rect.top;
			const oldZoom = zoom;
			let newZoomValue = oldZoom - event.deltaY * zoomSensitivity * oldZoom;
			newZoomValue = Math.max(minZoom, Math.min(maxZoom, newZoomValue));
			const mouseXBeforeZoom = (offsetX - panX) / oldZoom;
			const mouseYBeforeZoom = (offsetY - panY) / oldZoom;
			zoom = newZoomValue;
			panX = offsetX - mouseXBeforeZoom * newZoomValue;
			panY = offsetY - mouseYBeforeZoom * newZoomValue;
		};

		containerElement.addEventListener('wheel', wheelListener, { passive: false });

		// --- Marquee Selection Event Handlers ---
		const handleMouseDownOnContainerForMarquee = (event: MouseEvent) => {
			if (event.button !== 0 || !containerElement || isSpacebarDown) return; // Only left-click & no spacebar

			const target = event.target as HTMLElement;
			// Only start marquee if clicking on the container background or canvas content background
			// and not on a draggable item, selection box, or zoom controls.
			if (
				target !== containerElement &&
				target !== canvasContentElement &&
				!(
					canvasContentElement?.contains(target) &&
					target.closest('.canvas-item') === null &&
					target.closest('.selection-box') === null &&
					target.closest('.zoom-controls') === null
				)
			) {
				if (!(target === containerElement || target === canvasContentElement)) {
					return;
				}
			}

			// Prevent conflict with panning if panning is also on left-click without modifiers.
			// Ideally, panning should be changed to require a modifier (e.g., spacebar).
			event.preventDefault();
			event.stopPropagation(); // Attempt to prevent other listeners like pan starting

			isMarqueeSelecting = true;
			marqueeScreenStart = { x: event.clientX, y: event.clientY };
			marqueeScreenCurrent = { x: event.clientX, y: event.clientY };

			document.addEventListener('mousemove', handleMouseMoveGloballyForMarquee);
			document.addEventListener('mouseup', handleMouseUpGloballyForMarquee);
		};

		const handleMouseMoveGloballyForMarquee = (event: MouseEvent) => {
			if (!isMarqueeSelecting) return;
			marqueeScreenCurrent = { x: event.clientX, y: event.clientY };
		};

		const handleMouseUpGloballyForMarquee = (event: MouseEvent) => {
			if (!isMarqueeSelecting || !containerElement || !canvasContentElement) return;

			isMarqueeSelecting = false;
			document.removeEventListener('mousemove', handleMouseMoveGloballyForMarquee);
			document.removeEventListener('mouseup', handleMouseUpGloballyForMarquee);

			const _containerRect = containerElement.getBoundingClientRect();
			const mScreenX1 = Math.min(marqueeScreenStart.x, marqueeScreenCurrent.x);
			const mScreenY1 = Math.min(marqueeScreenStart.y, marqueeScreenCurrent.y);
			const mScreenX2 = Math.max(marqueeScreenStart.x, marqueeScreenCurrent.x);
			const mScreenY2 = Math.max(marqueeScreenStart.y, marqueeScreenCurrent.y);

			// If the marquee is very small, treat it as a click (handled by handleContainerClick)
			if (Math.abs(mScreenX1 - mScreenX2) < 5 && Math.abs(mScreenY1 - mScreenY2) < 5) {
				return;
			}

			const marqueeCanvasX1 = (mScreenX1 - _containerRect.left - panX) / zoom;
			const marqueeCanvasY1 = (mScreenY1 - _containerRect.top - panY) / zoom;
			const marqueeCanvasX2 = (mScreenX2 - _containerRect.left - panX) / zoom;
			const marqueeCanvasY2 = (mScreenY2 - _containerRect.top - panY) / zoom;

			const itemsToSelect: SelectedItemDataNonNull[] = [];
			const draggablesInDOM = canvasContentElement.querySelectorAll<HTMLElement>('.canvas-item');

			draggablesInDOM.forEach((el) => {
				const itemX = parseFloat(el.getAttribute('data-x') || '0');
				const itemY = parseFloat(el.getAttribute('data-y') || '0');
				const itemWidth = parseFloat(el.getAttribute('data-width') || '0');
				const itemHeight = parseFloat(el.getAttribute('data-height') || '0');

				const itemRectCanvas = {
					x1: itemX,
					y1: itemY,
					x2: itemX + itemWidth,
					y2: itemY + itemHeight
				};

				// Check for intersection
				if (
					itemRectCanvas.x1 < marqueeCanvasX2 &&
					itemRectCanvas.x2 > marqueeCanvasX1 &&
					itemRectCanvas.y1 < marqueeCanvasY2 &&
					itemRectCanvas.y2 > marqueeCanvasY1
				) {
					itemsToSelect.push({
						element: el,
						x: itemX,
						y: itemY,
						width: itemWidth,
						height: itemHeight,
						rotation: parseFloat(el.getAttribute('data-rotation') || '0'),
						styles: elementStyles.get(el) || new Set(),
						zIndex: parseInt(el.getAttribute('data-z-index') || '0', 10) // Read z-index
					});
				}
			});

			const shiftKey = event.shiftKey;
			if (shiftKey) {
				const currentSelectedElements = new Set(selectedItemsData.map((item) => item.element));
				const newCombinedSelection = [...selectedItemsData];
				for (const newItem of itemsToSelect) {
					if (!currentSelectedElements.has(newItem.element)) {
						newCombinedSelection.push(newItem);
					}
				}
				selectedItemsData = newCombinedSelection;
			} else {
				selectedItemsData = itemsToSelect;
			}
		};

		// Add mousedown listener for marquee to the container
		containerElement.addEventListener('mousedown', handleMouseDownOnContainerForMarquee);

		// --- Global Key Listeners for Spacebar ---
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === ' ' || event.code === 'Space') {
				isSpacebarDown = true;
			}
		};
		const handleKeyUp = (event: KeyboardEvent) => {
			if (event.key === ' ' || event.code === 'Space') {
				isSpacebarDown = false;
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('keyup', handleKeyUp);

		// Make panning activation reactive to isSpacebarDown
		$effect(() => {
			if (panInteraction && containerElement && !isPanning) {
				panInteraction.draggable({ enabled: isSpacebarDown });
			}
		});

		return () => {
			observer.disconnect(); // Disconnect the observer on cleanup
			if (panInteraction) panInteraction.unset();
			if (itemsInteraction) itemsInteraction.unset();
			if (containerElement) {
				containerElement.removeEventListener('wheel', wheelListener);
				containerElement.removeEventListener('click', handleContainerClick);
				containerElement.removeEventListener('mousedown', handleMouseDownOnContainerForMarquee);
			}
			if (canvasContentElement) {
				canvasContentElement.removeEventListener('styleupdate', ((event: CustomEvent) => {
					const { element, styles } = event.detail;
					handleStyleUpdate(element, styles);
				}) as EventListener);
			}
			// Ensure global listeners are removed if component is destroyed while marquee selecting
			document.removeEventListener('mousemove', handleMouseMoveGloballyForMarquee);
			document.removeEventListener('mouseup', handleMouseUpGloballyForMarquee);
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('keyup', handleKeyUp);
		};
	});

	// Reactive calculation for marquee visual style
	let marqueeVisualRect = $derived(
		(() => {
			if (!isMarqueeSelecting || !containerElement) {
				return { left: 0, top: 0, width: 0, height: 0, display: 'none' };
			}
			const _containerRect = containerElement.getBoundingClientRect();
			const x1 = marqueeScreenStart.x;
			const y1 = marqueeScreenStart.y;
			const x2 = marqueeScreenCurrent.x;
			const y2 = marqueeScreenCurrent.y;

			const left = Math.min(x1, x2) - _containerRect.left;
			const top = Math.min(y1, y2) - _containerRect.top;
			const width = Math.abs(x1 - x2);
			const height = Math.abs(y1 - y2);

			return { left, top, width, height, display: 'block' };
		})()
	);

	function handleElementUpdateFromSelectionBox(detail: {
		dx?: number;
		dy?: number;
		dWidth?: number;
		dHeight?: number;
		dRotation?: number;
	}) {
		if (!activeSelectionProperties) return;

		if (selectedItemsData.length === 1 && activeSelectionProperties.element) {
			// Single item selected - existing logic
			const selectedItem = selectedItemsData[0]; // Should be activeSelectionProperties
			const { element } = selectedItem;
			let { x, y, width, height } = selectedItem;
			let rotation = selectedItem.rotation || 0;

			// Handle position changes
			if (detail.dx !== undefined || detail.dy !== undefined) {
				const dx = detail.dx || 0;
				const dy = detail.dy || 0;
				x += dx;
				y += dy;
			}

			// Handle size changes
			if (detail.dWidth !== undefined || detail.dHeight !== undefined) {
				const dw = detail.dWidth || 0;
				const dh = detail.dHeight || 0;
				width = Math.max(10 / zoom, width + dw);
				height = Math.max(10 / zoom, height + dh);
			}

			// Handle rotation changes
			if (detail.dRotation !== undefined) {
				rotation = (((rotation + detail.dRotation) % 360) + 360) % 360;
			}

			// Update the element
			element.style.transformOrigin = '0 0'; // Ensure top-left pivot
			element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
			element.style.width = `${width}px`;
			element.style.height = `${height}px`;
			element.setAttribute('data-x', x.toString());
			element.setAttribute('data-y', y.toString());
			element.setAttribute('data-width', width.toString());
			element.setAttribute('data-height', height.toString());
			element.setAttribute('data-rotation', rotation.toString());

			// Update the selected item data
			selectedItem.x = x;
			selectedItem.y = y;
			selectedItem.width = width;
			selectedItem.height = height;
			selectedItem.rotation = rotation;

			// Dispatch a styleupdate event if necessary for AttributeEditorPanel to pick up direct manipulations
			const event = new CustomEvent('styleupdate', {
				detail: {
					element: selectedItem.element,
					styles: elementStyles.get(selectedItem.element) || new Set()
				}
			});
			selectedItem.element.dispatchEvent(event);
		} else if (selectedItemsData.length > 1) {
			// Multiple items selected - Group Dragging (Resize and Rotation for group is TBD)
			if (detail.dx || detail.dy) {
				const dxCanvas = detail.dx || 0;
				const dyCanvas = detail.dy || 0;

				selectedItemsData.forEach((item) => {
					item.x += dxCanvas;
					item.y += dyCanvas;
					const rotation = item.rotation || 0;
					item.element.style.transformOrigin = '0 0'; // Ensure top-left pivot for group items too
					item.element.style.transform = `translate(${item.x}px, ${item.y}px) rotate(${rotation}deg)`;
					item.element.setAttribute('data-x', item.x.toString());
					item.element.setAttribute('data-y', item.y.toString());
				});
			}
			// Group Resizing and Rotation logic will go here eventually.
			// For now, dWidth/dHeight/dRotation for groups are ignored.

			// Dispatch styleupdate for all items in group if AttributeEditorPanel needs to react
			selectedItemsData.forEach((item) => {
				const event = new CustomEvent('styleupdate', {
					detail: { element: item.element, styles: elementStyles.get(item.element) || new Set() }
				});
				item.element.dispatchEvent(event);
			});
		}
	}

	// Add function to handle style updates
	function handleStyleUpdate(element: HTMLElement, styles: Set<string>) {
		elementStyles.set(element, styles);
		// Ensure styles are applied to the element
		element.className =
			'canvas-item' +
			(selectedItemsData.find((item) => item.element === element) ? ' selected' : '') +
			' ' +
			Array.from(styles).join(' ');
	}
</script>

<div
	class="canvas-board-container relative h-screen w-screen cursor-default overflow-hidden bg-background {containerElement?.classList.contains(
		'panning'
	)
		? 'panning'
		: ''}"
	class:panning={isPanning}
	bind:this={containerElement}
	style="--zoom-factor: {zoom}; --offset-x: {panX}px; --offset-y: {panY}px;"
>
	<div
		class="absolute h-full w-full"
		bind:this={canvasContentElement}
		style="transform: translate({panX}px, {panY}px) scale({zoom}); transform-origin: 0 0;"
	>
		<slot></slot>

		{#if activeSelectionProperties}
			<SelectionBox
				selectedItem={activeSelectionProperties}
				{zoom}
				onUpdateElement={handleElementUpdateFromSelectionBox}
			/>
		{/if}
	</div>

	{#if marqueeVisualRect.display === 'block' && marqueeVisualRect.width > 0 && marqueeVisualRect.height > 0}
		<div
			class="marquee-box pointer-events-none absolute z-[10000] border border-dashed border-blue-500 bg-blue-100/50"
			style="left: {marqueeVisualRect.left}px; top: {marqueeVisualRect.top}px; width: {marqueeVisualRect.width}px; height: {marqueeVisualRect.height}px;"
		></div>
	{/if}

	<ZoomControls
		bind:zoom
		bind:panX
		bind:panY
		{minZoom}
		{maxZoom}
		defaultZoom={1}
		defaultPanX={0}
		defaultPanY={0}
		bind:isSpacebarDown
	/>

	<!-- <AttributeEditorPanel
		selectedItems={selectedItemsData}
		onStylesUpdate={(element, styles) => {
			elementStyles.set(element, styles);
			handleStyleUpdate(element, styles);
		}}
	/> -->
</div>

<style>
	/* Keep only necessary custom styles that can't be handled by Tailwind */
	.canvas-board-container.panning {
		cursor: grabbing !important;
	}

	.canvas-item.selected {
		outline: 2px solid dodgerblue;
		outline-offset: 1px;
	}

	.canvas-item:hover {
		box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.5);
	}

	.canvas-item:active {
		opacity: 0.9;
		box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.5);
	}

	/* Grid Styles - Keep as is since these are complex CSS variables and patterns */
	.canvas-board-container {
		cursor: default;
		--grid-cell-base-size: 50px;
		--major-grid-multiplier: 10;
		--major-grid-cell-base-size: calc(var(--grid-cell-base-size) * var(--major-grid-multiplier));
		--minor-line-thickness: 1px;
		--major-line-thickness: 2px;
		--minor-line-color: rgba(0, 0, 0, 0.1);
		--major-line-color: rgba(0, 0, 0, 0.15);
		--actual-minor-cell-size: calc(var(--grid-cell-base-size) * var(--zoom-factor, 1));
		--actual-major-cell-size: calc(var(--major-grid-cell-base-size) * var(--zoom-factor, 1));

		background-image:
			repeating-linear-gradient(
				var(--major-line-color) 0 var(--major-line-thickness),
				transparent var(--major-line-thickness) var(--actual-major-cell-size)
			),
			repeating-linear-gradient(
				90deg,
				var(--major-line-color) 0 var(--major-line-thickness),
				transparent var(--major-line-thickness) var(--actual-major-cell-size)
			),
			repeating-linear-gradient(
				var(--minor-line-color) 0 var(--minor-line-thickness),
				transparent var(--minor-line-thickness) var(--actual-minor-cell-size)
			),
			repeating-linear-gradient(
				90deg,
				var(--minor-line-color) 0 var(--minor-line-thickness),
				transparent var(--minor-line-thickness) var(--actual-minor-cell-size)
			);

		background-size:
			var(--actual-major-cell-size) var(--actual-major-cell-size),
			var(--actual-major-cell-size) var(--actual-major-cell-size),
			var(--actual-minor-cell-size) var(--actual-minor-cell-size),
			var(--actual-minor-cell-size) var(--actual-minor-cell-size);

		background-position: var(--offset-x, 0px) var(--offset-y, 0px);
	}
</style>
