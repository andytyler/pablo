<script lang="ts">
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import * as ScrollArea from '$lib/components/ui/scroll-area';
	import { supabase } from '$lib/connections/supabase';
	import { addMessageToFrameStore } from '$lib/stores/frame-messages-store.svelte';
	import {
		addImageToFrameStore,
		frameStore,
		removeImageFromFrameStore
	} from '$lib/stores/frame-store.svelte';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Upload from 'lucide-svelte/icons/upload';
	import X from 'lucide-svelte/icons/x';
	import { onMount } from 'svelte';
	// Props using Svelte 5 syntax
	const { bucketName = 'user-image-uploads' } = $props<{
		bucketName?: string;
	}>();

	// State using Svelte 5 runes
	let fileInput: HTMLInputElement;
	let dropArea: HTMLDivElement;
	let isDragging = $state(false);
	let isUploading = $state(false);
	let error = $state<string | null>(null);

	// Setup paste event handler
	onMount(() => {
		if (browser) {
			// Listen for paste events
			document.addEventListener('paste', handlePaste);

			return () => {
				document.removeEventListener('paste', handlePaste);
			};
		}
	});

	// Handle paste events
	async function handlePaste(e: ClipboardEvent) {
		if (e.clipboardData && e.clipboardData.items) {
			for (let i = 0; i < e.clipboardData.items.length; i++) {
				const item = e.clipboardData.items[i];

				if (item.type.indexOf('image') !== -1) {
					const blob = item.getAsFile();
					if (blob) {
						await uploadFile(blob);
					}
				}
			}
		}
	}

	// Handle file input change
	async function handleFileInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files) {
			for (let i = 0; i < target.files.length; i++) {
				const file = target.files[i];
				if (file.type.startsWith('image/')) {
					await uploadFile(file);
				} else {
					error = 'Only image files are allowed';
					setTimeout(() => {
						error = null;
					}, 3000);
				}
			}
			// Clear the input value to allow uploading the same file again
			target.value = '';
		}
	}

	// Handle drag events
	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = true;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;

		if (e.dataTransfer && e.dataTransfer.files) {
			for (let i = 0; i < e.dataTransfer.files.length; i++) {
				const file = e.dataTransfer.files[i];
				if (file.type.startsWith('image/')) {
					await uploadFile(file);
				} else {
					error = 'Only image files are allowed';
					setTimeout(() => {
						error = null;
					}, 3000);
				}
			}
		}
	}

	// Upload file to Supabase
	async function uploadFile(file: File) {
		isUploading = true;
		error = null;

		try {
			// Generate a unique file name
			const timestamp = new Date().getTime();
			const fileExt = file.name.split('.').pop();
			const fileName = `uploads/${timestamp}.${fileExt}`;
			const fileKey = `uploads/${timestamp}.${fileExt}`;

			// Upload file to Supabase
			const { data, error: uploadError } = await supabase.storage
				.from(bucketName)
				.upload(fileKey, file);

			if (uploadError) {
				throw uploadError;
			}

			// Get the public URL
			const { data: urlData } = await supabase.storage
				.from(bucketName)
				.createSignedUrl(fileKey, 60000);
			console.log('🎨 [pasteImage] urlData', urlData);

			if (urlData) {
				// Add to messages context
				addMessageToFrameStore('image', [
					{
						role: 'user',
						content: [
							{
								type: 'image_url',
								image_url: {
									url: urlData.signedUrl,
									detail: 'high'
								}
							},
							{
								type: 'text',
								text: `Above image has been uploaded. Image ID: '${fileKey}' \n Description: '${file.name}'`
							}
						]
					}
				]);
				// store images
				addImageToFrameStore('uploaded', {
					url: urlData.signedUrl,
					description: `${file.name}`,
					id: fileKey
				});
			}
		} catch (err: any) {
			console.error('Error uploading file:', err);
			error = err.message || 'Error uploading file';
			setTimeout(() => {
				error = null;
			}, 3000);
		} finally {
			isUploading = false;
		}
	}

	// Delete an image
	async function deleteImage(id: string) {
		try {
			const imageToDelete = frameStore.images.uploaded.find((image) => image.id === id);

			if (!imageToDelete) {
				console.error('Image to delete not found');
				return;
			}

			// Delete from Supabase
			const { error: deleteError } = await supabase.storage
				.from(bucketName)
				.remove([imageToDelete.id]);

			if (deleteError) {
				throw deleteError;
			}

			removeImageFromFrameStore(id);
		} catch (err: any) {
			console.error('Error deleting image:', err);
			error = err.message || 'Error deleting image';
			setTimeout(() => {
				error = null;
			}, 3000);
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div
		role="button"
		tabindex="0"
		class="relative flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 transition-colors {isDragging
			? 'border-primary bg-primary/5'
			: 'border-border'}"
		ondragenter={handleDragEnter}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		bind:this={dropArea}
	>
		<Upload class="h-10 w-10 text-muted-foreground" />
		<p class="text-center text-sm font-medium">
			Drag and drop images here
			<br />
			<span class="text-muted-foreground">or</span>
		</p>
		<input
			type="file"
			accept="image/*"
			multiple
			class="hidden"
			onchange={handleFileInputChange}
			bind:this={fileInput}
		/>
		<Button variant="outline" onclick={() => fileInput.click()}>Select images</Button>
		<p class="text-xs text-muted-foreground">Paste from clipboard also works (Ctrl+V / ⌘+V)</p>

		{#if error}
			<div class="mt-2 rounded-md bg-destructive/10 p-2 text-center text-sm text-destructive">
				{error}
			</div>
		{/if}
	</div>

	{#if isUploading}
		<div class="flex items-center justify-center p-4">
			<Loader2 class="mr-2 h-4 w-4 animate-spin" />
			<span>Uploading...</span>
		</div>
	{/if}

	{#if frameStore.images.uploaded?.length > 0}
		<div class="mt-2">
			<p class="mb-2 text-sm font-medium">
				Uploaded Images ({frameStore.images.uploaded?.length})
			</p>
			<ScrollArea.Root class="h-[200px]">
				<div class="grid grid-cols-3 gap-2 p-1 md:grid-cols-4">
					{#each frameStore.images.uploaded as image}
						<Card class="relative overflow-hidden">
							<img
								src={image.url}
								alt={`Uploaded image ${image.description}`}
								class="aspect-square h-full w-full object-cover"
							/>
							<button
								class="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-foreground hover:bg-destructive hover:text-destructive-foreground"
								onclick={() => {
									deleteImage(image.id);
								}}
							>
								<X class="h-4 w-4" />
							</button>
						</Card>
					{/each}
				</div>
				<ScrollArea.Scrollbar orientation="vertical" />
			</ScrollArea.Root>
		</div>
	{/if}
</div>
