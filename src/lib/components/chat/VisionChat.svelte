<script lang="ts">
	import { browser } from '$app/environment';
	import * as ScrollArea from '$lib/components/ui/scroll-area';
	import type { StructuredDesign } from '../../../routes/api/generate-design/step1/design';
	import { captureCanvasScreenshot } from '$lib/connections/screenshot';
	import { artboardStore } from '$lib/stores/artboard-store.svelte';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import Ban from '@lucide/svelte/icons/ban';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Paintbrush from '@lucide/svelte/icons/paintbrush';
	import { onMount } from 'svelte';
	import { Button } from '../ui/button';
	import { Textarea } from '../ui/textarea';
	// Props using Svelte 5 syntax
	let { canvasSelector = '#design-canvas', placeholder = 'Ask something about your design...' } =
		$props();

	import type { Design, DesignItem, Message } from '$lib/types';
	import ChatMessage from './ChatMessage.svelte';

	// State using Svelte 5 runes
	let messages = $state<Message[]>([]);
	let prompt = $state('');
	let isCapturingImage = $state(false);
	let isGeneratingHTML = $state(false);
	let generationError = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let processingImageCount = $state(0);
	let totalImagesToProcess = $state(0);
	let designId = $state<string | null>(null);
	let processedImageItems = $state<Map<string, DesignItem>>(new Map());
	// Store the current design JSON as an object (not a string)
	let designJson = $state<Design | null>(null);

	// Track when we're actively updating images to prevent recursive updates
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

	$effect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	});

	// const html_content = $derived(
	// 	artboardStore.image_enriched_design_json
	// 		? imageEnrichedDesignJsonToHtml(artboardStore.image_enriched_design_json)
	// 		: ''
	// );

	onMount(() => {
		scrollToBottom();

		// Load chat settings from localStorage if available
		if (browser) {
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
						formElement?.submit(); // or formElement?.requestSubmit() depending on your usecase
					}
				});
			}
		}
	});

	// Initialize from localStorage
	$effect(() => {
		if (browser) {
			const storedMessages = localStorage.getItem('chat_history');
			if (storedMessages) {
				try {
					const parsedMessages = JSON.parse(storedMessages);
					// Convert string timestamps back to Date objects
					parsedMessages.forEach((msg: any) => {
						if (typeof msg.timestamp === 'string') {
							msg.timestamp = new Date(msg.timestamp);
						}
					});
					messages = parsedMessages;
				} catch (error) {
					console.error('Failed to parse stored chat history:', error);
				}
			}
		}
	});

	// Save to localStorage whenever messages change
	$effect(() => {
		if (browser) {
			localStorage.setItem('chat_history', JSON.stringify(messages));
		}
	});

	// Save chat settings to localStorage whenever they change
	$effect(() => {
		if (browser) {
			localStorage.setItem('chat_settings', JSON.stringify(artboardStore.chatSettings));
		}
	});

	// Helper functions
	function generateId() {
		return Math.random().toString(36).substring(2, 10);
	}

	function addMessage(chat_role: Message['chat_role'], content: Message['content']) {
		const message: Message = {
			id: generateId(),
			chat_role: chat_role,
			content,
			timestamp: new Date()
		};
		messages = [...messages, message];
		return message;
	}

	function clearMessages() {
		if (browser) {
			localStorage.removeItem('chat_history');
		}
		messages = [];
	}

	// Function to generate design using the two-step approach with separate endpoints
	async function executeDessignPipeline() {
		if (!prompt.trim()) {
			console.error('No prompt provided');
			addMessage('info', [{ type: 'text', text: 'No prompt provided' }]);
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
				{ type: 'image_url', image_url: { url: canvasScreenshotUrl, detail: 'high' } }
			]);

			addMessage('user', [{ type: 'text', text: prompt }]);

			// Set initial loading state
			artboardStore.isLoading = true;

			// Step 1: Get design JSON with image placeholders
			addMessage('info', [{ type: 'text', text: 'Step 1: Generating design structure...' }]);

			const designResponse = await fetch('/api/generate-design/step1', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					prompt: prompt.trim(),
					image_url: canvasScreenshotUrl,
					previous_design_json:
						typeof artboardStore.design_json === 'string'
							? artboardStore.design_json
							: JSON.stringify(artboardStore.design_json || '{}'),
					artboard_size: `width: ${artboardStore.artboard_width}px, height: ${artboardStore.artboard_height}px`,
					skip_concept: artboardStore.chatSettings.skip_concept,
					uploadedImages: artboardStore.uploadedImages,
					existingImages: artboardStore.allImages
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

			artboardStore.design_json = JSON.stringify(step_one_response.design_json);
			artboardStore.design_concept = step_one_response.step_one_concept;
			artboardStore.current_generation_id = step_one_response.design_generation_id;
			artboardStore.artboard_height = step_one_response.design_json.artboard.height;
			artboardStore.artboard_width = step_one_response.design_json.artboard.width;

			// Check if any image items reference existing image IDs
			step_one_response.design_json.items = step_one_response.design_json.items.map((item: any) => {
				// If this is an image item with an imageId that exists in our existing images
				if (
					item.item &&
					typeof item.item === 'object' &&
					'id' in item.item &&
					item.item.id &&
					artboardStore.allImages[item.item.id]
				) {
					const existingImage = artboardStore.allImages[item.item.id];
					// Update with information from the existing image
					return {
						...item,
						item: {
							id: item.item.id,
							url: existingImage.url,
							description: existingImage.description
						}
					};
				}

				return item;
			});

			artboardStore.image_enriched_design_json = step_one_response.design_json;

			if (step_one_response.design_concept) {
				addMessage('assistant', [{ type: 'text', text: step_one_response.design_concept }]);
			}

			addMessage('system', [
				{ type: 'text', text: 'Design structure created. Generating images...' }
			]);

			// Step 2: Process images in parallel
			if (artboardStore.image_enriched_design_json) {
				// First, extract items that need image processing
				const itemsNeedingImages = artboardStore.image_enriched_design_json.items.filter(
					(item) =>
						item.item &&
						// Check if src exists and is falsy, or doesn't exist at all
						(('src' in item.item && !item.item.src) || !('src' in item.item))
				);

				totalImagesToProcess = itemsNeedingImages.length;
				processingImageCount = 0;

				// Process images in parallel
				const imagePromises = itemsNeedingImages.map(async (imageItem) => {
					try {
						const imageResponse = await fetch('/api/generate-design/image-pipeline', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								image_item: imageItem
							})
						});

						if (!imageResponse.ok) {
							const errorData = await imageResponse.json();
							console.error(`Failed to process image: ${errorData.error}`);
							processingImageCount++;
							return null;
						}

						const imageData = await imageResponse.json();
						console.log('imageData', imageData);

						// Safely update the store with an immutable update pattern
						if (artboardStore.image_enriched_design_json) {
							// Set flag to prevent effect from running during update
							isUpdatingImages = true;

							// Create a new items array with the updated item
							const updatedItems = artboardStore.image_enriched_design_json.items.map((item) =>
								item.item &&
								'id' in item.item &&
								imageData.image_id &&
								item.item.id === imageData.image_id
									? {
											...item,
											item: {
												id: imageData.image_id,
												url: imageData.image_url,
												description: imageData.image_description
											}
										}
									: item
							);

							// Update the store with a new object reference
							artboardStore.image_enriched_design_json = {
								...artboardStore.image_enriched_design_json,
								items: updatedItems
							};

							// Clear flag after update
							isUpdatingImages = false;
						}

						processingImageCount++;
						return imageData;
					} catch (err) {
						console.error('Error processing image:', err);
						processingImageCount++;
						return null;
					}
				});

				// Wait for all image processing to complete
				await Promise.all(imagePromises);
			}

			// Clear the prompt and complete
			prompt = '';
			artboardStore.isLoading = false;
			addMessage('system', [{ type: 'text', text: 'Design created successfully!' }]);
		} catch (e) {
			console.error('Error generating design:', e);
			generationError = e instanceof Error ? e.message : 'Failed to generate design';
			addMessage('error', [{ type: 'text', text: `Design generation failed: ${generationError}` }]);
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
		{#each messages as message (message.id)}
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
