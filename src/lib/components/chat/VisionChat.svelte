<script lang="ts">
	import { browser } from '$app/environment';
	import * as ScrollArea from '$lib/components/ui/scroll-area';
	import { captureCanvasScreenshot } from '$lib/connections/screenshot';
	import {
		addImageToStore,
		artboardStore,
		initArtboardStore
	} from '$lib/stores/artboard-store.svelte';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import Ban from '@lucide/svelte/icons/ban';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Paintbrush from '@lucide/svelte/icons/paintbrush';
	import { onMount } from 'svelte';
	import type { StructuredDesign } from '../../../routes/api/generate-design/step1/design';
	import { Button } from '../ui/button';
	import { Textarea } from '../ui/textarea';

	// Props using Svelte 5 syntax
	let { canvasSelector = '#design-canvas', placeholder = 'Ask something about your design...' } =
		$props();

	import {
		addMessage,
		chat_history,
		clearMessages,
		initMessages
	} from '$lib/stores/messagesStore.svelte';
	import type { Design, DesignElement } from '$lib/types';
	import ChatMessage from './ChatMessage.svelte';

	// State using Svelte 5 runes
	let prompt = $state('');
	let isCapturingImage = $state(false);
	let isGeneratingHTML = $state(false);
	let generationError = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let processingImageCount = $state(0);
	let totalImagesToProcess = $state(0);
	let designId = $state<string | null>(null);
	let processedImageItems = $state<Map<string, DesignElement>>(new Map());
	let designJson = $state<Design | null>(null);

	let isUpdatingImages = $state(false);

	// Scroll to bottom whenever messages change or component mounts
	function scrollToBottom() {
		// Find the viewport element (first child of the scrollArea)
		const viewport = document.getElementById('scroll-area')?.getElementsByTagName('div')[0];
		if (viewport) {
			setTimeout(() => {
				viewport.scrollTop = viewport.scrollHeight;
			}, 10);
		}
	}

	onMount(() => {
		scrollToBottom();

		// Load chat settings from localStorage if available
		if (browser) {
			initMessages();
			initArtboardStore();

			const storedSettings = localStorage.getItem('chat_settings');
			if (storedSettings) {
				try {
					const settings = JSON.parse(storedSettings);
					artboardStore.chatSettings = {
						...artboardStore.chatSettings,
						...settings
					};
				} catch (error) {
					console.error('Failed to parse stored chat settings:', error);
				}
			}
			const promptTextarea = document.getElementById('prompt-textarea');
			if (promptTextarea) {
				promptTextarea.focus();
				promptTextarea.addEventListener('keydown', function (e) {
					if (!(e.key === 'Enter' && (e.metaKey || e.ctrlKey))) return;

					if (e.target && 'form' in e.target) {
						const formElement = e.target.form as HTMLFormElement;
						formElement?.submit();
					}
				});
			}
		}
	});

	$effect(() => {
		if (chat_history.messages.length > 0) {
			scrollToBottom();
		}
	});

	// Save to localStorage whenever messages change
	$effect(() => {
		if (browser) {
			localStorage.setItem('chat_history', JSON.stringify(chat_history));
		}
	});

	$effect(() => {
		if (browser) {
			localStorage.setItem('artboard_history', artboardStore.design_json || '');
		}
	});

	// Save chat settings to localStorage whenever they change
	$effect(() => {
		if (browser) {
			localStorage.setItem('chat_settings', JSON.stringify(artboardStore.chatSettings));
		}
	});

	// Function to generate design using the two-step approach with separate endpoints
	async function executeDessignPipeline() {
		if (!prompt.trim()) {
			console.error('No prompt provided');
			addMessage('info', [
				{ role: 'user', content: [{ type: 'text', text: 'No prompt provided' }] }
			]);
			return;
		}

		isGeneratingHTML = true;
		generationError = '';
		processedImageItems.clear();
		designId = null;
		designJson = null;

		try {
			// Capture the current design state as a screenshot
			const { url: canvasScreenshotUrl, error } = await captureCanvasScreenshot(canvasSelector);

			if (error || !canvasScreenshotUrl) {
				throw new Error(error?.message || 'Failed to capture canvas screenshot');
			}

			addMessage('image', [
				{
					role: 'user',
					content: [{ type: 'image_url', image_url: { url: canvasScreenshotUrl, detail: 'high' } }]
				}
			]);

			addMessage('user', [{ role: 'user', content: [{ type: 'text', text: prompt }] }]);

			// Set initial loading state
			artboardStore.isLoading = true;

			// Step 1: Get design JSON with image placeholders
			addMessage('info', [
				{
					role: 'assistant',
					content: [{ type: 'text', text: 'Step 1: Generating design structure...' }]
				}
			]);

			console.log(
				'🎨 (VisionChat.svelte) [design-json/step1] chat_history.messages',
				JSON.stringify(chat_history.messages, null, 2)
			);

			const designResponse = await fetch('/api/generate-design/step1', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					prompt: prompt.trim(),
					previous_design_json:
						typeof artboardStore.design_json === 'string'
							? artboardStore.design_json
							: JSON.stringify(artboardStore.design_json || '{}'),
					artboard_size: `width: ${artboardStore.artboard_width}px, height: ${artboardStore.artboard_height}px`,
					skip_concept: artboardStore.chatSettings.skip_concept,
					chat_history_messages: chat_history.messages
				})
			});

			if (!designResponse.ok) {
				const errorData = await designResponse.json();
				console.error('Failed to generate design structure:', errorData);
				throw new Error(errorData.error || 'Failed to generate design structure');
			}

			let step_one_response: {
				design_json: StructuredDesign;
				design_generation_id: string;
				step_one_concept: string;
			} = await designResponse.json();
			console.log('step1Response', step_one_response);

			// Add defensive checking for required properties
			if (!step_one_response || !step_one_response.design_json) {
				throw new Error('Invalid response structure: design_json is missing');
			}

			if (!step_one_response.design_json.artboard) {
				throw new Error('Invalid design structure: artboard is missing');
			}

			if (
				typeof step_one_response.design_json.artboard.width !== 'number' ||
				typeof step_one_response.design_json.artboard.height !== 'number'
			) {
				throw new Error('Invalid artboard dimensions');
			}

			artboardStore.design_json = step_one_response.design_json;
			artboardStore.design_concept = step_one_response.step_one_concept;
			artboardStore.current_generation_id = step_one_response.design_generation_id;
			artboardStore.artboard_width = step_one_response.design_json.artboard.width;
			artboardStore.artboard_height = step_one_response.design_json.artboard.height;

			// Check if any image items reference existing image IDs
			step_one_response.design_json.items = step_one_response.design_json.items.map((item: any) => {
				// If this is an image item with an imageId that exists in our existing images
				if (
					item.item &&
					typeof item.item === 'object' &&
					'id' in item.item &&
					item.item.id &&
					artboardStore.all_images.find((image) => image.id === item.item.id)
				) {
					const existingImage = artboardStore.all_images.find((image) => image.id === item.item.id);
					// Update with information from the existing image
					if (existingImage) {
						addMessage('info', [
							{
								role: 'assistant',
								content: [{ type: 'text', text: `Found existing image: ${existingImage.id}` }]
							}
						]);
						return {
							...item,
							item: {
								id: item.item.id,
								url: existingImage.url,
								description: existingImage.description
							}
						};
					}
				}
				return item;
			});

			artboardStore.image_enriched_design_json = step_one_response.design_json;

			if (step_one_response.step_one_concept) {
				addMessage('assistant', [
					{
						role: 'assistant',
						content: [{ type: 'text', text: step_one_response.step_one_concept }]
					}
				]);
			}

			addMessage('info', [
				{
					role: 'user',
					content: [{ type: 'text', text: 'Design structure created. Generating images...' }]
				}
			]);

			// Step 2: Process images
			if (artboardStore.image_enriched_design_json) {
				const new_design_elements = await Promise.all(
					artboardStore.image_enriched_design_json.items.map(async (image_element, index) => {
						if (image_element.item.type === 'new_image') {
							try {
								const imageResponse = await fetch('/api/generate-design/image-pipeline', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json'
									},
									body: JSON.stringify({
										image_item: image_element
									})
								});

								if (!imageResponse.ok) {
									const errorData = await imageResponse.json();
									console.error(`Failed to process image: ${errorData.error}`);
									return image_element;
								}

								const imageData = await imageResponse.json();
								console.log('Generated Image:', imageData);

								// Add the image to the store
								addImageToStore('generated', {
									id: imageData.image_id,
									url: imageData.image_url,
									description: imageData.image_description
								});

								// Add the image to the chat history
								addMessage('image', [
									{
										role: 'user',
										content: [
											{ type: 'image_url', image_url: { url: imageData.image_url, detail: 'high' } }
										]
									}
								]);

								return {
									...image_element,
									item: {
										...image_element.item,
										id: imageData.image_id,
										url: imageData.image_url,
										description: imageData.image_description
									}
								};
							} catch (err) {
								console.error('Error processing image:', err);
								processingImageCount++;
								return image_element;
							}
						}
						return image_element;
					})
				);
				artboardStore.image_enriched_design_json.items = new_design_elements || [];
			}

			// Clear the prompt and complete
			prompt = '';
			artboardStore.isLoading = false;
			addMessage('info', [
				{ role: 'assistant', content: [{ type: 'text', text: 'Design created successfully!' }] }
			]);
		} catch (e) {
			console.error('Error generating design:', e);
			generationError = e instanceof Error ? e.message : 'Failed to generate design';
			addMessage('error', [
				{
					role: 'user',
					content: [{ type: 'text', text: `Design generation failed: ${generationError}` }]
				}
			]);
			artboardStore.isLoading = false;
		} finally {
			isGeneratingHTML = false;
		}
	}
