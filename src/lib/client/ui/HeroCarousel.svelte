<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import AstroidIcon from '@lucide/svelte/icons/astroid';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { onMount } from 'svelte';
	import type { ProductCardData } from '$lib/client/types';
	import { targetHref } from '$lib/client/utils/links';
	import type { SiteSettings } from '$lib/client/validation/settings';
	import ChunkyButton from './ChunkyButton.svelte';
	import ProductCard from './ProductCard.svelte';
	import Star from './Star.svelte';

	let {
		products = [],
		slides
	}: { products?: ProductCardData[]; slides?: SiteSettings['home']['slides'] } = $props();

	let index = $state(0);

	const safeSlides = $derived(slides ?? []);
	const slide = $derived(safeSlides[index] ?? safeSlides[0]);
	const slideHref = $derived(slide ? targetHref(slide.target) : null);

	onMount(() => {
		if (safeSlides.length < 2) {
			return;
		}

		const timer = setInterval(() => (index = (index + 1) % safeSlides.length), 5200);
		return () => clearInterval(timer);
	});

	const geometry = [
		{ tf: 'translate(-50%,-50%) scale(1) rotate(-1.5deg)', op: 1, z: 6 },
		{ tf: 'translate(calc(-50% + 292px),-46%) scale(.78) rotate(6deg)', op: 0.95, z: 4 },
		{ tf: 'translate(-50%,-52%) scale(.6) rotate(0deg)', op: 0, z: 1 },
		{ tf: 'translate(calc(-50% - 292px),-46%) scale(.78) rotate(-6deg)', op: 0.95, z: 4 }
	];

	const geo = (i: number) =>
		geometry[(i - index + products.length * geometry.length) % geometry.length];
	const geometryMobile = [
		{ tf: 'translate(-50%,-50%) scale(1) rotate(-1.5deg)', op: 1, z: 6 },
		{ tf: 'translate(calc(-50% + 118px),-48%) scale(.8) rotate(6deg)', op: 0.9, z: 4 },
		{ tf: 'translate(-50%,-52%) scale(.6) rotate(0deg)', op: 0, z: 1 },
		{ tf: 'translate(calc(-50% - 118px),-48%) scale(.8) rotate(-6deg)', op: 0.9, z: 4 }
	];
	const geoMobile = (i: number) =>
		geometryMobile[(i - index + products.length * geometryMobile.length) % geometryMobile.length];

	let swipeFrom: number | null = null;
	const swipeStart = (event: PointerEvent) => (swipeFrom = event.clientX);
	let swiped = false;
	function swallowSwipeClick(event: MouseEvent) {
		if (swiped) {
			event.preventDefault();
			event.stopPropagation();
			swiped = false;
		}
	}
	function swipeEnd(event: PointerEvent) {
		if (swipeFrom === null) {
			return;
		}

		const delta = event.clientX - swipeFrom;
		swipeFrom = null;
		swiped = Math.abs(delta) > 40;

		if (swiped) {
			if (delta < 0) {
				next();
			} else {
				prev();
			}
		}
	}

	const prev = () =>
		(index = safeSlides.length === 0 ? 0 : (index + safeSlides.length - 1) % safeSlides.length);
	const next = () => (index = safeSlides.length === 0 ? 0 : (index + 1) % safeSlides.length);
</script>

<section
	class="relative overflow-hidden px-5 pt-6 pb-6 min-[87.5rem]:h-205 min-[87.5rem]:px-0 min-[87.5rem]:py-0"
	style="background:repeating-linear-gradient(90deg,#FFF0F6 0 14px,#FFF9F2 14px 28px)"
