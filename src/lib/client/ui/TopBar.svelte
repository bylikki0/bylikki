<script lang="ts">
	import { resolve } from '$app/paths';
	import { cart, ui, wishlist } from '$lib/client/state/shop.svelte';
	import Logo from './Logo.svelte';
	import TornEdge from './TornEdge.svelte';

	let {
		signedIn = false,
		isAdmin = false
	}: {  signedIn?: boolean; isAdmin?: boolean } = $props();
</script>

<header class="sticky top-0 z-50">
	<div class="relative flex h-16 items-center justify-between bg-paper px-4 lg:h-24 lg:px-10">
		<div class="pointer-events-none absolute inset-0 bg-pink-soft"></div>

		<button
			onclick={() => ui.toggleMenu()}
			aria-label="Ouvrir le menu"
			class="relative flex cursor-pointer items-center gap-2.5 text-[15px] font-medium tracking-[0.08em] uppercase"
		>
			<span class="text-[20px] leading-none">☰</span>
			<span class="hidden sm:inline">Menu</span>
		</button>

		<div class="relative flex items-center gap-3 h-full">
			<span class="hidden font-hand text-[20px] text-pink lg:inline" style="transform:rotate(-8deg)"
				>✦</span
			>
			<div class="hidden lg:block"><Logo size="lg" /></div>
			<div class="lg:hidden"><Logo size="sm" /></div>
		</div>

		<div class="relative flex items-center gap-4 text-[17px] lg:gap-6 lg:text-[19px]">
			{#if isAdmin}
				<a href={resolve('/admin')} class="hidden text-[13px] font-semibold text-pink lg:inline">
					Admin
				</a>
			{/if}
			<button onclick={() => ui.toggleSearch()} class="cursor-pointer" aria-label="Rechercher">
				⌕ <span class="hidden text-[14px] lg:inline">Recherche</span>
			</button>
			<a
				href={signedIn ? resolve('/profile?onglet=envies') : resolve('/sign')}
				class="relative hidden text-ink sm:inline"
				aria-label="Mes envies"
			>
				{wishlist.count > 0 ? '♥' : '♡'}
				{#if wishlist.count > 0}
					<span
						class="absolute -top-1.5 -right-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-pink px-1 text-[10px] font-bold text-white"
					>
						{wishlist.count}
					</span>
				{/if}
			</a>
			<button
				onclick={() => ui.toggleCart()}
				class="relative cursor-pointer"
				aria-label="Ouvrir le panier"
			>
				🛍
				<span
					class="absolute -top-1.5 -right-2.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-pink text-[11px] font-semibold text-white"
				>
					{cart.count}
				</span>
			</button>
		</div>
	</div>

	<div
		class="pointer-events-none relative h-3.5 lg:h-6.5"
	>
		<TornEdge variant="a" color="#F0369B" height={26} flip class="absolute top-0 left-0" />
	</div>
</header>
