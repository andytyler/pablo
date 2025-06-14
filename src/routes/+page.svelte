<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { LiquidGlass } from 'liquid-glass-svelte';
	import { ArrowRight } from 'lucide-svelte';
	// Cycling text animation
	const designTypes = [
		'Design',
		'Poster',
		'LinkedIn Post',
		'Instagram Story',
		'Web Page',
		'Logo',
		'Banner'
	];
	let currentIndex = $state(0);

	$effect(() => {
		const interval = setInterval(() => {
			currentIndex = (currentIndex + 1) % designTypes.length;
		}, 2500);

		return () => clearInterval(interval);
	});
</script>

<!-- Hero Section: Minimal, centered, clean -->
<div
	class=" relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden text-foreground"
>
	<div class="absolute inset-0 z-0 hidden h-full w-full overflow-hidden px-48 py-32 md:block">
		<img
			src="/bg.png"
			alt="Dreamsurf"
			class="h-full w-full overflow-hidden object-cover opacity-25 backdrop-blur-sm"
		/>
	</div>
	<div class="absolute inset-0 left-0 top-0 z-10 hidden h-full w-full md:block">
		<div class="absolute left-48 top-0 h-full border-r border-border"></div>
		<div class="absolute right-48 top-0 h-full border-l border-border"></div>
		<div class="absolute left-0 top-32 w-full border-b border-border"></div>
		<div class="absolute bottom-32 right-0 w-full border-t border-border"></div>
		<div class="absolute bottom-0 right-0 w-full border-b border-border"></div>
	</div>

	<div class="relative z-10 flex w-full flex-col items-center justify-center px-4">
		<!-- Wordmark and logo -->
		<div class="flex flex-row items-center justify-center gap-2 pb-8">
			<img src="/logo.png" alt="Dreamsurf" class="h-10 w-auto" />
			<span class="text-3xl font-bold tracking-wider text-foreground drop-shadow-lg">Dreamsurf</span
			>
		</div>

		<!-- Announcement pill -->
		<LiquidGlass style="border-radius: 5rem" class="drop-shadow-lg ">
			<a href="/canvas">
				<div
					class="group flex flex-row items-center justify-center rounded-xl px-8 py-2 text-xs text-foreground transition-all duration-300"
				>
					<span class="text-foreground">Dreamsurf AI is here</span>
					<ArrowRight
						class="ml-2 h-4 w-4 text-foreground transition-all duration-300 group-hover:translate-x-2"
					/>
				</div>
			</a>
		</LiquidGlass>

		<!-- Main Headline -->
		<h1 class="my-6 text-center text-5xl font-extrabold text-foreground drop-shadow-lg md:text-7xl">
			Design magic.<br />With Dreamsurf.
		</h1>

		<!-- Subheadline -->
		<p class="mb-10 max-w-2xl text-center text-xl text-foreground drop-shadow-lg md:text-2xl">
			Dreamsurf is the AI design tool that creates your designs, and lets you edit them.
		</p>

		<!-- CTA Buttons -->
		<div class="flex flex-col justify-center gap-4 sm:flex-row">
			<Button
				size="lg"
				class="rounded-xl bg-accent px-8 py-4 text-lg font-semibold text-white shadow "
			>
				Design magic
			</Button>
		</div>
	</div>
</div>

<div id="demo" class="py-20">
	<div class="container mx-auto text-center">
		<h2 class="mb-4 text-3xl font-bold">Watch It In Action</h2>
		<p class="mb-8 text-muted-foreground">
			Demo video coming soon. See how easy it is to go from prompt to design.
		</p>
		<div class="mx-auto flex max-w-4xl items-center justify-center rounded p-0">
			<blockquote class="twitter-tweet m-0 p-0" data-media-max-width="1920">
				<p lang="en" dir="ltr">
					Instantly edit AI images. No generation delay.<br /><br />Are designers cooked?<br /><br
					/>Introducing Dreamsurf. Prompt to Graphic Design.
					<a href="https://t.co/chnd40kaSg">pic.twitter.com/ch nd40kaSg</a>
				</p>
				&mdash; Andy T (@Andy_AJT)
				<a href="https://twitter.com/Andy_AJT/status/1922725276477227471?ref_src=twsrc%5Etfw"
					>May 14, 2025</a
				>
			</blockquote>
			<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
		</div>
	</div>
</div>

<style>
</style>
