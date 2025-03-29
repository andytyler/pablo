<script lang="ts">
	import DesignAssistant from '$lib/components/chat/DesignAssistant.svelte';
	import HtmlRenderer from '$lib/components/HtmlRenderer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Toggle } from '$lib/components/ui/toggle';
	import { onMount } from 'svelte';
	import { createCircle, createRect, createTextBox, isPointInShape } from './shapes.js';

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
	let designBoard: HTMLElement;
	let canvasWidth = $state(800);
	let canvasHeight = $state(600);
	let elements = $state<Shape[]>([]);
	let selectedElement = $state<Shape | null>(null);
	let currentTool = $state<'select' | 'rectangle' | 'circle' | 'text'>('select');
	let isDrawing = $state(false);
	let isDragging = $state(false);
	let isEditing = $state(false);
	let editingText = $state('');
	let previewShape = $state<Shape | null>(null);
	let startX = 0;
	let startY = 0;
	let dragOffsetX = 0;
	let dragOffsetY = 0;
	let showAttributesPanel = $state(false);

	// HTML view toggle
	let showHtml = $state(false);
	let htmlCode = $state('');

	// State for HTML content
	let generatedHtml = $state('');
	let showGeneratedHtml = $state(false);

	// Initialize design board
	onMount(() => {
		updateHtmlView();
	});

	// Generate HTML code representation of elements
	function updateHtmlView() {
		let htmlOutput = '';
		htmlOutput += '<!-- Generated HTML code from design -->\n';
		htmlOutput += `<div class="design-output" style="width: ${canvasWidth}px; height: ${canvasHeight}px; position: relative;">\n`;
		elements.forEach((el) => {
			if (el.type === 'rectangle') {
				htmlOutput += `  <div class="absolute" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; border: 1px solid black;"></div>\n`;
			} else if (el.type === 'circle') {
				htmlOutput += `  <div class="absolute rounded-full" style="left: ${el.x}px; top: ${el.y}px; width: ${el.radius * 2}px; height: ${el.radius * 2}px; border: 1px solid black;"></div>\n`;
			} else if (el.type === 'text') {
				htmlOutput += `  <div class="absolute" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; font-family: ${el.fontFamily}; font-size: ${el.fontSize}px; text-align: ${el.textAlign}; font-weight: ${el.fontWeight}; font-style: ${el.fontStyle}; color: ${el.color};">${el.text}</div>\n`;
			}
		});
		htmlOutput += '</div>';
		htmlCode = htmlOutput;
	}

	// Handle mouse events
	function handleMouseDown(e: MouseEvent) {
		// Skip if currently editing text
		if (isEditing) return;

		const rect = designBoard.getBoundingClientRect();
		startX = e.clientX - rect.left;
		startY = e.clientY - rect.top;

		if (currentTool === 'select') {
			// Check if clicking on an element
			const clickedElement = elements.findLast((el) => isPointInShape(el, startX, startY));

			if (clickedElement) {
				selectedElement = clickedElement;
				showAttributesPanel = true;

				// Double click to edit text
				if (clickedElement.type === 'text' && e.detail === 2) {
					isEditing = true;
					editingText = clickedElement.text;
					return;
				}

				isDragging = true;
				dragOffsetX = startX - clickedElement.x;
				dragOffsetY = startY - clickedElement.y;
			} else {
				selectedElement = null;
				showAttributesPanel = false;
			}
		} else {
			isDrawing = true;
			previewShape = null;
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (isEditing) return;

		const rect = designBoard.getBoundingClientRect();
		const currentX = e.clientX - rect.left;
		const currentY = e.clientY - rect.top;

		if (isDragging && selectedElement) {
			// Drag the selected element
			selectedElement.x = currentX - dragOffsetX;
			selectedElement.y = currentY - dragOffsetY;
			elements = [...elements]; // Trigger reactivity
			updateHtmlView();
		} else if (isDrawing) {
			// Preview the shape being drawn
			if (currentTool === 'rectangle') {
				const width = Math.abs(currentX - startX);
				const height = Math.abs(currentY - startY);
				const x = Math.min(startX, currentX);
				const y = Math.min(startY, currentY);

				previewShape = { type: 'rectangle', x, y, width, height };
			} else if (currentTool === 'circle') {
				const radius =
					Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)) / 2;
				const centerX = (startX + currentX) / 2;
				const centerY = (startY + currentY) / 2;

				previewShape = {
					type: 'circle',
					x: centerX - radius,
					y: centerY - radius,
					radius
				};
			} else if (currentTool === 'text') {
				const width = Math.abs(currentX - startX);
				const height = Math.abs(currentY - startY);
				const x = Math.min(startX, currentX);
				const y = Math.min(startY, currentY);

				previewShape = {
					type: 'text',
					x,
					y,
					width,
					height,
					text: 'Text',
					fontFamily: 'Arial, sans-serif',
					fontSize: 16,
					textAlign: 'left',
					fontWeight: 'normal',
					fontStyle: 'normal',
					color: '#000000'
				};
			}
		}
	}

	function handleMouseUp(e: MouseEvent) {
		if (isEditing) return;

		if (isDragging) {
			isDragging = false;
			return;
		}

		if (!isDrawing) return;

		const rect = designBoard.getBoundingClientRect();
		const endX = e.clientX - rect.left;
		const endY = e.clientY - rect.top;

		if (currentTool === 'rectangle') {
			const width = Math.abs(endX - startX);
			const height = Math.abs(endY - startY);

			// Only create element if it has some size
			if (width > 5 && height > 5) {
				const x = Math.min(startX, endX);
				const y = Math.min(startY, endY);

				elements = [...elements, createRect(x, y, width, height)];
				updateHtmlView();
			}
		} else if (currentTool === 'circle') {
			const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;

			// Only create element if it has some size
			if (radius > 5) {
				const centerX = (startX + endX) / 2;
				const centerY = (startY + endY) / 2;

				elements = [...elements, createCircle(centerX, centerY, radius)];
				updateHtmlView();
			}
		} else if (currentTool === 'text') {
			const width = Math.abs(endX - startX);
			const height = Math.abs(endY - startY);

			// Only create element if it has some size
			if (width > 20 && height > 20) {
				const x = Math.min(startX, endX);
				const y = Math.min(startY, endY);

				const textBox = createTextBox(x, y, width, height);
				elements = [...elements, textBox];
				updateHtmlView();

				// Automatically select and edit new text box
				selectedElement = textBox;
				isEditing = true;
				editingText = textBox.text;
			}
		}

		isDrawing = false;
		previewShape = null;
	}

	function finishTextEdit() {
		if (isEditing && selectedElement && selectedElement.type === 'text') {
			(selectedElement as TextBox).text = editingText;
			elements = [...elements]; // Trigger reactivity
			updateHtmlView();
		}
		isEditing = false;
	}

	function deleteSelectedElement() {
		if (selectedElement) {
			elements = elements.filter((el) => el !== selectedElement);
			selectedElement = null;
			isEditing = false;
			updateHtmlView();
		}
	}

	// Event handler for keyboard events
	function handleKeyDown(e: KeyboardEvent) {
		if (isEditing) {
			if (e.key === 'Escape') {
				isEditing = false;
			} else if (e.key === 'Enter' && !e.shiftKey) {
				finishTextEdit();
			}
			return;
		}

		if (e.key === 'Delete' || e.key === 'Backspace') {
			deleteSelectedElement();
		} else if (e.key === 'Escape') {
			selectedElement = null;
			showAttributesPanel = false;
		}
	}

	// Handle HTML generated from the design assistant
	function handleGeneratedHtml(event: CustomEvent<{ html: string }>) {
		generatedHtml = event.detail.html;
		showGeneratedHtml = true;

		// Clear any existing elements if needed
		if (elements.length > 0 && confirm('Clear current elements to show the generated HTML?')) {
			elements = [];
		}

		// Update the HTML view
		updateHtmlView();
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="flex h-screen flex-col bg-background" onkeydown={handleKeyDown} tabindex="-1">
	<!-- Toolbar -->
	<div class="flex items-center justify-between border-b p-4">
		<!-- Logo and title -->
		<div class="flex items-center gap-2">
			<svg
				viewBox="0 0 24 24"
				width="24"
				height="24"
				stroke="currentColor"
				stroke-width="2"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-primary"
			>
				<path d="M12 19l7-7 3 3-7 7-3-3z" />
				<path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
				<path d="M2 2l7.586 7.586" />
				<circle cx="11" cy="11" r="2" />
			</svg>
			<h1 class="text-xl font-semibold">Pablo</h1>
		</div>

		<!-- Tools -->
		<div class="flex items-center gap-2">
			<Toggle
				pressed={currentTool === 'select'}
				onPressedChange={() => (currentTool = 'select')}
				aria-label="Select tool"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-mouse-pointer"
				>
					<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
				</svg>
			</Toggle>
			<Toggle
				pressed={currentTool === 'rectangle'}
				onPressedChange={() => (currentTool = 'rectangle')}
				aria-label="Rectangle tool"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-square"
				>
					<rect width="18" height="18" x="3" y="3" rx="2" />
				</svg>
			</Toggle>
			<Toggle
				pressed={currentTool === 'circle'}
				onPressedChange={() => (currentTool = 'circle')}
				aria-label="Circle tool"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-circle"
				>
					<circle cx="12" cy="12" r="10" />
				</svg>
			</Toggle>
			<Toggle
				pressed={currentTool === 'text'}
				onPressedChange={() => (currentTool = 'text')}
				aria-label="Text tool"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-type"
				>
					<polyline points="4 7 4 4 20 4 20 7" />
					<line x1="9" x2="15" y1="20" y2="20" />
					<line x1="12" x2="12" y1="4" y2="20" />
				</svg>
			</Toggle>

			<Separator orientation="vertical" class="mx-2 h-6" />

			<Toggle
				pressed={showHtml}
				onPressedChange={() => (showHtml = !showHtml)}
				aria-label="Show HTML code"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-code"
				>
					<polyline points="16 18 22 12 16 6" />
					<polyline points="8 6 2 12 8 18" />
				</svg>
			</Toggle>

			<Button
				variant="ghost"
				size="icon"
				disabled={!selectedElement}
				onclick={deleteSelectedElement}
				class="text-destructive hover:bg-destructive/10 hover:text-destructive"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-trash-2"
					><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
						d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
					/><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg
				>
			</Button>
		</div>
	</div>

	<main class="flex flex-1 overflow-hidden">
		<!-- Design canvas with artboard controls -->
		<div class="relative flex flex-1 flex-col">
			<!-- Artboard size controls -->
			<div class="flex items-center justify-center gap-4 border-b bg-muted/50 p-2">
				<div class="flex items-center gap-2">
					<label class="text-sm text-muted-foreground">Width:</label>
					<input
						type="number"
						value={canvasWidth}
						class="w-20 rounded-md border px-2 py-1 text-sm"
						oninput={(e) => {
							if (e.target instanceof HTMLInputElement) {
								canvasWidth = Number(e.target.value);
								updateHtmlView();
							}
						}}
					/>
				</div>
				<div class="flex items-center gap-2">
					<label class="text-sm text-muted-foreground">Height:</label>
					<input
						type="number"
						value={canvasHeight}
						class="w-20 rounded-md border px-2 py-1 text-sm"
						oninput={(e) => {
							if (e.target instanceof HTMLInputElement) {
								canvasHeight = Number(e.target.value);
								updateHtmlView();
							}
						}}
					/>
				</div>
			</div>

			<div class="relative flex-1 overflow-auto">
				<div class="artboard-container flex min-h-full items-center justify-center p-4">
					<div
						id="design-canvas"
						class="overflow-hidden border-2 border-dashed border-gray-300 bg-white"
						style:width="{canvasWidth}px"
						style:height="{canvasHeight}px"
						style:position="relative"
						bind:this={designBoard}
						onmousedown={handleMouseDown}
						onmousemove={handleMouseMove}
						onmouseup={handleMouseUp}
					>
						{#each elements as element}
							{#if element.type === 'rectangle'}
								<div
									style="position: absolute; left: {element.x}px; top: {element.y}px; width: {element.width}px; height: {element.height}px; border: 1px solid black; background-color: white; {element ===
									selectedElement
										? 'outline: 2px solid blue;'
										: ''}"
								/>
							{:else if element.type === 'circle'}
								<div
									style="position: absolute; left: {element.x}px; top: {element.y}px; width: {element.radius *
										2}px; height: {element.radius *
										2}px; border: 1px solid black; border-radius: 50%; background-color: white; {element ===
									selectedElement
										? 'outline: 2px solid blue;'
										: ''}"
								/>
							{:else if element.type === 'text'}
								<div
									style="position: absolute; left: {element.x}px; top: {element.y}px; width: {element.width}px; height: {element.height}px; border: 1px solid black; background-color: white; font-family: {element.fontFamily}; font-size: {element.fontSize}px; text-align: {element.textAlign}; font-weight: {element.fontWeight}; font-style: {element.fontStyle}; color: {element.color}; overflow: hidden; {element ===
									selectedElement
										? 'outline: 2px solid blue;'
										: ''}"
								>
									{#if isEditing && element === selectedElement}
										<textarea
											value={editingText}
											oninput={(e) => {
												const target = e.target as HTMLTextAreaElement;
												editingText = target.value;
											}}
											onblur={() => {
												element.text = editingText;
												isEditing = false;
											}}
											style="width: 100%; height: 100%; border: none; resize: none; padding: 0; margin: 0; background: transparent; font-family: inherit; font-size: inherit; text-align: inherit; font-weight: inherit; font-style: inherit; color: inherit;"
											autofocus
										/>
									{:else}
										{element.text}
									{/if}
								</div>
							{/if}
						{/each}

						{#if previewShape}
							{#if previewShape.type === 'rectangle'}
								<div
									style="position: absolute; left: {previewShape.x}px; top: {previewShape.y}px; width: {previewShape.width}px; height: {previewShape.height}px; border: 1px dashed gray; background-color: rgba(200, 200, 200, 0.3);"
								/>
							{:else if previewShape.type === 'circle'}
								<div
									style="position: absolute; left: {previewShape.x}px; top: {previewShape.y}px; width: {previewShape.radius *
										2}px; height: {previewShape.radius *
										2}px; border: 1px dashed gray; border-radius: 50%; background-color: rgba(200, 200, 200, 0.3);"
								/>
							{:else if previewShape.type === 'text'}
								<div
									style="position: absolute; left: {previewShape.x}px; top: {previewShape.y}px; width: {previewShape.width}px; height: {previewShape.height}px; border: 1px dashed gray; background-color: rgba(200, 200, 200, 0.3);"
								>
									{previewShape.text}
								</div>
							{/if}
						{/if}

						{#if selectedElement && selectedElement.type === 'text' && isEditing}
							<div
								style="position: absolute; left: {selectedElement.x}px; top: {selectedElement.y}px; width: {selectedElement.width}px; height: {selectedElement.height}px; border: 1px solid black; background-color: white; font-family: {selectedElement.fontFamily}; font-size: {selectedElement.fontSize}px; text-align: {selectedElement.textAlign}; font-weight: {selectedElement.fontWeight}; font-style: {selectedElement.fontStyle}; color: {selectedElement.color}; overflow: hidden; outline: 2px solid blue;"
							>
								<textarea
									value={editingText}
									oninput={(e) => {
										const target = e.target as HTMLTextAreaElement;
										editingText = target.value;
									}}
									onblur={() => {
										if (selectedElement && selectedElement.type === 'text') {
											selectedElement.text = editingText;
										}
										isEditing = false;
									}}
									style="width: 100%; height: 100%; border: none; resize: none; padding: 0; margin: 0; background: transparent; font-family: inherit; font-size: inherit; text-align: inherit; font-weight: inherit; font-style: inherit; color: inherit;"
									autofocus
								/>
							</div>
						{/if}

						{#if showGeneratedHtml && generatedHtml}
							<div class="absolute inset-0 z-10">
								<HtmlRenderer htmlContent={generatedHtml} />
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Right sidebar for inspector and other controls -->
		<div class="flex w-64 flex-col overflow-y-auto border-l bg-sidebar p-4">
			{#if showAttributesPanel && selectedElement}
				<div class="mb-4">
					<h3 class="mb-2 text-sm font-medium">Element Properties</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="text-sm text-muted-foreground">X</label>
							<input
								type="number"
								value={selectedElement.x}
								class="w-full rounded-md border px-2 py-1 text-sm"
								oninput={(e) => {
									if (selectedElement && e.target instanceof HTMLInputElement) {
										selectedElement.x = Number(e.target.value);
										elements = [...elements];
										updateHtmlView();
									}
								}}
							/>
						</div>
						<div>
							<label class="text-sm text-muted-foreground">Y</label>
							<input
								type="number"
								value={selectedElement.y}
								class="w-full rounded-md border px-2 py-1 text-sm"
								oninput={(e) => {
									if (selectedElement && e.target instanceof HTMLInputElement) {
										selectedElement.y = Number(e.target.value);
										elements = [...elements];
										updateHtmlView();
									}
								}}
							/>
						</div>
						{#if selectedElement.type === 'rectangle' || selectedElement.type === 'text'}
							<div>
								<label class="text-sm text-muted-foreground">Width</label>
								<input
									type="number"
									value={selectedElement.width}
									class="w-full rounded-md border px-2 py-1 text-sm"
									oninput={(e) => {
										if (selectedElement && e.target instanceof HTMLInputElement) {
											(selectedElement as Rectangle | TextBox).width = Number(e.target.value);
											elements = [...elements];
											updateHtmlView();
										}
									}}
								/>
							</div>
							<div>
								<label class="text-sm text-muted-foreground">Height</label>
								<input
									type="number"
									value={selectedElement.height}
									class="w-full rounded-md border px-2 py-1 text-sm"
									oninput={(e) => {
										if (selectedElement && e.target instanceof HTMLInputElement) {
											(selectedElement as Rectangle | TextBox).height = Number(e.target.value);
											elements = [...elements];
											updateHtmlView();
										}
									}}
								/>
							</div>
						{:else if selectedElement.type === 'circle'}
							<div>
								<label class="text-sm text-muted-foreground">Radius</label>
								<input
									type="number"
									value={selectedElement.radius}
									class="w-full rounded-md border px-2 py-1 text-sm"
									oninput={(e) => {
										if (selectedElement && e.target instanceof HTMLInputElement) {
											(selectedElement as Circle).radius = Number(e.target.value);
											elements = [...elements];
											updateHtmlView();
										}
									}}
								/>
							</div>
						{/if}

						{#if selectedElement.type === 'text'}
							<div class="col-span-2 mt-2">
								<label class="text-sm text-muted-foreground">Text</label>
								<textarea
									value={selectedElement.text}
									class="w-full rounded-md border px-2 py-1 text-sm"
									rows="3"
									oninput={(e) => {
										if (selectedElement && e.target instanceof HTMLTextAreaElement) {
											(selectedElement as TextBox).text = e.target.value;
											elements = [...elements];
											updateHtmlView();
										}
									}}
								/>
							</div>

							<div class="col-span-2">
								<label class="text-sm text-muted-foreground">Font Family</label>
								<select
									value={selectedElement.fontFamily}
									class="w-full rounded-md border px-2 py-1 text-sm"
									onchange={(e) => {
										if (selectedElement && e.target instanceof HTMLSelectElement) {
											(selectedElement as TextBox).fontFamily = e.target.value;
											elements = [...elements];
											updateHtmlView();
										}
									}}
								>
									{#each fontFamilies as font}
										<option value={font}>{font.split(',')[0]}</option>
									{/each}
								</select>
							</div>

							<div>
								<label class="text-sm text-muted-foreground">Font Size</label>
								<input
									type="number"
									value={selectedElement.fontSize}
									class="w-full rounded-md border px-2 py-1 text-sm"
									oninput={(e) => {
										if (selectedElement && e.target instanceof HTMLInputElement) {
											(selectedElement as TextBox).fontSize = Number(e.target.value);
											elements = [...elements];
											updateHtmlView();
										}
									}}
								/>
							</div>

							<div>
								<label class="text-sm text-muted-foreground">Text Align</label>
								<select
									value={selectedElement.textAlign}
									class="w-full rounded-md border px-2 py-1 text-sm"
									onchange={(e) => {
										if (selectedElement && e.target instanceof HTMLSelectElement) {
											(selectedElement as TextBox).textAlign = e.target.value;
											elements = [...elements];
											updateHtmlView();
										}
									}}
								>
									{#each textAlignOptions as align}
										<option value={align}>{align}</option>
									{/each}
								</select>
							</div>

							<div>
								<label class="text-sm text-muted-foreground">Font Weight</label>
								<select
									value={selectedElement.fontWeight}
									class="w-full rounded-md border px-2 py-1 text-sm"
									onchange={(e) => {
										if (selectedElement && e.target instanceof HTMLSelectElement) {
											(selectedElement as TextBox).fontWeight = e.target.value;
											elements = [...elements];
											updateHtmlView();
										}
									}}
								>
									{#each fontWeightOptions as weight}
										<option value={weight}>{weight}</option>
									{/each}
								</select>
							</div>

							<div>
								<label class="text-sm text-muted-foreground">Font Style</label>
								<select
									value={selectedElement.fontStyle}
									class="w-full rounded-md border px-2 py-1 text-sm"
									onchange={(e) => {
										if (selectedElement && e.target instanceof HTMLSelectElement) {
											(selectedElement as TextBox).fontStyle = e.target.value;
											elements = [...elements];
											updateHtmlView();
										}
									}}
								>
									{#each fontStyleOptions as style}
										<option value={style}>{style}</option>
									{/each}
								</select>
							</div>

							<div class="col-span-2">
								<label class="text-sm text-muted-foreground">Color</label>
								<input
									type="color"
									value={selectedElement.color}
									class="h-8 w-full rounded-md border px-2 py-1 text-sm"
									oninput={(e) => {
										if (selectedElement && e.target instanceof HTMLInputElement) {
											(selectedElement as TextBox).color = e.target.value;
											elements = [...elements];
											updateHtmlView();
										}
									}}
								/>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- HTML View Section -->
			<div class="mt-4">
				<div class="mb-2 flex items-center justify-between">
					<h3 class="text-sm font-medium">HTML View</h3>
					<Toggle
						pressed={showHtml}
						onPressedChange={() => (showHtml = !showHtml)}
						aria-label="Toggle HTML view"
						class="h-6 w-6"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="lucide lucide-code"
						>
							<polyline points="16 18 22 12 16 6" />
							<polyline points="8 6 2 12 8 18" />
						</svg>
					</Toggle>
				</div>

				{#if showHtml}
					<div class="mt-2 rounded-md bg-muted p-2">
						<pre class="max-h-[200px] overflow-auto whitespace-pre-wrap text-xs">{htmlCode}</pre>
					</div>
					<div class="mt-2 flex justify-between">
						<Button
							variant="outline"
							size="sm"
							onclick={() => {
								showGeneratedHtml = !showGeneratedHtml;
								if (!showGeneratedHtml) {
									// Clear generated HTML and go back to elements view
									generatedHtml = '';
								}
							}}
							disabled={!generatedHtml}
						>
							{showGeneratedHtml ? 'Show Elements' : 'Show Generated HTML'}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={() => {
								navigator.clipboard.writeText(htmlCode);
							}}
						>
							Copy HTML
						</Button>
					</div>
				{/if}
			</div>

			<!-- Artboard Information -->
			<div class="mt-4">
				<h3 class="mb-2 text-sm font-medium">Artboard Information</h3>
				<div class="text-xs text-muted-foreground">
					<p>Current Size: {canvasWidth} × {canvasHeight}px</p>
					<p>Items: {elements.length}</p>
					<p class="mt-1">Click on any element to edit its properties.</p>
				</div>
			</div>
		</div>

		<!-- Design Assistant - Integrated into main UI -->
		<div class="w-80 border-l">
			<DesignAssistant
				canvasSelector="#design-canvas"
				currentHtml={generatedHtml}
				on:generateHTML={handleGeneratedHtml}
			/>
		</div>
	</main>
</div>
