<script lang="ts">
	import DesignAssistant from '$lib/components/chat/DesignAssistant.svelte';
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

	// Canvas state
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let canvasWidth = 800;
	let canvasHeight = 600;
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

	interface ChatMessage {
		role: 'user' | 'system';
		content: string;
	}

	// Chat state
	let messages = $state<ChatMessage[]>([
		{ role: 'system', content: "I'm your design assistant. How can I help you today?" }
	]);
	let currentMessage = $state('');

	// Initialize canvas
	onMount(() => {
		ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
		draw();
	});

	// Draw all elements
	function draw() {
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// Draw grid
		ctx.strokeStyle = '#e2e8f0';
		ctx.lineWidth = 0.5;

		// Draw vertical lines
		for (let i = 0; i < canvasWidth; i += 20) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i, canvasHeight);
			ctx.stroke();
		}

		// Draw horizontal lines
		for (let i = 0; i < canvasHeight; i += 20) {
			ctx.beginPath();
			ctx.moveTo(0, i);
			ctx.lineTo(canvasWidth, i);
			ctx.stroke();
		}

		// Draw elements
		elements.forEach((el) => {
			ctx.strokeStyle = el === selectedElement ? '#3b82f6' : '#0f172a';
			ctx.lineWidth = el === selectedElement ? 2 : 1;

			if (el.type === 'rectangle') {
				ctx.strokeRect(el.x, el.y, el.width, el.height);
			} else if (el.type === 'circle') {
				ctx.beginPath();
				ctx.arc(el.x + el.radius, el.y + el.radius, el.radius, 0, Math.PI * 2);
				ctx.stroke();
			} else if (el.type === 'text') {
				// Draw text box
				ctx.strokeRect(el.x, el.y, el.width, el.height);

				// Draw text
				if (!isEditing || el !== selectedElement) {
					ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
					ctx.fillStyle = el.color;
					ctx.textAlign =
						el.textAlign === 'left' ? 'start' : el.textAlign === 'right' ? 'end' : 'center';

					// Calculate x position based on text alignment
					let textX = el.x + 5;
					if (el.textAlign === 'center') {
						textX = el.x + el.width / 2;
					} else if (el.textAlign === 'right') {
						textX = el.x + el.width - 5;
					}

					// Draw text with word wrapping
					const words = el.text.split(' ');
					let line = '';
					let y = el.y + el.fontSize;

					for (let i = 0; i < words.length; i++) {
						const testLine = line + words[i] + ' ';
						const metrics = ctx.measureText(testLine);
						const testWidth = metrics.width;

						if (testWidth > el.width - 10 && i > 0) {
							ctx.fillText(line, textX, y);
							line = words[i] + ' ';
							y += el.fontSize + 2;

							// Break if text exceeds textbox height
							if (y > el.y + el.height - 5) break;
						} else {
							line = testLine;
						}
					}

					ctx.fillText(line, textX, y);
				}
			}
		});

		// Draw preview shape when drawing
		if (previewShape) {
			ctx.strokeStyle = '#3b82f6';
			ctx.lineWidth = 1;
			ctx.setLineDash([5, 5]);

			if (previewShape.type === 'rectangle' || previewShape.type === 'text') {
				ctx.strokeRect(previewShape.x, previewShape.y, previewShape.width, previewShape.height);
			} else if (previewShape.type === 'circle') {
				ctx.beginPath();
				ctx.arc(
					previewShape.x + previewShape.radius,
					previewShape.y + previewShape.radius,
					previewShape.radius,
					0,
					Math.PI * 2
				);
				ctx.stroke();
			}

			ctx.setLineDash([]);
		}

		requestAnimationFrame(draw);
	}

	// Handle mouse events
	function handleMouseDown(e: MouseEvent) {
		// Skip if currently editing text
		if (isEditing) return;

		const rect = canvas.getBoundingClientRect();
		startX = e.clientX - rect.left;
		startY = e.clientY - rect.top;

		if (currentTool === 'select') {
			// Check if clicking on an element
			const clickedElement = elements.findLast((el) => isPointInShape(el, startX, startY));

			if (clickedElement) {
				selectedElement = clickedElement;

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
			}
		} else {
			isDrawing = true;
			previewShape = null;
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (isEditing) return;

		const rect = canvas.getBoundingClientRect();
		const currentX = e.clientX - rect.left;
		const currentY = e.clientY - rect.top;

		if (isDragging && selectedElement) {
			// Drag the selected element
			selectedElement.x = currentX - dragOffsetX;
			selectedElement.y = currentY - dragOffsetY;
			elements = [...elements]; // Trigger reactivity
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

		const rect = canvas.getBoundingClientRect();
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
			}
		} else if (currentTool === 'circle') {
			const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;

			// Only create element if it has some size
			if (radius > 5) {
				const centerX = (startX + endX) / 2;
				const centerY = (startY + endY) / 2;

				elements = [...elements, createCircle(centerX, centerY, radius)];
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
		}
		isEditing = false;
	}

	function deleteSelectedElement() {
		if (selectedElement) {
			elements = elements.filter((el) => el !== selectedElement);
			selectedElement = null;
			isEditing = false;
		}
	}

	// Handle keyboard shortcuts
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
		}
	}

	// Handle chat
	function sendMessage() {
		if (!currentMessage.trim()) return;

		messages = [...messages, { role: 'user', content: currentMessage }];

		// Simulate response
		setTimeout(() => {
			messages = [
				...messages,
				{
					role: 'system',
					content: "I've received your message: " + currentMessage
				}
			];
		}, 500);

		currentMessage = '';
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="flex h-screen w-screen overflow-hidden">
	<!-- Left sidebar - Tools -->
	<div
		class="bg-sidebar-background flex w-16 flex-col items-center gap-2 border-r border-border py-4"
	>
		<Toggle
			pressed={currentTool === 'select'}
			on:click={() => (currentTool = 'select')}
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
				class="lucide lucide-mouse-pointer"><path d="m4 4 7.07 17 2.51-7.39L21 11.07z" /></svg
			>
		</Toggle>

		<Toggle
			pressed={currentTool === 'rectangle'}
			on:click={() => (currentTool = 'rectangle')}
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
				class="lucide lucide-square"><rect width="18" height="18" x="3" y="3" rx="2" /></svg
			>
		</Toggle>

		<Toggle
			pressed={currentTool === 'circle'}
			on:click={() => (currentTool = 'circle')}
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
				class="lucide lucide-circle"><circle cx="12" cy="12" r="10" /></svg
			>
		</Toggle>

		<Toggle
			pressed={currentTool === 'text'}
			on:click={() => (currentTool = 'text')}
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
				><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" x2="15" y1="20" y2="20" /><line
					x1="12"
					x2="12"
					y1="4"
					y2="20"
				/></svg
			>
		</Toggle>

		<Separator class="my-2" />

		<Button
			variant="ghost"
			size="icon"
			disabled={!selectedElement}
			on:click={deleteSelectedElement}
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

	<!-- Main area -->
	<div class="flex flex-1">
		<!-- Canvas -->
		<div class="flex flex-1 items-center justify-center overflow-auto bg-[#f8f9fa]">
			<canvas
				bind:this={canvas}
				id="design-canvas"
				width={canvasWidth}
				height={canvasHeight}
				on:mousedown={handleMouseDown}
				on:mousemove={handleMouseMove}
				on:mouseup={handleMouseUp}
				on:mouseleave={() => {
					isDrawing = false;
					isDragging = false;
					previewShape = null;
				}}
				class="bg-white shadow-lg"
			></canvas>

			{#if isEditing && selectedElement && selectedElement.type === 'text'}
				<div
					class="absolute border border-border bg-white p-1 shadow-lg"
					style="left: {selectedElement.x + 5}px; top: {selectedElement.y +
						5}px; width: {selectedElement.width - 10}px; min-height: {selectedElement.height -
						10}px;"
				>
					<textarea
						bind:value={editingText}
						class="h-full min-h-[30px] w-full resize-none border-none focus:outline-none"
						style="font-family: {selectedElement.fontFamily}; font-size: {selectedElement.fontSize}px; font-weight: {selectedElement.fontWeight}; font-style: {selectedElement.fontStyle}; color: {selectedElement.color}; text-align: {selectedElement.textAlign};"
						autoFocus
					></textarea>
					<div class="mt-1 flex justify-end">
						<Button size="sm" variant="outline" class="mr-2" on:click={() => (isEditing = false)}>
							Cancel
						</Button>
						<Button size="sm" on:click={finishTextEdit}>Done</Button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Right sidebar - Properties and Chat -->
		<div class="bg-sidebar-background flex w-80 flex-col border-l border-border">
			<!-- Properties panel -->
			<div class="max-h-[50%] overflow-y-auto border-b border-border p-4">
				<h2 class="mb-2 text-lg font-medium">Properties</h2>

				{#if selectedElement}
					<div class="space-y-2">
						<div>
							<label class="text-sm text-muted-foreground">Type</label>
							<div class="font-medium">{selectedElement.type}</div>
						</div>

						<div class="grid grid-cols-2 gap-2">
							<div>
								<label class="text-sm text-muted-foreground">X</label>
								<input
									type="number"
									value={selectedElement.x}
									class="w-full rounded-md border px-2 py-1 text-sm"
									on:input={(e) => {
										if (selectedElement && e.target instanceof HTMLInputElement) {
											selectedElement.x = Number(e.target.value);
											elements = [...elements];
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
									on:input={(e) => {
										if (selectedElement && e.target instanceof HTMLInputElement) {
											selectedElement.y = Number(e.target.value);
											elements = [...elements];
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
										on:input={(e) => {
											if (selectedElement && e.target instanceof HTMLInputElement) {
												(selectedElement as Rectangle | TextBox).width = Number(e.target.value);
												elements = [...elements];
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
										on:input={(e) => {
											if (selectedElement && e.target instanceof HTMLInputElement) {
												(selectedElement as Rectangle | TextBox).height = Number(e.target.value);
												elements = [...elements];
											}
										}}
									/>
								</div>
							{:else if selectedElement.type === 'circle'}
								<div class="col-span-2">
									<label class="text-sm text-muted-foreground">Radius</label>
									<input
										type="number"
										value={selectedElement.radius}
										class="w-full rounded-md border px-2 py-1 text-sm"
										on:input={(e) => {
											if (selectedElement && e.target instanceof HTMLInputElement) {
												(selectedElement as Circle).radius = Number(e.target.value);
												elements = [...elements];
											}
										}}
									/>
								</div>
							{/if}

							{#if selectedElement.type === 'text'}
								<div class="col-span-2">
									<label class="text-sm text-muted-foreground">Text</label>
									<textarea
										value={(selectedElement as TextBox).text}
										class="w-full rounded-md border px-2 py-1 text-sm"
										rows="2"
										on:input={(e) => {
											if (selectedElement && e.target instanceof HTMLTextAreaElement) {
												(selectedElement as TextBox).text = e.target.value;
												elements = [...elements];
											}
										}}
									></textarea>
								</div>

								<div class="col-span-2">
									<label class="text-sm text-muted-foreground">Font Family</label>
									<select
										class="w-full rounded-md border px-2 py-1 text-sm"
										value={(selectedElement as TextBox).fontFamily}
										on:change={(e) => {
											if (selectedElement && e.target instanceof HTMLSelectElement) {
												(selectedElement as TextBox).fontFamily = e.target.value;
												elements = [...elements];
											}
										}}
									>
										{#each fontFamilies as font}
											<option value={font} style="font-family: {font};">{font.split(',')[0]}</option
											>
										{/each}
									</select>
								</div>

								<div>
									<label class="text-sm text-muted-foreground">Font Size</label>
									<input
										type="number"
										value={(selectedElement as TextBox).fontSize}
										min="8"
										max="72"
										class="w-full rounded-md border px-2 py-1 text-sm"
										on:input={(e) => {
											if (selectedElement && e.target instanceof HTMLInputElement) {
												(selectedElement as TextBox).fontSize = Number(e.target.value);
												elements = [...elements];
											}
										}}
									/>
								</div>

								<div>
									<label class="text-sm text-muted-foreground">Text Align</label>
									<select
										class="w-full rounded-md border px-2 py-1 text-sm"
										value={(selectedElement as TextBox).textAlign}
										on:change={(e) => {
											if (selectedElement && e.target instanceof HTMLSelectElement) {
												(selectedElement as TextBox).textAlign = e.target.value;
												elements = [...elements];
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
										class="w-full rounded-md border px-2 py-1 text-sm"
										value={(selectedElement as TextBox).fontWeight}
										on:change={(e) => {
											if (selectedElement && e.target instanceof HTMLSelectElement) {
												(selectedElement as TextBox).fontWeight = e.target.value;
												elements = [...elements];
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
										class="w-full rounded-md border px-2 py-1 text-sm"
										value={(selectedElement as TextBox).fontStyle}
										on:change={(e) => {
											if (selectedElement && e.target instanceof HTMLSelectElement) {
												(selectedElement as TextBox).fontStyle = e.target.value;
												elements = [...elements];
											}
										}}
									>
										{#each fontStyleOptions as style}
											<option value={style}>{style}</option>
										{/each}
									</select>
								</div>

								<div class="col-span-2">
									<label class="text-sm text-muted-foreground">Text Color</label>
									<div class="flex gap-2">
										<input
											type="color"
											value={(selectedElement as TextBox).color}
											class="h-8 w-8 rounded-md border"
											on:input={(e) => {
												if (selectedElement && e.target instanceof HTMLInputElement) {
													(selectedElement as TextBox).color = e.target.value;
													elements = [...elements];
												}
											}}
										/>
										<input
											type="text"
											value={(selectedElement as TextBox).color}
											class="flex-1 rounded-md border px-2 py-1 text-sm"
											on:input={(e) => {
												if (selectedElement && e.target instanceof HTMLInputElement) {
													(selectedElement as TextBox).color = e.target.value;
													elements = [...elements];
												}
											}}
										/>
									</div>
								</div>

								<div class="col-span-2 mt-2">
									<Button
										class="w-full"
										on:click={() => {
											isEditing = true;
											editingText = (selectedElement as TextBox).text;
										}}
									>
										Edit Text
									</Button>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">Select an element to view properties</p>
				{/if}
			</div>

			<!-- Chat panel -->
			<div class="flex flex-1 flex-col">
				<div class="border-b border-border p-4">
					<h2 class="text-lg font-medium">Chat</h2>
				</div>

				<div class="flex-1 space-y-4 overflow-y-auto p-4">
					{#each messages as message}
						<div
							class={`${message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'} max-w-[80%] rounded-lg p-3`}
						>
							{message.content}
						</div>
					{/each}
				</div>

				<div class="border-t border-border p-4">
					<form on:submit|preventDefault={sendMessage} class="flex gap-2">
						<input
							type="text"
							placeholder="Ask about your design..."
							class="flex-1 rounded-md border border-input px-3 py-2 text-sm"
							bind:value={currentMessage}
						/>
						<Button type="submit">Send</Button>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Design Assistant -->
<DesignAssistant canvasSelector="#design-canvas" />
