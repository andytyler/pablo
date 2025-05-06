<script lang="ts">
	import TestFabric from '$lib/components/artboard/testFabric.svelte';
</script>

<div class="flex h-screen w-full flex-col">
	<div class="flex flex-row items-center justify-between border-b p-4">
		<h1 class="text-xl font-bold">Design Editor</h1>
		<div class="flex flex-row gap-2"></div>
	</div>

	<div class="flex flex-1 overflow-hidden">
		<!-- Renderer goes here -->
		<TestFabric />
	</div>
</div>
