<script lang="ts">
	// Component for wave animation around container edges
	let {
		borderWidth = 5,
		animationSpeed = 4,
		variant = 'default',
		glowIntensity = 10,
		backdropBlur = 10
	} = $props<{
		borderWidth?: number;
		animationSpeed?: number;
		variant?: 'default' | 'loading' | 'waiting' | 'empty';
		glowIntensity?: number;
		backdropBlur?: number;
	}>();

	// Derive CSS color variables based on variant
	let colorClass = $derived(
		variant === 'loading'
			? 'loading-colors'
			: variant === 'waiting'
				? 'waiting-colors'
				: variant === 'empty'
					? 'empty-colors'
					: 'default-colors'
	);
</script>

<div
	class="wave-container z-[101] scale-110 transform opacity-60 blur-sm"
	style="backdrop-filter: blur({backdropBlur}px);"
>
	<div
		class="wave-effect {colorClass} "
		style="--border-width: {borderWidth}px; --animation-speed: {animationSpeed}s; --glow-intensity: {glowIntensity}px;"
	></div>
	<div class="content-container"></div>
</div>

<style>
	.wave-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 100;
		overflow: hidden;
	}

	.content-container {
		position: absolute;
		top: var(--border-width, 15px);
		left: var(--border-width, 15px);
		right: var(--border-width, 15px);
		bottom: var(--border-width, 15px);
		z-index: 1;
	}

	.wave-effect {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 0;
		box-shadow: inset 0 0 var(--glow-intensity, 10px) rgba(255, 255, 255, 0.4);
		animation:
			rotate-hue var(--animation-speed, 4s) linear infinite,
			wave-flow var(--animation-speed, 4s) ease-in-out infinite alternate;
		opacity: 0.95;
		filter: brightness(1.2) saturate(1.5);
	}

	/* Color variants */
	.default-colors {
		background: conic-gradient(
			from 0deg at 50% 50%,
			#ff3d00,
			/* Vivid Red - primary */ #ffea00,
			/* Vivid Yellow - primary */ #0057ff,
			/* Vivid Blue - primary */ #f700ff,
			/* Vivid Magenta - secondary */ #00e1ff,
			/* Vivid Cyan - secondary */ #ff3d00 /* Back to red to complete the loop */
		);
		box-shadow: 0 0 calc(var(--glow-intensity, 10px) * 2) rgba(255, 61, 0, 0.6);
	}

	.loading-colors {
		background: conic-gradient(
			from 0deg at 50% 50%,
			#ff3d00,
			/* Vivid Red */ #ff9e00,
			/* Orange */ #ffea00,
			/* Yellow */ #00c853,
			/* Green */ #0057ff,
			/* Blue */ #ff3d00 /* Back to red */
		);
		box-shadow: 0 0 calc(var(--glow-intensity, 10px) * 2) rgba(255, 158, 0, 0.6);
	}

	.waiting-colors {
		background: conic-gradient(
			from 0deg at 50% 50%,
			#7c4dff,
			/* Deep Purple */ #2196f3,
			/* Blue */ #00bcd4,
			/* Cyan */ #26a69a,
			/* Teal */ #7c4dff /* Back to deep purple */
		);
		box-shadow: 0 0 calc(var(--glow-intensity, 10px) * 2) rgba(33, 150, 243, 0.6);
	}

	.empty-colors {
		background: conic-gradient(
			from 0deg at 50% 50%,
			#ff3d9e,
			/* Pink */ #f700ff,
			/* Magenta */ #7c4dff,
			/* Purple */ #0057ff,
			/* Blue */ #00e1ff,
			/* Cyan */ #ff3d9e /* Back to pink */
		);
		box-shadow: 0 0 calc(var(--glow-intensity, 10px) * 2) rgba(247, 0, 255, 0.6);
	}

	@keyframes rotate-hue {
		0% {
			filter: hue-rotate(0deg) brightness(1.3) saturate(1.5);
		}
		100% {
			filter: hue-rotate(360deg) brightness(1.3) saturate(1.5);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.3;
		}
		50% {
			opacity: 0.6;
		}
	}

	@keyframes wave-flow {
		0% {
			clip-path: polygon(
				0% 0%,
				100% 0%,
				100% 100%,
				0% 100%,
				0% 0%,
				10% 2%,
				20% 5%,
				30% 2%,
				40% 0%,
				50% 3%,
				60% 5%,
				70% 2%,
				80% 0%,
				90% 3%,
				100% 0%,
				100% 100%,
				90% 97%,
				80% 95%,
				70% 98%,
				60% 100%,
				50% 96%,
				40% 95%,
				30% 97%,
				20% 100%,
				10% 98%,
				0% 100%
			);
		}
		50% {
			clip-path: polygon(
				0% 0%,
				100% 0%,
				100% 100%,
				0% 100%,
				0% 0%,
				10% 4%,
				20% 0%,
				30% 3%,
				40% 5%,
				50% 0%,
				60% 2%,
				70% 5%,
				80% 3%,
				90% 0%,
				100% 5%,
				100% 100%,
				90% 96%,
				80% 100%,
				70% 96%,
				60% 95%,
				50% 100%,
				40% 97%,
				30% 95%,
				20% 97%,
				10% 100%,
				0% 95%
			);
		}
		100% {
			clip-path: polygon(
				0% 0%,
				100% 0%,
				100% 100%,
				0% 100%,
				0% 0%,
				10% 2%,
				20% 5%,
				30% 2%,
				40% 0%,
				50% 3%,
				60% 5%,
				70% 2%,
				80% 0%,
				90% 3%,
				100% 0%,
				100% 100%,
				90% 97%,
				80% 95%,
				70% 98%,
				60% 100%,
				50% 96%,
				40% 95%,
				30% 97%,
				20% 100%,
				10% 98%,
				0% 100%
			);
		}
	}
</style>
