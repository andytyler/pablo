<script lang="ts">
	import ActionSidebar from '$lib/components/html/ActionSidebar.svelte';
	import ArtSpace from '$lib/components/html/ArtSpace.svelte';
	import * as Resizable from '$lib/components/ui/resizable';
</script>

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
