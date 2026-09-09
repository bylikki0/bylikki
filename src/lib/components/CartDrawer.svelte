<script lang="ts">
	import ChunkyButton from './ChunkyButton.svelte';
	import { cart, ui } from '#lib/state/shop.svelte';
</script>

<button
	aria-label="Fermer le panier"
	onclick={() => ui.closeAll()}
	class="fixed inset-0 z-[62] cursor-default bg-ink/35 transition-opacity duration-300 {ui.cartOpen
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
></button>

<aside
	class="fixed top-0 right-0 z-[63] flex h-full w-full flex-col bg-paper shadow-[-22px_0_60px_rgba(46,27,51,.2)] transition-transform duration-[450ms] [transition-timing-function:cubic-bezier(.4,0,.2,1)] sm:w-[430px] {ui.cartOpen
		? 'translate-x-0'
		: 'translate-x-full'}"
	aria-hidden={!ui.cartOpen}
>
	<div class="flex items-center justify-between border-b-[1.5px] border-ink/12 px-7 pt-[26px] pb-[18px]">
		<span class="text-[24px] font-semibold">Ton panier ({cart.count})</span>
		<button onclick={() => ui.closeAll()} class="cursor-pointer text-[22px]" aria-label="Fermer">✕</button>
	</div>

	<div class="flex flex-1 flex-col gap-5 overflow-auto px-7 py-[22px]">
		{#each cart.lines as line, i (line.name)}
			<div class="flex gap-4">
				<div
					class="h-[100px] w-[88px] flex-none rounded-[14px] border-[1.5px] border-ink/20"
					style="background:repeating-linear-gradient(135deg,rgba(240,54,155,.16) 0 6px,rgba(255,255,255,0) 6px 12px),#FFF9F2"
				></div>
				<div class="flex flex-1 flex-col gap-1.5">
					<div class="text-[17px]">{line.name}</div>
					<div class="text-[13px] text-ink/60">{line.variant}</div>
					<div class="mt-1.5 flex items-center justify-between">
						<div
							class="flex items-center gap-3 rounded-[20px] border-[1.5px] border-ink/25 px-3 py-1 text-[14px]"
						>
							<button
								onclick={() => cart.dec(i)}
								class="flex cursor-pointer items-center"
								aria-label="Retirer un exemplaire"
							>
								{#if line.qty <= 1}
									<svg viewBox="0 0 24 24" class="h-[15px] w-[15px]" aria-hidden="true">
										<path
											d="M5,7h14M9,7V4.5h6V7M6.5,7l1,13h9l1,-13"
											fill="none"
											stroke="#F0369B"
											stroke-width="1.8"
											stroke-linecap="round"
										/>
									</svg>
								{:else}
									−
								{/if}
							</button>
							<span>{line.qty}</span>
							<button onclick={() => cart.inc(i)} class="cursor-pointer" aria-label="Ajouter un exemplaire">
								+
							</button>
						</div>
						<span class="text-[16px]">{cart.lineTotal(line)}</span>
					</div>
				</div>
			</div>
		{/each}

		{#if cart.lines.length === 0}
			<p class="mt-10 text-center font-hand text-[24px] text-ink/55">ton panier est encore vide ✦</p>
		{/if}
	</div>

	<div class="border-t-[1.5px] border-ink/12 bg-pink-pale px-7 pt-[22px] pb-7">
		<div class="mb-1.5 flex justify-between text-[15px]">
			<span>Sous-total</span><span>{cart.subtotal}</span>
		</div>
		<div class="mb-4 flex justify-between text-[20px]">
			<span>Total</span><span>{cart.subtotal}</span>
		</div>
		<ChunkyButton full class="shadow-[0_7px_0_var(--color-pink-deep)]">Passer commande</ChunkyButton>
		<p class="mt-3 text-center font-hand text-[19px] text-ink/60">
			emballé à la main, avec un petit mot ♡
		</p>
	</div>
</aside>
