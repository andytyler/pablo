<script lang="ts">
	import ActionSidebar from '$lib/components/html/ActionSidebar.svelte';
	import ArtSpace from '$lib/components/html/ArtSpace.svelte';
	import * as Resizable from '$lib/components/ui/resizable';
</script>

<svelte:head>
	<script src="https://cdn.tailwindcss.com"></script>
</svelte:head>

<div
	class="absolute z-[-1] h-full w-full"
	style="background-image: radial-gradient(circle at 1px 1px, rgb(128,128,128) 1px, transparent 0), linear-gradient(to bottom, transparent, rgba(0,0,0,0.5)); background-size: 20px 20px, auto; background-repeat: repeat, no-repeat;"
></div>
<div class="flex h-screen w-screen flex-1 flex-row overflow-hidden">
	<!-- Design canvas with artboard controls -->
	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane defaultSize={70}>
			<ArtSpace />
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane defaultSize={30}>
			<ActionSidebar />
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
