<script lang="ts">
	import PhotoPlaceholder from './PhotoPlaceholder.svelte';
	import type { Product } from '#lib/data/catalogue';

	let { product, compact = false }: { product: Product; compact?: boolean } = $props();
</script>

<article
	class="flex h-full w-full flex-col border-2 border-ink bg-paper {compact
		? 'rounded-[22px] p-3 shadow-[10px_12px_0_rgba(46,27,51,.13)]'
		: 'rounded-[28px] p-4 shadow-[14px_16px_0_rgba(46,27,51,.13)]'}"
>
	<div class="relative flex-1">
		<PhotoPlaceholder
			label={product.photo}
			tint="rgba(240,54,155,.13)"
			radius={compact ? '14px' : '18px'}
			class="h-full"
		/>
		<span
			class="absolute top-2.5 left-2.5 rounded-[20px] border-[1.5px] border-ink bg-yellow px-2.5 py-[3px] text-[9px] tracking-[0.1em] uppercase lg:top-3.5 lg:left-3.5 lg:px-3 lg:py-1 lg:text-[11px]"
		>
			{product.tag}
		</span>
	</div>
	<div
		class="flex items-end justify-between gap-2 {compact ? 'px-1 pt-2.5 pb-0.5' : 'px-1.5 pt-4 pb-1'}"
	>
		<div>
			<div class="leading-[1.1] font-semibold {compact ? 'text-[15px]' : 'text-[23px]'}">
				{product.name}
			</div>
			{#if !compact}
				<div class="mt-0.5 text-[13px] text-ink/60">{product.note}</div>
			{/if}
		</div>
		<div class="whitespace-nowrap {compact ? 'text-[15px]' : 'text-[22px]'}">{product.price}</div>
	</div>
</article>
