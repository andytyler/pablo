<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import ThemeToggle from '$lib/components/ui/theme-toggle.svelte';
	import { site_config } from '../config';

	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Github from '@lucide/svelte/icons/github';
	import Instagram from '@lucide/svelte/icons/instagram';
	import Linkedin from '@lucide/svelte/icons/linkedin';
	import Twitter from '@lucide/svelte/icons/twitter';
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- Blurred background -->
<div class="relative h-screen w-screen overflow-hidden">
	<div class="absolute inset-0 z-0">
		<img src="/bg.png" class=" h-full w-full object-cover opacity-35" alt="Dreamsurf Background" />
		<div
			class="absolute -left-20 -top-20 h-[500px] w-[500px] animate-pulse rounded-full bg-primary/20 blur-3xl"
		></div>
		<div
			class="absolute right-0 top-1/4 h-[400px] w-[400px] animate-pulse rounded-full bg-secondary/20 blur-3xl delay-1000"
		></div>
		<div
			class="delay-2000 absolute bottom-0 left-1/4 h-[600px] w-[600px] animate-pulse rounded-full bg-accent/20 blur-3xl"
		></div>
	</div>
	<!-- Main content container with margin -->
	<div class="relative z-10 h-screen min-h-screen w-screen p-4 md:p-8 lg:p-12">
		<!-- Hero image container with rounded corners -->
		<div class="relative mb-8 h-[90vh] overflow-hidden rounded-3xl">
			<!-- Background image at the top -->
			<div
				class="absolute inset-0 h-full w-full bg-gradient-to-br from-background/60 via-background/40 to-background/60 backdrop-blur-sm"
			></div>

			<!-- Navbar overlay -->
			<header class="absolute top-0 z-30 w-full">
				<div class="container mx-auto flex items-center justify-between py-6">
					<div class="flex items-center gap-2">
						<img src="/logo.png" alt="Dreamsurf Logo" class="h-10" />
						<span class="text-2xl font-bold">Dreamsurf</span>
					</div>

					<div class="flex items-center gap-2">
						<ThemeToggle />
						<Button
							variant="secondary"
							onclick={() => (window.location.href = '/new')}
							class="relative overflow-hidden transition-shadow hover:shadow-md"
							>Start Dreaming</Button
						>
					</div>
				</div>
			</header>
			<div class="relative z-20 flex h-full flex-col items-center justify-center space-y-6">
				<h3 class="mb-8 text-center text-xl font-medium text-primary/90">
					Transform ideas into editable designs, instantly.
				</h3>
				<h1
					class="epic-title-first mb-2 flex items-center justify-center gap-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text align-middle text-6xl drop-shadow-lg md:text-8xl"
				>
					<span class="inline-block font-mono font-extrabold">Text</span>
					<span class="inline-block text-2xl font-bold uppercase">TO</span>
					<span class="epic-title-second inline-block font-serif font-extrabold">Design</span>
				</h1>

				<h2 class="my-8 max-w-lg text-center text-2xl font-bold text-muted-foreground md:text-3xl">
					Describe your design, Dreamsurf creates it, you edit it.
				</h2>

				<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row">
					<Button
						variant="secondary"
						size="lg"
						onclick={() => (window.location.href = '/waitlist')}
						class="group relative overflow-hidden transition-shadow hover:shadow-lg"
					>
						<span class="relative z-10">Join Waitlist</span>
						<span
							class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-foreground/20 to-transparent transition-transform duration-500 group-hover:translate-x-[100%]"
						></span>
						<ArrowRight class="ml-2 h-5 w-5" />
					</Button>

					<Button
						variant="outline"
						size="lg"
						onclick={() => (window.location.href = '/new')}
						class="border-primary/20 bg-background/40 backdrop-blur-sm hover:bg-primary/5"
					>
						See how it works
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Footer -->
<div class="relative z-10 pb-12 pt-24">
	<div class="container mx-auto px-4">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-5">
			<div class="md:col-span-2">
				<div class="flex items-center gap-2">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg">
						<img src="/logo.png" alt="Dreamsurf Logo" class="h-10" />
					</div>
					<span class="text-xl font-bold">Dreamsurf</span>
				</div>
				<p class="mt-4 max-w-md text-muted-foreground">
					AI designer, that lets you edit your AI-generated designs.
				</p>
				<div class="mt-6 flex space-x-4">
					<a href={site_config.socials.twitter} target="_blank" rel="noopener noreferrer">
						<Button
							variant="ghost"
							size="icon"
							class="rounded-full hover:bg-primary/10 dark:hover:bg-primary/20"
						>
							<Twitter class="h-5 w-5" />
						</Button>
					</a>
					<a href={site_config.socials.linkedin} target="_blank" rel="noopener noreferrer">
						<Button
							variant="ghost"
							size="icon"
							class="rounded-full hover:bg-primary/10 dark:hover:bg-primary/20"
						>
							<Linkedin class="h-5 w-5" />
						</Button>
					</a>
					<a href={site_config.socials.github} target="_blank" rel="noopener noreferrer">
						<Button
							variant="ghost"
							size="icon"
							class="rounded-full hover:bg-primary/10 dark:hover:bg-primary/20"
						>
							<Github class="h-5 w-5" />
						</Button>
					</a>
					<a href={site_config.socials.instagram} target="_blank" rel="noopener noreferrer">
						<Button
							variant="ghost"
							size="icon"
							class="rounded-full hover:bg-primary/10 dark:hover:bg-primary/20"
						>
							<Instagram class="h-5 w-5" />
						</Button>
					</a>
				</div>
			</div>

			<div>
				<h3 class="mb-4 text-lg font-semibold">Dream Team</h3>
				<ul class="space-y-2">
					<li>
						<a href="/" class="text-muted-foreground transition-colors hover:text-primary"
							>Our Story</a
						>
					</li>
					<li>
						<a href="/" class="text-muted-foreground transition-colors hover:text-primary"
							>Join Us</a
						>
					</li>
				</ul>
			</div>

			<div>
				<h3 class="mb-4 text-lg font-semibold">Surf Guide</h3>
				<ul class="space-y-2">
					<li>
						<a href="/" class="text-muted-foreground transition-colors hover:text-primary"
							>Surf Community</a
						>
					</li>
				</ul>
			</div>
		</div>

		<Separator class="my-8" />

		<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
			<p class="text-sm text-muted-foreground">
				© {new Date().getFullYear()}
				Dreamsurf. All rights reserved.
			</p>
			<div class="flex gap-6">
				<a href="/" class="text-sm text-muted-foreground transition-colors hover:text-primary"
					>Privacy Policy</a
				>
				<a href="/" class="text-sm text-muted-foreground transition-colors hover:text-primary"
					>Terms of Service</a
				>
				<a href="/" class="text-sm text-muted-foreground transition-colors hover:text-primary"
					>Cookie Policy</a
				>
			</div>
		</div>
	</div>
</div>
