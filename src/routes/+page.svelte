<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import ThemeToggle from '$lib/components/ui/theme-toggle.svelte';
	import { site_config } from '../config';

	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import Github from '@lucide/svelte/icons/github';
	import Instagram from '@lucide/svelte/icons/instagram';
	import Linkedin from '@lucide/svelte/icons/linkedin';
	import Twitter from '@lucide/svelte/icons/twitter';
</script>

<div class="relative overflow-hidden">
	<!-- Blurred background - this is the only blurred part -->
	<div class="fixed inset-0 z-0">
		<div
			class="animate-drift absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-3xl"
			style="animation-delay: 0s;"
		></div>
		<div
			class="animate-drift absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-teal-400/20 blur-3xl"
			style="animation-delay: 2s;"
		></div>
		<div
			class="animate-drift absolute bottom-0 left-1/4 h-[600px] w-[600px] rounded-full bg-cyan-400/20 blur-3xl"
			style="animation-delay: 4s;"
		></div>
	</div>

	<!-- Main content container with margin -->
	<div class="relative z-10 min-h-screen p-4 md:p-8 lg:p-12">
		<!-- Hero image container with rounded corners -->
		<div class="relative mb-8 overflow-hidden rounded-3xl">
			<!-- Background image at the top -->
			<img src="/bg.png" alt="Dreamsurf Background" class="h-[80vh] w-full object-cover" />

			<!-- Navbar overlay -->
			<header class="absolute top-0 z-20 w-full">
				<div class="container mx-auto flex items-center justify-between py-6">
					<div class="flex items-center gap-2">
						<img src="/logo.png" alt="Dreamsurf Logo" class="h-10" />
						<span class="text-xl font-bold">Dreamsurf</span>
					</div>

					<div class="flex items-center gap-2">
						<ThemeToggle />
						<Button
							variant="secondary"
							onclick={() => (window.location.href = '/new')}
							class="ripple-btn">Start Dreaming</Button
						>
					</div>
				</div>
			</header>

			<!-- Floating text centered on the image -->
			<div class="absolute inset-0 z-10 flex flex-col items-center justify-center">
				<div class="text-center">
					<h1
						class="mb-6 flex items-center justify-center gap-4 text-6xl font-bold drop-shadow-xl md:text-8xl"
					>
						<span class="animate-word-1 text-gradient">Text</span>
						<span class="animate-word-2 text-gradient">to</span>
						<span class="animate-word-3 text-gradient">Design</span>
					</h1>
					<Button
						variant="secondary"
						size="lg"
						onclick={() => (window.location.href = '/waitlist')}
						class="surfboard-btn text-lg"
					>
						Join Waitlist
						<ArrowRight class="ml-2 h-5 w-5" />
					</Button>
				</div>
			</div>
		</div>

		<!-- CTA Section -->
		<section id="contact" class="relative z-10 py-16">
			<div class="container mx-auto px-4">
				<div
					class="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500 to-teal-400 shadow-2xl"
				>
					<div class="ocean-gradient p-12 md:p-16">
						<div class="mx-auto max-w-3xl text-center text-white">
							<h2 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
								Ready to ride the wave of creativity?
							</h2>
							<p class="mx-auto mt-4 max-w-2xl text-xl opacity-90">
								Join thousands of dream surfers already using Dreamsurf to bring their dreams to
								life.
							</p>
							<div class="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
								<Button
									variant="secondary"
									size="lg"
									onclick={() => (window.location.href = '/new')}
									class="surfboard-btn text-lg"
								>
									Start Surfing Free
									<ArrowRight class="ml-2 h-5 w-5" />
								</Button>
								<Button
									variant="outline"
									size="lg"
									onclick={() => (window.location.href = '/demo')}
									class="ripple-btn border-white bg-transparent text-lg text-white hover:bg-white/20"
								>
									Watch Dream Demo
								</Button>
							</div>

							<div class="mt-12 flex flex-wrap items-center justify-center gap-8">
								<p class="flex items-center gap-2 text-base">
									<CheckCircle class="h-5 w-5" />
									<span>No credit card required</span>
								</p>
								<p class="flex items-center gap-2 text-base">
									<CheckCircle class="h-5 w-5" />
									<span>5 free dream designs</span>
								</p>
								<p class="flex items-center gap-2 text-base">
									<CheckCircle class="h-5 w-5" />
									<span>Ride away anytime</span>
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
							<div class="flex h-10 w-10 items-center justify-center rounded-lg">
								<img src="/logo.png" alt="Dreamsurf Logo" class="h-10" />
							</div>
							<span class="text-xl font-bold">Dreamsurf</span>
						</div>
						<p class="mt-4 max-w-md text-muted-foreground">
							Dreamsurf is the AI-powered platform that turns dream descriptions into beautiful
							designs in seconds. Ride the wave of creativity.
						</p>
						<div class="mt-6 flex space-x-4">
							<a href={site_config.socials.twitter} target="_blank" rel="noopener noreferrer">
								<Button variant="ghost" size="icon" class="ripple-btn rounded-full">
									<Twitter class="h-5 w-5" />
								</Button>
							</a>
							<a href={site_config.socials.linkedin} target="_blank" rel="noopener noreferrer">
								<Button variant="ghost" size="icon" class="ripple-btn rounded-full">
									<Linkedin class="h-5 w-5" />
								</Button>
							</a>
							<a href={site_config.socials.github} target="_blank" rel="noopener noreferrer">
								<Button variant="ghost" size="icon" class="ripple-btn rounded-full">
									<Github class="h-5 w-5" />
								</Button>
							</a>
							<a href={site_config.socials.instagram} target="_blank" rel="noopener noreferrer">
								<Button variant="ghost" size="icon" class="ripple-btn rounded-full">
									<Instagram class="h-5 w-5" />
								</Button>
							</a>
						</div>
					</div>

					<div>
						<h3 class="mb-4 text-lg font-semibold">Dream Team</h3>
						<ul class="space-y-2">
							<li>
								<a href="/" class="text-muted-foreground transition-colors hover:text-blue-500"
									>Our Story</a
								>
							</li>
							<li>
								<a href="/" class="text-muted-foreground transition-colors hover:text-blue-500"
									>Join Us</a
								>
							</li>
							<li>
								<a href="/" class="text-muted-foreground transition-colors hover:text-blue-500"
									>Wave Journal</a
								>
							</li>
							<li>
								<a
									href={`mailto:${site_config.contact.email}`}
									class="text-muted-foreground transition-colors hover:text-blue-500">Connect</a
								>
							</li>
						</ul>
					</div>

					<div>
						<h3 class="mb-4 text-lg font-semibold">Surf Guide</h3>
						<ul class="space-y-2">
							<li>
								<a href="/" class="text-muted-foreground transition-colors hover:text-blue-500"
									>Wave Manual</a
								>
							</li>
							<li>
								<a
									href={`mailto:${site_config.contact.support}`}
									class="text-muted-foreground transition-colors hover:text-blue-500"
									>Wave Support</a
								>
							</li>
							<li>
								<a href="/" class="text-muted-foreground transition-colors hover:text-blue-500"
									>Surf Lessons</a
								>
							</li>
							<li>
								<a href="/" class="text-muted-foreground transition-colors hover:text-blue-500"
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
						Dreamsurf. All waves reserved.
					</p>
					<div class="flex gap-6">
						<a href="/" class="text-sm text-muted-foreground transition-colors hover:text-blue-500"
							>Privacy Policy</a
						>
						<a href="/" class="text-sm text-muted-foreground transition-colors hover:text-blue-500"
							>Terms of Service</a
						>
						<a href="/" class="text-sm text-muted-foreground transition-colors hover:text-blue-500"
							>Cookie Policy</a
						>
					</div>
				</div>
			</div>
		</footer>
	</div>
