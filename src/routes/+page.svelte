<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import ThemeToggle from '$lib/components/ui/theme-toggle.svelte';
	import { site_config } from '../config';

	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Github from '@lucide/svelte/icons/github';
	import Image from '@lucide/svelte/icons/image';
	import Instagram from '@lucide/svelte/icons/instagram';
	import Linkedin from '@lucide/svelte/icons/linkedin';
	import MousePointer from '@lucide/svelte/icons/mouse-pointer';
	import Palette from '@lucide/svelte/icons/palette';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Star from '@lucide/svelte/icons/star';
	import Twitter from '@lucide/svelte/icons/twitter';
	import Zap from '@lucide/svelte/icons/zap';

	// Helper function to get the right icon component
	function getIconComponent(iconName: string) {
		switch (iconName) {
			case 'Zap':
				return Zap;
			case 'Image':
				return Image;
			case 'MousePointer':
				return MousePointer;
			default:
				return Sparkles;
		}
	}
</script>

<div class="relative overflow-hidden">
	<!-- Decorative background elements -->
	<div
		class="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl"
	></div>
	<div
		class="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-secondary/10 blur-3xl"
	></div>
	<div
		class="absolute bottom-0 left-1/4 h-[600px] w-[600px] rounded-full bg-accent/10 blur-3xl"
	></div>

	<!-- Hero Section with Navbar -->
	<header class="container relative z-10 mx-auto flex items-center justify-between py-6">
		<div class="flex items-center gap-2">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
				<Palette class="h-6 w-6 text-primary-foreground" />
			</div>
			<span class="text-xl font-bold">{site_config.site_name}</span>
		</div>

		<nav class="hidden items-center gap-6 md:flex">
			<a href="#features" class="text-sm font-medium hover:text-primary">Features</a>
			<a href="#testimonials" class="text-sm font-medium hover:text-primary">Testimonials</a>
			<a href="#pricing" class="text-sm font-medium hover:text-primary">Pricing</a>
			<a href="#contact" class="text-sm font-medium hover:text-primary">Contact</a>
		</nav>

		<div class="flex items-center gap-2">
			<ThemeToggle />
			<Button>Get Started</Button>
		</div>
	</header>

	<section class="container relative z-10 mx-auto px-4 py-24 md:py-36">
		<div class="mx-auto max-w-4xl">
			<div
				class="mb-6 flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
			>
				<Sparkles class="h-4 w-4" />
				<span>Launching soon - Join the waitlist for early access</span>
			</div>

			<div class="flex flex-col items-center justify-center text-center">
				<h1
					class="mb-12 flex flex-col gap-1 text-center text-6xl font-black tracking-tight sm:text-7xl md:text-8xl lg:text-9xl"
				>
					<span class="sr-only">{site_config.tag_line}</span>
					<span class="epic-title-first relative z-10"> Text to </span>
					<span class="epic-title-second relative z-20 -mt-5">imagination</span>
				</h1>
				<p class="mt-6 max-w-2xl text-xl text-muted-foreground md:text-2xl">
					{site_config.site_description} Create stunning visuals, graphics, and layouts from simple text
					prompts in seconds.
				</p>

				<div class="mt-12 flex flex-col gap-4 sm:flex-row">
					<Button
						size="lg"
						onclick={() => (window.location.href = '/new')}
						class="group relative overflow-hidden bg-primary px-8 py-6 text-lg"
					>
						<span class="relative z-10">Create Your First Design</span>
						<div
							class="hero-gradient absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						></div>
						<ArrowRight class="relative z-10 ml-2 h-5 w-5" />
					</Button>
					<Button variant="outline" size="lg" class="px-8 py-6 text-lg">See Examples</Button>
				</div>

				<div class="mt-16 flex flex-wrap items-center justify-center gap-8">
					<div class="flex items-center gap-2">
						<div class="flex -space-x-2">
							<div class="h-10 w-10 rounded-full bg-primary"></div>
							<div class="h-10 w-10 rounded-full bg-secondary"></div>
							<div class="h-10 w-10 rounded-full bg-accent"></div>
						</div>
						<p class="text-sm text-muted-foreground">
							<span class="font-medium">10,000+</span> designs created daily
						</p>
					</div>
					<div class="flex items-center gap-2">
						<div class="flex">
							{#each Array(5) as _}
								<Star class="h-5 w-5 fill-primary text-primary" />
							{/each}
						</div>
						<p class="text-sm text-muted-foreground">
							<span class="font-medium">4.9/5</span> average rating
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Abstract shapes -->
		<div
			class="blob-animation absolute -right-40 top-1/3 h-80 w-80 bg-gradient-to-r from-primary to-secondary opacity-30 blur-xl"
		></div>
		<div
			class="blob-animation absolute -left-40 top-2/3 h-60 w-60 bg-gradient-to-r from-accent to-secondary opacity-20 blur-xl"
		></div>
	</section>

	<!-- Features -->
	<section id="features" class="relative z-10 py-24">
		<div class="container mx-auto px-4">
			<div class="mb-16 text-center">
				<div
					class="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
				>
					Features
				</div>
				<h2 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
					Design Anything with <span class="text-gradient">Simple Text</span>
				</h2>
				<p class="mx-auto mt-4 max-w-2xl text-xl text-muted-foreground">
					Our cutting-edge AI understands your creative vision and transforms it into professional
					designs in seconds.
				</p>
			</div>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
				{#each site_config.features as feature}
					{@const IconComponent = getIconComponent(feature.icon)}
					<Card.Root class="card-hover border-0 bg-background/50 p-6 shadow-lg backdrop-blur-sm">
						<Card.Header>
							<div class="hero-gradient mb-4 flex h-14 w-14 items-center justify-center rounded-xl">
								<svelte:component this={IconComponent} class="h-7 w-7 text-white" />
							</div>
							<Card.Title class="text-2xl">{feature.title}</Card.Title>
							<Card.Description class="text-base">
								{feature.description}
							</Card.Description>
						</Card.Header>
						<Card.Content>
							<ul class="space-y-2">
								<li class="flex items-center gap-2">
									<CheckCircle class="h-5 w-5 text-primary" />
									<span>Text-to-image conversion</span>
								</li>
								<li class="flex items-center gap-2">
									<CheckCircle class="h-5 w-5 text-primary" />
									<span>Multiple style options</span>
								</li>
								<li class="flex items-center gap-2">
									<CheckCircle class="h-5 w-5 text-primary" />
									<span>Rapid iterations</span>
								</li>
							</ul>
						</Card.Content>
						<Card.Footer>
							<Button variant="ghost" class="group w-full justify-between">
								Learn More
								<ChevronRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Button>
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>

			<!-- Design Types -->
			<div class="mt-20">
				<div class="mb-12 text-center">
					<h3 class="text-2xl font-bold tracking-tight sm:text-3xl">
						What Can You Create with {site_config.site_name}?
					</h3>
					<p class="mx-auto mt-4 max-w-2xl text-muted-foreground">
						Versatile design generation for all your creative needs
					</p>
				</div>

				<div class="flex flex-wrap justify-center gap-4">
					{#each site_config.design_types as designType}
						<div class="rounded-full bg-background/80 px-6 py-3 shadow backdrop-blur-sm">
							<span class="font-medium">{designType}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Testimonials -->
	<section id="testimonials" class="relative z-10 py-24">
		<div class="container mx-auto px-4">
			<div class="mb-16 text-center">
				<div
					class="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
				>
					Testimonials
				</div>
				<h2 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
					Loved by <span class="text-gradient">Creators Worldwide</span>
				</h2>
				<p class="mx-auto mt-4 max-w-2xl text-xl text-muted-foreground">
					See what designers, marketers, and entrepreneurs are saying about {site_config.site_name}.
				</p>
			</div>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
				<Card.Root class="card-hover relative overflow-hidden border-0 p-8 shadow-lg">
					<div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5"></div>
					<div class="absolute -bottom-5 -left-5 h-40 w-40 rounded-full bg-secondary/5"></div>
					<Card.Content>
						<div class="flex">
							{#each Array(5) as _}
								<Star class="h-5 w-5 fill-primary text-primary" />
							{/each}
						</div>
						<p class="my-6 text-xl font-medium italic">
							"{site_config.site_name} has revolutionized my workflow. What used to take hours in design
							software now takes minutes with a simple text prompt. It's like having a design team at
							my fingertips."
						</p>
						<div class="flex items-center gap-4">
							<div
								class="h-14 w-14 overflow-hidden rounded-full bg-gradient-to-r from-primary to-secondary"
							></div>
							<div>
								<p class="text-lg font-semibold">Sarah Johnson</p>
								<p class="text-muted-foreground">Marketing Director, Creativa</p>
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root class="card-hover relative overflow-hidden border-0 p-8 shadow-lg">
					<div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary/5"></div>
					<div class="absolute -bottom-5 -left-5 h-40 w-40 rounded-full bg-accent/5"></div>
					<Card.Content>
						<div class="flex">
							{#each Array(5) as _}
								<Star class="h-5 w-5 fill-primary text-primary" />
							{/each}
						</div>
						<p class="my-6 text-xl font-medium italic">
							"As a non-designer running a startup, {site_config.site_name} has been a game-changer.
							I can create professional marketing materials without hiring a design agency. The ROI is
							incredible."
						</p>
						<div class="flex items-center gap-4">
							<div
								class="h-14 w-14 overflow-hidden rounded-full bg-gradient-to-r from-secondary to-accent"
							></div>
							<div>
								<p class="text-lg font-semibold">Mark Williams</p>
								<p class="text-muted-foreground">Founder, LaunchPad</p>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</section>

	<!-- Pricing -->
	<section id="pricing" class="relative z-10 py-24">
		<div class="container mx-auto px-4">
			<div class="mb-16 text-center">
				<div
					class="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
				>
					Pricing
				</div>
				<h2 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
					Simple, <span class="text-gradient">Transparent Pricing</span>
				</h2>
				<p class="mx-auto mt-4 max-w-2xl text-xl text-muted-foreground">
					Choose the plan that fits your creative needs, from individual creators to design teams.
				</p>
			</div>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
				<Card.Root class="card-hover relative border-0 p-8 shadow-lg">
					<Card.Header>
						<Card.Title class="text-2xl">Creator</Card.Title>
						<Card.Description class="text-base">
							Perfect for individual creators and small projects
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="mb-8 mt-6">
							<span class="text-5xl font-bold">$19</span>
							<span class="text-muted-foreground">/month</span>
							<p class="mt-2 text-sm text-muted-foreground">Billed annually</p>
						</div>
						<ul class="space-y-4 text-base">
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>50 designs per month</span>
							</li>
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>Basic customization tools</span>
							</li>
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>Standard export formats</span>
							</li>
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>Email support</span>
							</li>
						</ul>
					</Card.Content>
					<Card.Footer>
						<Button variant="outline" class="w-full text-base">Get Started</Button>
					</Card.Footer>
				</Card.Root>

				<Card.Root class="card-hover relative border-0 p-8 shadow-xl">
					<div
						class="absolute -top-3 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-4 py-1 text-center text-sm font-medium text-primary-foreground"
					>
						Most Popular
					</div>
					<div class="hero-gradient absolute inset-0 -z-10 opacity-5"></div>
					<Card.Header>
						<Card.Title class="text-2xl">Professional</Card.Title>
						<Card.Description class="text-base">Ideal for businesses and teams</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="mb-8 mt-6">
							<span class="text-5xl font-bold">$49</span>
							<span class="text-muted-foreground">/month</span>
							<p class="mt-2 text-sm text-muted-foreground">Billed annually</p>
						</div>
						<ul class="space-y-4 text-base">
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>Unlimited designs</span>
							</li>
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>Advanced editing tools</span>
							</li>
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>Brand kit integration</span>
							</li>
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>Priority support</span>
							</li>
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>Team collaboration</span>
							</li>
						</ul>
					</Card.Content>
					<Card.Footer>
						<Button class="w-full text-base">Get Started</Button>
					</Card.Footer>
				</Card.Root>

				<Card.Root class="card-hover relative border-0 p-8 shadow-lg">
					<Card.Header>
						<Card.Title class="text-2xl">Enterprise</Card.Title>
						<Card.Description class="text-base">
							For organizations with advanced design needs
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="mb-8 mt-6">
							<span class="text-5xl font-bold">$149</span>
							<span class="text-muted-foreground">/month</span>
							<p class="mt-2 text-sm text-muted-foreground">Billed annually</p>
						</div>
						<ul class="space-y-4 text-base">
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>Unlimited everything</span>
							</li>
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>Custom AI model training</span>
							</li>
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>API access</span>
							</li>
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>Dedicated account manager</span>
							</li>
							<li class="flex items-center gap-3">
								<CheckCircle class="h-5 w-5 text-primary" />
								<span>SSO & advanced security</span>
							</li>
						</ul>
					</Card.Content>
					<Card.Footer>
						<Button variant="outline" class="w-full text-base">Contact Sales</Button>
					</Card.Footer>
				</Card.Root>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section id="contact" class="relative z-10 py-20">
		<div class="container mx-auto px-4">
			<div class="overflow-hidden rounded-3xl bg-primary shadow-2xl">
				<div class="hero-gradient p-12 md:p-16">
					<div class="mx-auto max-w-3xl text-center text-white">
						<h2 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
							Ready to transform your creative process?
						</h2>
						<p class="mx-auto mt-4 max-w-2xl text-xl opacity-90">
							Join thousands of creators already using {site_config.site_name} to bring their ideas to
							life.
						</p>
						<div class="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
							<Button variant="secondary" size="lg" class="text-lg">
								Start Creating Free
								<ArrowRight class="ml-2 h-5 w-5" />
							</Button>
							<Button
								variant="outline"
								size="lg"
								class="border-white bg-transparent text-lg text-white hover:bg-white/20"
							>
								Watch Demo
							</Button>
						</div>

						<div class="mt-12 flex flex-wrap items-center justify-center gap-8">
							<p class="flex items-center gap-2 text-base">
								<CheckCircle class="h-5 w-5" />
								<span>No credit card required</span>
							</p>
							<p class="flex items-center gap-2 text-base">
								<CheckCircle class="h-5 w-5" />
								<span>5 free designs</span>
							</p>
							<p class="flex items-center gap-2 text-base">
								<CheckCircle class="h-5 w-5" />
								<span>Cancel anytime</span>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="relative z-10 pb-12 pt-24">
		<div class="container mx-auto px-4">
			<div class="grid grid-cols-1 gap-8 md:grid-cols-5">
				<div class="md:col-span-2">
					<div class="flex items-center gap-2">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
							<Palette class="h-6 w-6 text-primary-foreground" />
						</div>
						<span class="text-xl font-bold">{site_config.site_name}</span>
					</div>
					<p class="mt-4 max-w-md text-muted-foreground">
						{site_config.site_description} The AI-powered platform that turns text descriptions into
						beautiful designs in seconds.
					</p>
					<div class="mt-6 flex space-x-4">
						<a href={site_config.socials.twitter} target="_blank" rel="noopener noreferrer">
							<Button variant="ghost" size="icon" class="rounded-full">
								<Twitter class="h-5 w-5" />
							</Button>
						</a>
						<a href={site_config.socials.linkedin} target="_blank" rel="noopener noreferrer">
							<Button variant="ghost" size="icon" class="rounded-full">
								<Linkedin class="h-5 w-5" />
							</Button>
						</a>
						<a href={site_config.socials.github} target="_blank" rel="noopener noreferrer">
							<Button variant="ghost" size="icon" class="rounded-full">
								<Github class="h-5 w-5" />
							</Button>
						</a>
						<a href={site_config.socials.instagram} target="_blank" rel="noopener noreferrer">
							<Button variant="ghost" size="icon" class="rounded-full">
								<Instagram class="h-5 w-5" />
							</Button>
						</a>
					</div>
				</div>

				<div>
					<h3 class="mb-4 text-lg font-semibold">Product</h3>
					<ul class="space-y-2">
						<li>
							<a href="#features" class="text-muted-foreground hover:text-primary">Features</a>
						</li>
						<li><a href="#" class="text-muted-foreground hover:text-primary">Use Cases</a></li>
						<li><a href="#pricing" class="text-muted-foreground hover:text-primary">Pricing</a></li>
						<li><a href="#" class="text-muted-foreground hover:text-primary">Gallery</a></li>
					</ul>
				</div>

				<div>
					<h3 class="mb-4 text-lg font-semibold">Company</h3>
					<ul class="space-y-2">
						<li><a href="#" class="text-muted-foreground hover:text-primary">About</a></li>
						<li><a href="#" class="text-muted-foreground hover:text-primary">Careers</a></li>
						<li><a href="#" class="text-muted-foreground hover:text-primary">Blog</a></li>
						<li>
							<a
								href={`mailto:${site_config.contact.email}`}
								class="text-muted-foreground hover:text-primary">Contact</a
							>
						</li>
					</ul>
				</div>

				<div>
					<h3 class="mb-4 text-lg font-semibold">Resources</h3>
					<ul class="space-y-2">
						<li><a href="#" class="text-muted-foreground hover:text-primary">Documentation</a></li>
						<li>
							<a
								href={`mailto:${site_config.contact.support}`}
								class="text-muted-foreground hover:text-primary">Help Center</a
							>
						</li>
						<li><a href="#" class="text-muted-foreground hover:text-primary">Tutorials</a></li>
						<li><a href="#" class="text-muted-foreground hover:text-primary">Community</a></li>
					</ul>
				</div>
			</div>

			<Separator class="my-8" />

			<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
				<p class="text-sm text-muted-foreground">
					© {new Date().getFullYear()}
					{site_config.site_name}. All rights reserved.
				</p>
				<div class="flex gap-6">
					<a href="#" class="text-sm text-muted-foreground hover:text-primary">Privacy Policy</a>
					<a href="#" class="text-sm text-muted-foreground hover:text-primary">Terms of Service</a>
					<a href="#" class="text-sm text-muted-foreground hover:text-primary">Cookie Policy</a>
				</div>
			</div>
		</div>
	</footer>
</div>
