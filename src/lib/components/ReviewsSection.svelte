<script lang="ts">
	import { reviewCardBg, reviewCardRadius, reviews } from '#lib/data/catalogue';
	import { onMount } from 'svelte';

	let index = $state(0);
	/** en dessous de 1024px le rail défile au doigt, pas au transform */
	let wide = $state(false);
	const step = 430;

	onMount(() => {
		const mq = window.matchMedia('(min-width: 1024px)');
		const sync = () => (wide = mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});
	const maxIndex = reviews.length - 3;

	const prev = () => (index = Math.max(index - 1, 0));
	const next = () => (index = Math.min(index + 1, maxIndex));
	const rot = (i: number) => (i % 3 === 0 ? -1.2 : i % 3 === 1 ? 1.4 : -0.5);
</script>

<section
	id="avis"
	class="overflow-hidden bg-cream px-5 py-12 lg:px-[70px] lg:pt-[74px] lg:pb-[84px]"
>
	<div class="mb-6 flex items-end justify-between lg:mb-[34px]">
		<h2 class="m-0 text-[28px] font-semibold lg:text-[46px]">Vos avis</h2>
		<div class="flex gap-2.5">
			<button
				onclick={prev}
				aria-label="Avis précédents"
				class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink text-[18px] disabled:opacity-40"
				disabled={!wide || index === 0}
			>
				←
			</button>
			<button
				onclick={next}
				aria-label="Avis suivants"
				class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-pink text-[18px] text-white disabled:opacity-40"
				disabled={!wide || index === maxIndex}
			>
				→
			</button>
		</div>
	</div>

	<div class="-mx-5 overflow-x-auto px-5 lg:mx-0 lg:overflow-hidden lg:px-0">
		<div
			class="flex snap-x gap-4 transition-transform duration-[600ms] [transition-timing-function:cubic-bezier(.4,0,.2,1)] lg:gap-[26px]"
			style={wide ? `transform:translateX(-${index * step}px)` : undefined}
		>
			{#each reviews as review, i (review.name)}
				<figure
					class="m-0 w-[280px] flex-none snap-start border-2 border-ink p-5 sm:w-[404px] lg:px-[26px] lg:py-6"
					style="background:{reviewCardBg[i % reviewCardBg.length]};border-radius:{reviewCardRadius[
						i % reviewCardRadius.length
					]};transform:rotate({rot(i)}deg)"
				>
					<div class="text-[15px] tracking-[0.14em] text-pink">★★★★★</div>
					<blockquote
						class="my-3 mb-[18px] ml-0 font-hand text-[23px] leading-[1.28] lg:text-[25px]"
					>
						“{review.text}”
					</blockquote>
					<figcaption class="flex items-center gap-3">
						<div
							class="h-11 w-11 rounded-[12px] border-[1.5px] border-ink/30"
							style="background:repeating-linear-gradient(135deg,rgba(46,27,51,.14) 0 5px,rgba(255,255,255,0) 5px 10px),#FFFCF7"
						></div>
						<div>
							<div class="text-[17px]">{review.name}</div>
							<div class="text-[12px] text-ink/55">{review.date} · {review.item}</div>
						</div>
					</figcaption>
				</figure>
			{/each}
		</div>
	</div>
</section>