</div>

<style>
	/* Ocean gradient */
	.ocean-gradient {
		background: linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%);
	}

	/* Text animations */
	.animate-word-1 {
		display: inline-block;
		transform-origin: center;
		position: relative;
		animation-name: float-1;
		animation-duration: 5s;
		animation-timing-function: ease-in-out;
		animation-iteration-count: infinite;
		animation-delay: 0s;
	}

	.animate-word-2 {
		display: inline-block;
		transform-origin: center;
		position: relative;
		animation-name: float-2;
		animation-duration: 4s;
		animation-timing-function: ease-in-out;
		animation-iteration-count: infinite;
		animation-delay: 1.5s;
		font-size: 0.8em;
		opacity: 0.9;
		margin: 0 -5px;
	}

	.animate-word-3 {
		display: inline-block;
		transform-origin: center;
		position: relative;
		animation-name: float-3;
		animation-duration: 6s;
		animation-timing-function: ease-in-out;
		animation-iteration-count: infinite;
		animation-delay: 0.75s;
	}

	/* Text gradient effect */
	.text-gradient {
		background: linear-gradient(135deg, #ff58e7 0%, #ab7bff 50%, #e74aff 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 2px 8px rgba(171, 123, 255, 0.5));
	}

	@keyframes float-1 {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
			filter: drop-shadow(0 5px 15px rgba(231, 74, 255, 0.4));
		}
		25% {
			transform: translateY(-25px) rotate(8deg);
			filter: drop-shadow(0 25px 15px rgba(231, 74, 255, 0.2));
		}
		75% {
			transform: translateY(10px) rotate(-5deg);
			filter: drop-shadow(0 5px 10px rgba(231, 74, 255, 0.6));
		}
	}

	@keyframes float-2 {
		0%,
		100% {
			transform: translateY(0) rotate(0deg) scale(1);
			filter: drop-shadow(0 5px 15px rgba(171, 123, 255, 0.4));
		}
		50% {
			transform: translateY(-15px) rotate(-10deg) scale(1.2);
			filter: drop-shadow(0 15px 10px rgba(171, 123, 255, 0.2));
		}
	}

	@keyframes float-3 {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
			filter: drop-shadow(0 5px 15px rgba(255, 88, 231, 0.4));
		}
		33% {
			transform: translateY(-20px) rotate(-12deg);
			filter: drop-shadow(0 20px 15px rgba(255, 88, 231, 0.2));
		}
		66% {
			transform: translateY(12px) rotate(8deg);
			filter: drop-shadow(0 5px 10px rgba(255, 88, 231, 0.6));
		}
	}

	/* Add additional glow effect on hover */
	.animate-word-1:hover,
	.animate-word-2:hover,
	.animate-word-3:hover {
		filter: drop-shadow(0 0 15px rgba(255, 121, 243, 0.8))
			drop-shadow(0 0 30px rgba(171, 123, 255, 0.6));
		transition: filter 0.3s ease;
	}

	/* Wave animations */
	.wave-container {
		position: absolute;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.wave {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 200%;
		height: 100px;
		background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' opacity='.25' fill='%233b82f6'/%3E%3Cpath d='M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z' opacity='.5' fill='%232dd4bf'/%3E%3Cpath d='M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z' opacity='.25' fill='%2322d3ee'/%3E%3C/svg%3E")
			repeat-x;
		background-size: 1200px 100px;
		animation: wave 25s linear infinite;
	}

	.wave1 {
		animation-delay: 0s;
		z-index: 1;
		opacity: 0.3;
	}

	.wave2 {
		animation-delay: -5s;
		z-index: 2;
		opacity: 0.2;
		bottom: 10px;
	}

	.wave3 {
		animation-delay: -10s;
		z-index: 3;
		opacity: 0.1;
		bottom: 20px;
	}

	@keyframes wave {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	/* Dream cloud animations */
	.dream-cloud {
		position: absolute;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		filter: blur(20px);
		animation: float 20s ease-in-out infinite;
	}

	.cloud1 {
		width: 150px;
		height: 60px;
		top: 15%;
		left: 10%;
		opacity: 0.3;
	}

	.cloud2 {
		width: 100px;
		height: 40px;
		top: 35%;
		right: 15%;
		animation-delay: 5s;
		opacity: 0.2;
	}

	.cloud3 {
		width: 120px;
		height: 50px;
		bottom: 25%;
		left: 20%;
		animation-delay: 10s;
		opacity: 0.25;
	}

	@keyframes float {
		0% {
			transform: translateY(0) translateX(0);
		}
		50% {
			transform: translateY(-20px) translateX(20px);
		}
		100% {
			transform: translateY(0) translateX(0);
		}
	}

	/* Drift animation for background elements */
	.animate-drift {
		animation: drift 20s ease-in-out infinite alternate;
	}

	@keyframes drift {
		0% {
			transform: translate(0, 0);
		}
		100% {
			transform: translate(50px, 20px);
		}
	}

	/* Ripple button effect */
	.ripple-btn {
		position: relative;
		overflow: hidden;
	}

	.ripple-btn::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 5px;
		height: 5px;
		background: rgba(59, 130, 246, 0.3);
		opacity: 0;
		border-radius: 100%;
		transform: scale(1, 1) translate(-50%, -50%);
		transform-origin: 50% 50%;
	}

	.ripple-btn:hover::after {
		animation: ripple 1s ease-out;
	}

	@keyframes ripple {
		0% {
			transform: scale(0, 0);
			opacity: 0.5;
		}
		20% {
			transform: scale(25, 25);
			opacity: 0.3;
		}
		100% {
			opacity: 0;
			transform: scale(40, 40);
		}
	}

	/* Surfboard button effect */
	.surfboard-btn {
		position: relative;
		overflow: hidden;
	}

	.surfboard-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0.2) 50%,
			rgba(255, 255, 255, 0) 100%
		);
		transition: left 0.5s ease;
	}

	.surfboard-btn:hover::before {
		left: 100%;
	}
</style>