</script>

<div class="relative h-full overflow-hidden bg-card">
	<!-- Messages area with ScrollArea -->
	<ScrollArea.Root
		class="relative flex h-[calc(100vh-250px)] flex-1 flex-col px-2"
		id="scroll-area"
	>
		{#each chat_history.messages as message (message.id)}
			<ChatMessage {message} />
		{/each}

		{#if isLoading || isCapturingImage || isGeneratingHTML}
			<div class="flex justify-center py-4">
				<Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		{/if}

		{#if error || generationError}
			<div class="rounded-md bg-destructive/10 p-3 text-destructive">
				<div class="flex items-center gap-2">
					<AlertTriangle class="h-4 w-4" />
					<span>Error: {error || generationError}</span>
				</div>
			</div>
		{/if}
		<ScrollArea.Scrollbar orientation="vertical" />
	</ScrollArea.Root>

	<!-- Input area - fixed at bottom of container -->
	<div class="flex h-full flex-1 flex-col p-2">
		<div class="flex-0 flex flex-col rounded-md border-2 border-border p-2">
			<form
				onsubmit={(e) => {
					executeDessignPipeline();
				}}
				class=""
			>
				<Textarea
					bind:value={prompt}
					{placeholder}
					id="prompt-textarea"
					class="resize-vertical h-21 min-h-16 w-full rounded border-2 border-border bg-background p-1 text-sm focus:border-background focus:outline-none focus:ring-2 focus:ring-primary"
					disabled={isLoading || isCapturingImage || isGeneratingHTML}
				/>
				<div class="relative flex flex-row justify-between gap-1">
					<Button
						size="xs"
						variant="secondary"
						onclick={() => {
							clearMessages();
						}}
					>
						CLEAR
					</Button>
					<!-- Skip Concept -->
					<div class="flex flex-row gap-2">
						<Button
							class="{artboardStore.chatSettings.skip_concept
								? 'bg-destructive text-destructive-foreground'
								: 'bg-accent text-accent-foreground'} px-1 py-0.5 text-xs"
							size="xs"
							variant={artboardStore.chatSettings.skip_concept ? 'destructive' : 'secondary'}
							onclick={() => {
								artboardStore.chatSettings.skip_concept = !artboardStore.chatSettings.skip_concept;
							}}
						>
							{#if artboardStore.chatSettings.skip_concept}
								<Ban class="mr-0.5 h-3 w-3" />
								Will Skip Concept
							{:else}
								<Lightbulb class="mr-0.5 h-3 w-3" />
								Concepting is On
							{/if}
						</Button>
						<!-- Generate Design -->
						<Button
							class="relative flex p-0.5 px-1.5 text-xs"
							type="submit"
							size="xs"
							variant="default"
							disabled={isLoading || isCapturingImage || isGeneratingHTML || !prompt.trim()}
						>
							{#if isGeneratingHTML}
								<Loader2 class="mr-1 h-3 w-3 animate-spin" />
								{#if processingImageCount > 0 && totalImagesToProcess > 0}
									Creating... ({processingImageCount}/{totalImagesToProcess})
								{:else}
									Creating...
								{/if}
							{:else}
								<Paintbrush class="mr-1 h-3 w-3 " />
								Generate Design
							{/if}
						</Button>
					</div>
				</div>
			</form>
		</div>
	</div>
</div>
