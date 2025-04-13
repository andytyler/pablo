<script context="module">
	// Helper function to convert RGB to HEX
	function rgbToHex(rgb: string) {
		// Extract RGB values
		const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		if (!match) return '#000000';

		function hex(x: string) {
			return ('0' + parseInt(x).toString(16)).slice(-2);
		}

		return '#' + hex(match[1]) + hex(match[2]) + hex(match[3]);
	}

	// Helper function to get rotation degrees from transform
	function getRotationDegrees(transform: string): number {
		if (!transform) return 0;
		const match = transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
		return match ? parseInt(match[1]) : 0;
	}
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { htmlStore } from '$lib/stores/htmlStore';

	// Font options
	const fontFamilies = [
		'Arial, sans-serif',
		'Helvetica, sans-serif',
		'Georgia, serif',
		'Times New Roman, serif',
		'Courier New, monospace',
		'Verdana, sans-serif',
		'system-ui, sans-serif',
		'Segoe UI, sans-serif'
	];

	const textAlignOptions = ['left', 'center', 'right', 'justify'];
	const fontWeightOptions = [
		'normal',
		'bold',
		'100',
		'200',
		'300',
		'400',
		'500',
		'600',
		'700',
		'800',
		'900'
	];
	const fontStyleOptions = ['normal', 'italic'];

	// Function to update element style
	function updateStyle(property: string, value: string) {
		htmlStore.updateStyles({
			...$htmlStore.elementStyles,
			[property]: value
		});

		// The updateStyles method already marks the store as modified
	}

	// Check if the selected element is an image
	let isImage = $derived($htmlStore.selectedElement?.tagName === 'IMG');

	// Value state for tabs
	let activeTab = $state('style');

	// Border style value
	let borderStyle = $state($htmlStore.elementStyles.borderStyle || 'none');
	let fontFamily = $state($htmlStore.elementStyles.fontFamily || 'Arial, sans-serif');
	let fontWeight = $state($htmlStore.elementStyles.fontWeight || 'normal');

	// Handle changes for select fields
	$effect(() => {
		if (borderStyle) {
			updateStyle('borderStyle', borderStyle);
		}
	});

	// Reactive update when selected element changes
	$effect(() => {
		if ($htmlStore.selectedElement) {
			borderStyle = $htmlStore.elementStyles.borderStyle || 'none';
			fontFamily = $htmlStore.elementStyles.fontFamily || 'Arial, sans-serif';
			fontWeight = $htmlStore.elementStyles.fontWeight || 'normal';
		}
	});
</script>

