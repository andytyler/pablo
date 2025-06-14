<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import Github from '@lucide/svelte/icons/github';
	import Linkedin from '@lucide/svelte/icons/linkedin';
	import Twitter from '@lucide/svelte/icons/twitter';
	import { Computer, Moon, Sun } from 'lucide-svelte';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import { site_config } from '../config';
	let { children } = $props();

	import { mode, setMode } from 'mode-watcher';
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<ModeWatcher />
<div class="min-h-screen bg-background text-foreground">
	{#if $page.url.pathname === '/'}
		<!-- Header -->

		<!-- You can add a header here if needed -->
	{/if}
	{@render children()}
	{#if $page.url.pathname === '/'}
		<!-- Footer -->
		<div class="relative z-10 border-t-2 border-border pb-12 pt-24">
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
						</div>
					</div>

					<div>
						<h3 class="mb-4 text-lg font-semibold">Dream Team</h3>
						<ul class="space-y-2">
							<li>
								<a
									href="https://x.com/search?q=dreamsurf&src=typed_query&f=live"
									class="text-muted-foreground transition-colors hover:text-primary">Join Us</a
								>
							</li>
						</ul>
					</div>

					<div>
						<h3 class="mb-4 text-lg font-semibold">Surf Guide</h3>
						<ul class="space-y-2">
							<li>
								<a
									href="https://x.com/search?q=dreamsurf&src=typed_query&f=live"
									class="text-muted-foreground transition-colors hover:text-primary"
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
					<div class="flex flex-row items-center gap-2 rounded-lg bg-muted">
						<!-- dark mode toggle light dark system 3 buttons -->
						<Button
							variant="ghost"
							size="icon"
							onclick={() => setMode('light')}
							active={$mode === 'light'}
							class="rounded-lg p-1 active:bg-primary/10"
						>
							<Sun class="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onclick={() => setMode('dark')}
							active={$mode === 'dark'}
							class="rounded-lg p-2 active:bg-primary/10"
						>
							<Moon class="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onclick={() => setMode('system')}
							class="rounded-lg p-2 active:bg-primary/10"
						>
							<Computer class="h-5 w-5" />
						</Button>
					</div>
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
	{/if}
</div>
