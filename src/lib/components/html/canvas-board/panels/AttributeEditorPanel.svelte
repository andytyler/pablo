<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	export let selectedItems: Array<{
		element: HTMLElement;
		x: number;
		y: number;
		width: number;
		height: number;
		styles?: Set<string>;
	}> = [];

	// Add callback prop for style updates
	export let onStylesUpdate: (element: HTMLElement, styles: Set<string>) => void;

	// State for new class input
	let newClassInput = '';

	// Get current classes as an array
	$: currentClasses =
		selectedItems.length === 1 ? Array.from(selectedItems[0].styles || new Set()) : [];

	// Common Tailwind class groups for quick access
	const commonClassGroups = {
		font: {
			weight: [
				{ label: 'B', class: 'font-bold', title: 'Bold' },
				{ label: 'M', class: 'font-medium', title: 'Medium' },
				{ label: 'L', class: 'font-light', title: 'Light' }
			],
			style: [
				{ label: 'I', class: 'italic', title: 'Italic' },
				{ label: 'U', class: 'underline', title: 'Underline' }
			]
		},
		text: {
			align: [
				{ label: '←', class: 'text-left', title: 'Align Left' },
				{ label: '↔', class: 'text-center', title: 'Align Center' },
				{ label: '→', class: 'text-right', title: 'Align Right' }
			],
			size: [
				{ label: 'S', class: 'text-sm', title: 'Small Text' },
				{ label: 'M', class: 'text-base', title: 'Medium Text' },
				{ label: 'L', class: 'text-lg', title: 'Large Text' },
				{ label: 'XL', class: 'text-xl', title: 'Extra Large Text' }
			]
		}
	};

	function hasClass(className: string): boolean {
		if (selectedItems.length !== 1) return false;
		return selectedItems[0].styles?.has(className) || false;
	}

	function toggleClass(className: string) {
		if (selectedItems.length !== 1) return;
		const item = selectedItems[0];
		const styles = new Set(item.styles || []);

		// Remove related classes first (e.g., different font weights)
		if (className.startsWith('font-')) {
			['font-bold', 'font-medium', 'font-light'].forEach((cls) => styles.delete(cls));
		} else if (className.startsWith('text-')) {
			if (
				className.includes('text-sm') ||
				className.includes('text-base') ||
				className.includes('text-lg') ||
				className.includes('text-xl')
			) {
				['text-sm', 'text-base', 'text-lg', 'text-xl'].forEach((cls) => styles.delete(cls));
			}
			if (
				className.includes('text-left') ||
				className.includes('text-center') ||
				className.includes('text-right')
			) {
				['text-left', 'text-center', 'text-right'].forEach((cls) => styles.delete(cls));
			}
		}

		// Toggle the class
		if (styles.has(className)) {
			styles.delete(className);
		} else {
			styles.add(className);
		}

		// Update the styles through callback
		onStylesUpdate(item.element, styles);
	}

	function addClass() {
		if (selectedItems.length !== 1 || !newClassInput.trim()) return;
		const item = selectedItems[0];
		const styles = new Set(item.styles || []);

		const classes = newClassInput.trim().split(/\s+/);
		classes.forEach((cls) => {
			if (cls) styles.add(cls);
		});

		// Update the styles through callback
		onStylesUpdate(item.element, styles);
		newClassInput = '';
	}

	function removeClass(className: string) {
		if (selectedItems.length !== 1) return;
		const item = selectedItems[0];
		const styles = new Set(item.styles || []);

		styles.delete(className);

		// Update the styles through callback
		onStylesUpdate(item.element, styles);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			addClass();
		}
	}
</script>

<div
	class="absolute right-5 top-5 z-50 w-[300px] rounded-lg bg-card/30 p-4 shadow-lg backdrop-blur-sm"
>
	{#if selectedItems.length === 0}
		<div class="py-4 text-center text-muted-foreground">No element selected</div>
	{:else if selectedItems.length > 1}
		<div class="py-4 text-center text-muted-foreground">
			Multiple elements selected ({selectedItems.length})
		</div>
	{:else}
		<div class="space-y-4">
			<!-- Element Type -->
			<div class="text-sm font-medium text-muted-foreground">
				{selectedItems[0].element.tagName.toLowerCase()}
			</div>

			<!-- Quick Access Controls -->
			<div class="space-y-2">
				<!-- Font Controls -->
				<div class="flex gap-1">
					{#each commonClassGroups.font.weight as control}
						<Button
							variant={hasClass(control.class) ? 'default' : 'outline'}
							size="sm"
							onclick={() => toggleClass(control.class)}
							title={control.title}
						>
							{control.label}
						</Button>
					{/each}
					{#each commonClassGroups.font.style as control}
						<Button
							variant={hasClass(control.class) ? 'default' : 'outline'}
							size="sm"
							onclick={() => toggleClass(control.class)}
							title={control.title}
						>
							{control.label}
						</Button>
					{/each}
				</div>

				<!-- Text Controls -->
				<div class="flex gap-1">
					{#each commonClassGroups.text.align as control}
						<Button
							variant={hasClass(control.class) ? 'default' : 'outline'}
							size="sm"
							onclick={() => toggleClass(control.class)}
							title={control.title}
						>
							{control.label}
						</Button>
					{/each}
				</div>

				<div class="flex gap-1">
					{#each commonClassGroups.text.size as control}
						<Button
							variant={hasClass(control.class) ? 'default' : 'outline'}
							size="sm"
							onclick={() => toggleClass(control.class)}
							title={control.title}
						>
							{control.label}
						</Button>
					{/each}
				</div>
			</div>

			<!-- Current Classes -->
			<div class="space-y-2">
				<label class="text-sm font-medium text-card-foreground">Applied Classes</label>
				<div class="flex flex-wrap gap-1">
					{#each currentClasses as className}
						<Badge variant="outline" class="flex items-center gap-1">
							{className}
							<button
								class="ml-1 text-gray-500 hover:text-gray-700"
								onclick={() => removeClass(className as string)}
							>
								×
							</button>
						</Badge>
					{/each}
				</div>
			</div>

			<!-- Add New Classes -->
			<div class="space-y-2">
				<label class="text-sm font-medium text-card-foreground">Add Classes</label>
				<div class="flex gap-2">
					<Input
						type="text"
						bind:value={newClassInput}
						placeholder="Enter Tailwind classes..."
						onkeydown={handleKeydown}
					/>
					<Button onclick={addClass} size="sm">Add</Button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.attribute-editor {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 1000;
	}
</style>
