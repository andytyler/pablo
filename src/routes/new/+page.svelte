<script lang="ts">
	import Artboard from '$lib/components/artboard/Artboard.svelte';
	import AssistantPanel from '$lib/components/chat/AssistantPanel.svelte';
	import * as Resizable from '$lib/components/ui/resizable';
</script>

<div class="flex h-screen w-screen flex-1 flex-row overflow-hidden">
	<!-- Design canvas with artboard controls -->

	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane>
			<Artboard />
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane>
			<AssistantPanel canvasSelector="#design-canvas" />
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