<div class="properties-panel p-4">
	{#if $htmlStore.selectedElement}
		<Tabs bind:value={activeTab}>
			<TabsList class="grid w-full grid-cols-2">
				<TabsTrigger value="style">Style</TabsTrigger>
				<TabsTrigger value="layout">Layout</TabsTrigger>
			</TabsList>

			<TabsContent value="style" class="mt-2">
				<!-- Style Properties -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-sm">Appearance</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						{#if isImage}
							<!-- Image specific controls -->
							<div class="space-y-2">
								<Label for="img-src">Image Source</Label>
								<Input
									id="img-src"
									value={$htmlStore.selectedElement?.getAttribute('src') || ''}
									onchange={(e: Event) => {
										const target = e.target as HTMLInputElement;
										$htmlStore.selectedElement?.setAttribute('src', target.value);
									}}
								/>
							</div>
							<div class="space-y-2">
								<Label for="img-alt">Alt Text</Label>
								<Input
									id="img-alt"
									value={$htmlStore.selectedElement?.getAttribute('alt') || ''}
									onchange={(e: Event) => {
										const target = e.target as HTMLInputElement;
										$htmlStore.selectedElement?.setAttribute('alt', target.value);
									}}
								/>
							</div>
						{:else}
							<!-- Text element controls -->
							<div class="space-y-2">
								<Label for="font-family">Font</Label>
								<select
									id="font-family"
									class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									bind:value={fontFamily}
									on:change={() => updateStyle('fontFamily', fontFamily)}
								>
									{#each fontFamilies as font}
										<option value={font}>{font}</option>
									{/each}
								</select>
							</div>

							<div class="space-y-2">
								<Label for="font-size">Font Size</Label>
								<div class="flex items-center gap-2">
									<Slider
										id="font-size"
										min={8}
										max={72}
										step={1}
										value={[parseInt($htmlStore.elementStyles.fontSize || '16') || 16]}
										onValueChange={([val]: number[]) => updateStyle('fontSize', `${val}px`)}
									/>
									<span class="w-10 text-right text-sm">
										{parseInt($htmlStore.elementStyles.fontSize || '16') || 16}px
									</span>
								</div>
							</div>

							<div class="space-y-2">
								<Label for="font-weight">Font Weight</Label>
								<select
									id="font-weight"
									class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									bind:value={fontWeight}
									on:change={() => updateStyle('fontWeight', fontWeight)}
								>
									{#each fontWeightOptions as weight}
										<option value={weight}>{weight}</option>
									{/each}
								</select>
							</div>

							<div class="space-y-2">
								<Label for="font-style">Font Style</Label>
								<select
									id="font-style"
									class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									value={$htmlStore.elementStyles.fontStyle || 'normal'}
									on:change={(e: Event) =>
										updateStyle('fontStyle', (e.target as HTMLSelectElement).value)}
								>
									{#each fontStyleOptions as style}
										<option value={style}>{style}</option>
									{/each}
								</select>
							</div>

							<div class="space-y-2">
								<Label for="text-align">Text Align</Label>
								<select
									id="text-align"
									class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									value={$htmlStore.elementStyles.textAlign || 'left'}
									on:change={(e: Event) =>
										updateStyle('textAlign', (e.target as HTMLSelectElement).value)}
								>
									{#each textAlignOptions as align}
										<option value={align}>{align}</option>
									{/each}
								</select>
							</div>
						{/if}

						<!-- Common style controls -->
						<div class="space-y-2">
							<Label for="text-color">Text Color</Label>
							<div class="flex gap-2">
								<div
									class="h-8 w-8 rounded-md border"
									style:background-color={$htmlStore.elementStyles.color || '#000000'}
								></div>
								<Input
									id="text-color"
									type="color"
									value={$htmlStore.elementStyles.color?.startsWith('rgb')
										? rgbToHex($htmlStore.elementStyles.color)
										: $htmlStore.elementStyles.color || '#000000'}
									onchange={(e: Event) => {
										const target = e.target as HTMLInputElement;
										updateStyle('color', target.value);
									}}
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="bg-color">Background Color</Label>
							<div class="flex gap-2">
								<div
									class="h-8 w-8 rounded-md border"
									style:background-color={$htmlStore.elementStyles.backgroundColor || 'transparent'}
								></div>
								<Input
									id="bg-color"
									type="color"
									value={$htmlStore.elementStyles.backgroundColor?.startsWith('rgb')
										? rgbToHex($htmlStore.elementStyles.backgroundColor)
										: $htmlStore.elementStyles.backgroundColor || '#ffffff'}
									onchange={(e: Event) => {
										const target = e.target as HTMLInputElement;
										updateStyle('backgroundColor', target.value);
									}}
								/>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</TabsContent>

			<TabsContent value="layout" class="mt-2">
				<!-- Layout Properties -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-sm">Position & Size</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-2">
								<Label for="pos-x">X Position</Label>
								<Input
									id="pos-x"
									type="number"
									value={parseInt($htmlStore.elementStyles.left || '0')}
									onchange={(e: Event) => {
										const target = e.target as HTMLInputElement;
										updateStyle('left', `${target.value}px`);
									}}
								/>
							</div>
							<div class="space-y-2">
								<Label for="pos-y">Y Position</Label>
								<Input
									id="pos-y"
									type="number"
									value={parseInt($htmlStore.elementStyles.top || '0')}
									onchange={(e: Event) => {
										const target = e.target as HTMLInputElement;
										updateStyle('top', `${target.value}px`);
									}}
								/>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-2">
								<Label for="width">Width</Label>
								<Input
									id="width"
									type="number"
									value={parseInt($htmlStore.elementStyles.width || '0')}
									onchange={(e: Event) => {
										const target = e.target as HTMLInputElement;
										updateStyle('width', `${target.value}px`);
									}}
								/>
							</div>
							<div class="space-y-2">
								<Label for="height">Height</Label>
								<Input
									id="height"
									type="number"
									value={parseInt($htmlStore.elementStyles.height || '0')}
									onchange={(e: Event) => {
										const target = e.target as HTMLInputElement;
										updateStyle('height', `${target.value}px`);
									}}
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="rotation">Rotation (degrees)</Label>
							<div class="flex items-center gap-2">
								<Slider
									id="rotation"
									min={0}
									max={360}
									step={1}
									value={[getRotationDegrees($htmlStore.elementStyles.transform)]}
									onValueChange={([val]: number[]) => updateStyle('transform', `rotate(${val}deg)`)}
								/>
								<span class="w-10 text-right text-sm">
									{getRotationDegrees($htmlStore.elementStyles.transform)}°
								</span>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</TabsContent>
		</Tabs>
	{:else}
		<div class="grid h-full place-items-center">
			<div class="text-center text-muted-foreground">
				<p class="mb-4 text-sm">No element selected</p>
				<p class="text-xs">Click on an element in the artboard to edit its properties.</p>
			</div>
		</div>
	{/if}
</div>
