<script lang="ts">
	import { artboardStore } from '$lib/stores/artboard-store.svelte';
	import * as fabric from 'fabric';
	import { onMount } from 'svelte';
	// Assumed correct path based on previous context
	import type { StructuredDesignProcessedImageItems } from '../../../routes/api/generate-design/step1/design'; // Adjusted path

	import {
		convertFabricObjectsToStructuredDesignProcessedImageItems,
		convertStructuredDesignProcessedImageItemsToFabricObjects
	} from '$lib/connections/fabric';

	// --- Svelte 5 State ---
	let pabloJsonInStore = $derived(artboardStore.image_enriched_design_json);
	let fabricJsonForCanvas = $derived(
		convertStructuredDesignProcessedImageItemsToFabricObjects(
			artboardStore.image_enriched_design_json ?? { items: [] }
		)
	);

	// Local state for the textarea, initialized and kept in sync with the store's Pablo JSON
	let editableJsonText = $state('');

	let canvasEl: HTMLCanvasElement;
	let fabricCanvas: fabric.Canvas;
	let isLoadingFromJson = $state(false); // Flag to prevent re-entrancy and update loops

	// Helper to update the store
	function updateStoreWithPabloJson(newPabloJson: StructuredDesignProcessedImageItems | null) {
		// Avoid updating if the new JSON is the same as what's already in store (string comparison for simplicity)
		// This helps prevent potential infinite loops if conversion functions aren't perfectly idempotent or if updates are rapid.
		if (JSON.stringify(artboardStore.image_enriched_design_json) !== JSON.stringify(newPabloJson)) {
			// console.log("Updating store with new Pablo JSON:", newPabloJson);
			artboardStore.image_enriched_design_json = newPabloJson;
		}
	}

	onMount(() => {
		if (canvasEl) {
			fabricCanvas = new fabric.Canvas(canvasEl, {
				width: artboardStore.artboard_width || 600, // Use store's dimensions
				height: artboardStore.artboard_height || 1000, // Use store's dimensions
				backgroundColor: '#f0f0f0' // Neutral background
			});

			// Initial load is handled by the $effect watching fabricJsonForCanvas

			// Listen for canvas modifications by user
			fabricCanvas.on('object:modified', updateStoreFromCanvas);
			fabricCanvas.on('object:added', updateStoreFromCanvas);
			fabricCanvas.on('object:removed', updateStoreFromCanvas);
			// Consider other events like 'object:scaled', 'object:rotated', 'object:skewed' if needed
		}

		return () => {
			if (fabricCanvas) {
				fabricCanvas.dispose();
			}
		};
	});

	// Effect to synchronize pabloJsonInStore (from artboardStore) to editableJsonText (textarea)
	$effect(() => {
		const newText = JSON.stringify(artboardStore.image_enriched_design_json, null, 2);
		if (editableJsonText !== newText) {
			// console.log("Syncing store JSON to textarea")
			editableJsonText = newText;
		}
	});

	// Effect to load/reload canvas when fabricJsonForCanvas (derived from store) changes
	$effect(() => {
		if (fabricCanvas && fabricJsonForCanvas && !isLoadingFromJson) {
			const currentCanvasJsonString = JSON.stringify(fabricCanvas.toJSON());
			const newJsonToLoadString = JSON.stringify(fabricJsonForCanvas);

			if (currentCanvasJsonString !== newJsonToLoadString) {
				// console.log("fabricJsonForCanvas changed, preparing to reload canvas:", fabricJsonForCanvas);
				loadJsonToCanvas(fabricJsonForCanvas);
			}
		}
	});

	function loadJsonToCanvas(jsonToLoad: any) {
		if (!fabricCanvas || !jsonToLoad) {
			console.warn('loadJsonToCanvas: Canvas not ready or no JSON to load.', jsonToLoad);
			return;
		}
		if (isLoadingFromJson) {
			// console.log("loadJsonToCanvas: Already loading, skipping.");
			return;
		}

		isLoadingFromJson = true;
		// console.log("loadJsonToCanvas: Starting to load JSON", jsonToLoad);

		// Detach listeners to prevent them from firing during the load operation
		fabricCanvas.off('object:modified', updateStoreFromCanvas);
		fabricCanvas.off('object:added', updateStoreFromCanvas);
		fabricCanvas.off('object:removed', updateStoreFromCanvas);

		try {
			// Ensure we pass a plain object to Fabric.js
			const plainJsonToLoad = JSON.parse(JSON.stringify(jsonToLoad));

			fabricCanvas.loadFromJSON(plainJsonToLoad, () => {
				fabricCanvas.renderAll();
				// console.log("loadJsonToCanvas: Successfully loaded and rendered.");

				// After loading, Fabric.js might normalize the JSON.
				// We should convert this normalized version back to Pablo format and update the store
				// IF it's different from what we intended to load.
				const normalizedFabricJson = fabricCanvas.toJSON();
				if (JSON.stringify(normalizedFabricJson) !== JSON.stringify(plainJsonToLoad)) {
					// console.log("loadJsonToCanvas: Canvas JSON normalized. Updating store.");
					const normalizedPabloJson =
						convertFabricObjectsToStructuredDesignProcessedImageItems(normalizedFabricJson);
					updateStoreWithPabloJson(normalizedPabloJson);
				}

				// Re-attach listeners
				fabricCanvas.on('object:modified', updateStoreFromCanvas);
				fabricCanvas.on('object:added', updateStoreFromCanvas);
				fabricCanvas.on('object:removed', updateStoreFromCanvas);
				isLoadingFromJson = false;
			});
		} catch (error) {
			console.error('Error in loadJsonToCanvas (loadFromJSON or subsequent logic):', error);
			// Ensure listeners are re-attached and flag is reset even on error
			fabricCanvas.on('object:modified', updateStoreFromCanvas);
			fabricCanvas.on('object:added', updateStoreFromCanvas);
			fabricCanvas.on('object:removed', updateStoreFromCanvas);
			isLoadingFromJson = false;
		}
	}

	// Called when Fabric.js canvas is visually modified by the user
	function updateStoreFromCanvas() {
		if (isLoadingFromJson) {
			// console.log("updateStoreFromCanvas: isLoadingFromJson is true, skipping update to prevent loop during load.");
			return; // Don't update store if changes are due to programmatic loading
		}
		if (fabricCanvas) {
			// console.log("updateStoreFromCanvas: Canvas modified by user, updating store.");
			const currentFabricJson = fabricCanvas.toJSON();
			const newPabloJson =
				convertFabricObjectsToStructuredDesignProcessedImageItems(currentFabricJson);
			updateStoreWithPabloJson(newPabloJson); // This will trigger derived state updates
		}
	}

	// Handles "Load JSON to Canvas" button click (parses textarea content)
	function handleLoadFromTextarea() {
		if (!editableJsonText) {
			alert('Textarea is empty. Nothing to load.');
			return;
		}
		try {
			const parsedJsonFromText = JSON.parse(editableJsonText);
			// We assume the JSON in the textarea is in Pablo format,
			// as editableJsonText is derived from pabloJsonInStore.
			// So, we can directly update the store with this parsed JSON.
			// console.log("handleLoadFromTextarea: Loading from textarea to store:", parsedJsonFromText);
			updateStoreWithPabloJson(parsedJsonFromText as StructuredDesignProcessedImageItems);
			// The $effect watching fabricJsonForCanvas (derived from store) will then reload the canvas.
		} catch (e) {
			alert('Invalid JSON in textarea! Please correct it before loading.');
			console.error('Invalid JSON in textarea:', e, editableJsonText);
		}
	}
</script>

<div style="display: flex; gap: 20px; padding: 20px;">
	<div style="border: 1px solid #ccc;">
		<canvas bind:this={canvasEl}></canvas>
	</div>
	<div style="width: 400px;">
		<h3>Fabric.js JSON (from Artboard Store - Pablo Format)</h3>
		<textarea
			bind:value={editableJsonText}
			rows="20"
			style="width: 100%; font-family: monospace; font-size: 10px; border: 1px solid #ccc; padding: 5px;"
			placeholder="Enter or paste Fabric-compatible JSON here..."
		></textarea>
		<button onclick={handleLoadFromTextarea} class="mt-2 rounded bg-blue-500 px-4 py-2 text-white">
			Load Textarea JSON to Store & Canvas
		</button>
	</div>
</div>

<style>
	:global(.canvas-container) {
		position: relative;
	}
</style>
