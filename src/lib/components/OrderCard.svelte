<script lang="ts">
	import PhotoPlaceholder from './PhotoPlaceholder.svelte';
	import { statusBg, type Order } from '#lib/data/account';

	let { order }: { order: Order } = $props();
</script>

<article
	class="grid grid-cols-1 items-center gap-4 rounded-[20px] border-2 border-ink bg-paper p-5 shadow-[8px_10px_0_rgba(46,27,51,.08)] sm:grid-cols-[124px_minmax(0,1fr)] lg:grid-cols-[124px_minmax(0,1fr)_250px] lg:gap-[26px] lg:rounded-[26px] lg:px-7 lg:py-[26px] lg:shadow-[10px_12px_0_rgba(46,27,51,.08)]"
>
	<PhotoPlaceholder label={order.photo} tint="rgba(240,54,155,.13)" bg="#FFF0F6" class="h-[124px]" />

	<div class="flex min-w-0 flex-col gap-2">
		<div class="flex flex-wrap items-center gap-3">
			<span
				class="rounded-[20px] border-[1.5px] border-ink px-3.5 py-[5px] text-[12.5px] font-semibold"
				style="background:{statusBg[order.state]}"
			>
				{order.status}
			</span>
			<span class="text-[12.5px] text-ink/60">Commande {order.ref} · {order.date}</span>
		</div>
		<h3 class="m-0 text-[20px] font-semibold lg:text-[22px]">{order.title}</h3>
		<span class="text-[14px] text-ink/70">{order.detail}</span>
		<span class="text-[13.5px] text-ink/60">{order.next}</span>
	</div>

	<div class="flex flex-row items-center justify-between gap-2.5 lg:flex-col lg:items-end">
		<span class="text-[22px] font-semibold">{order.total}</span>
		<div class="flex flex-col items-end gap-2.5">
			<button
				class="cursor-pointer rounded-[40px] bg-ink px-5 py-[11px] text-[13.5px] font-semibold text-cream"
			>
				{order.action}
			</button>
			<button class="cursor-pointer border-b-[1.5px] border-ink/40 pb-px text-[13px] text-ink/75">
				{order.action2}
			</button>
		</div>
	</div>
</article>