>
	<div
		class="pointer-events-none absolute -top-22.5 -left-35 hidden h-110 w-110 rounded-full bg-yellow-soft min-[87.5rem]:block"
	></div>
	<div
		class="pointer-events-none absolute -right-30 -bottom-[170px] hidden h-130 w-130 rounded-full bg-purple-soft min-[87.5rem]:block"
	></div>
	<div
		class="pointer-events-none absolute -top-45 left-[44%] hidden h-75 w-75 rounded-full bg-blue-soft opacity-70 min-[87.5rem]:block"
	></div>

	<Star
		color="#FFDE59"
		size={74}
		class="absolute top-[70px] left-[520px] z-[2] hidden animate-twinkle min-[87.5rem]:block"
	/>
	<Star
		color="#6EC6EE"
		size={56}
		class="absolute bottom-[96px] left-[60px] z-[2] hidden animate-twinkle min-[87.5rem]:block"
	/>
	<Star
		color="#F0369B"
		size={44}
		class="absolute top-[120px] right-[56px] z-[8] hidden animate-twinkle min-[87.5rem]:block"
	/>
	<Star
		color="#7ED598"
		size={34}
		class="absolute bottom-10 left-[47%] z-[8] hidden animate-twinkle min-[87.5rem]:block"
	/>

	<div
		class="relative z-[7] flex flex-col gap-3 min-[87.5rem]:absolute min-[87.5rem]:top-[104px] min-[87.5rem]:left-[70px] min-[87.5rem]:w-[452px] min-[87.5rem]:gap-[18px]"
	>
		<span class="font-hand text-[21px] text-pink min-[87.5rem]:text-[27px]"
			>Bienvenue chez BYLIKKI <AstroidIcon class="inline-block size-3" aria-hidden="true" /></span
		>
		<h1
			class="m-0 text-[34px] leading-[1.02] font-semibold tracking-[-0.01em] text-pretty min-[87.5rem]:text-[58px] min-[87.5rem]:leading-[1.06]"
		>
			Des créations faites pour te ressembler.
		</h1>

		{#if slide}
			<div class="mt-2 flex flex-col gap-[7px] min-[87.5rem]:mt-3.5">
				<span class="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">
					0{index + 1} / 0{safeSlides.length}
					{slide.kicker}
				</span>
				<h2 class="m-0 text-[22px] font-semibold min-[87.5rem]:text-[29px]">{slide.title}</h2>
				<p
					class="m-0 max-w-[370px] text-[15px] leading-[1.55] text-ink/80 min-[87.5rem]:text-[16px]"
				>
					{slide.desc}
				</p>
			</div>
		{/if}

		{#if products.length > 0}
			<div
				data-testid="hero-coverflow-mobile"
				role="group"
				aria-roledescription="carrousel"
				aria-label="Créations à la une — balaie pour faire défiler"
				class="relative -mx-5 my-4 h-[330px] touch-pan-y overflow-hidden min-[87.5rem]:hidden"
				onpointerdown={swipeStart}
				onpointerup={swipeEnd}
				onpointercancel={() => (swipeFrom = null)}
				onclickcapture={swallowSwipeClick}
			>
				{#each products as product, i (product.slug)}
					<div
						class="absolute top-1/2 left-1/2 h-[300px] w-[230px] transition-[transform,opacity] duration-[800ms] [transition-timing-function:cubic-bezier(.4,0,.2,1)]"
						style="transform:{geoMobile(i).tf};opacity:{geoMobile(i).op};z-index:{geoMobile(i).z}"
						aria-hidden={geoMobile(i).z !== 6}
						inert={geoMobile(i).z !== 6}
					>
						<ProductCard {product} compact />
					</div>
				{/each}
			</div>
		{/if}

		<div class="flex flex-wrap items-center gap-4 min-[87.5rem]:mt-1.5 min-[87.5rem]:gap-[18px]">
			{#if slide && slideHref}
				<ChunkyButton href={slideHref} class="w-full min-[87.5rem]:w-auto"
					>{slide.cta}
					<ArrowRightIcon class="inline-block size-3" aria-hidden="true" /></ChunkyButton
				>
			{/if}
			<span class="hidden font-hand text-[21px] text-ink/60 min-[87.5rem]:inline"
				>fait main à Nantes ♡</span
			>
		</div>

		<div
			class="mt-2 flex items-center justify-center gap-3.5 min-[87.5rem]:mt-3.5 min-[87.5rem]:justify-start"
		>
			<button
				onclick={prev}
				aria-label="Création précédente"
				class="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-paper"
			>
				<ChevronLeftIcon class="size-[18px]" aria-hidden="true" />
			</button>
			<button
				onclick={next}
				aria-label="Création suivante"
				class="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-ink text-cream"
			>
				<ChevronRightIcon class="size-[18px]" aria-hidden="true" />
			</button>
			<div class="ml-1.5 flex gap-[7px]">
				{#each safeSlides as s, i (s.title)}
					<button
						onclick={() => (index = i)}
						aria-label={`Aller à ${s.title}`}
						class="h-[5px] cursor-pointer rounded-[5px] transition-all duration-500"
						style="width:{index === i ? 30 : 10}px;background:{index === i
							? '#F0369B'
							: 'rgba(46,27,51,.22)'}"
					></button>
				{/each}
			</div>
		</div>
	</div>

	<div class="absolute top-0 -right-[60px] hidden h-[820px] w-[940px] min-[87.5rem]:block">
		{#each products as product, i (product.slug)}
			<div
				class="absolute top-[48%] left-1/2 h-[520px] w-[396px] transition-[transform,opacity] duration-[800ms] [transition-timing-function:cubic-bezier(.4,0,.2,1)]"
				style="transform:{geo(i).tf};opacity:{geo(i).op};z-index:{geo(i).z}"
			>
				<ProductCard {product} />
			</div>
		{/each}
	</div>

	<div
		class="absolute bottom-[26px] left-[60px] z-[3] hidden h-[118px] w-[118px] animate-float min-[87.5rem]:block"
	></div>
</section>
