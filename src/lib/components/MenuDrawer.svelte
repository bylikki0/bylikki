<script lang="ts">
	import Logo from './Logo.svelte';
	import Star from './Star.svelte';
	import PhotoPlaceholder from './PhotoPlaceholder.svelte';
	import TornEdge from './TornEdge.svelte';
	import { ui } from '#lib/state/shop.svelte';
	import { shopLinks } from '#lib/data/catalogue';

	const universes = [
		{ label: 'BIJOUX', bg: 'bg-yellow-soft', star: '#FFDE59' },
		{ label: 'COUTURE', bg: 'bg-blue-soft', star: '#6EC6EE' },
		{ label: 'UPCYCLING', bg: 'bg-green-soft', star: '#7ED598' }
	];
</script>

<!-- voile -->
<button
	aria-label="Fermer le menu"
	onclick={() => ui.closeAll()}
	class="fixed inset-0 z-[60] cursor-default bg-ink/35 transition-opacity duration-300 {ui.menuOpen
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
></button>

<aside
	class="fixed top-0 left-0 z-[61] flex h-full w-full flex-col shadow-[22px_0_60px_rgba(46,27,51,.2)] transition-transform duration-[450ms] [transition-timing-function:cubic-bezier(.4,0,.2,1)] sm:w-[396px] {ui.menuOpen
		? 'translate-x-0'
		: '-translate-x-full'}"
	style="background:repeating-linear-gradient(90deg,#FFF0F6 0 20px,#FFFCF7 20px 40px)"
	aria-hidden={!ui.menuOpen}
>
	<div class="flex items-center justify-between px-5 pt-6 sm:px-[34px] sm:pt-[30px]">
		<span class="text-[12px] tracking-[0.16em] text-ink/50 uppercase">Navigation</span>
		<div class="sm:hidden"><Logo size="sm" /></div>
		<button onclick={() => ui.closeAll()} class="cursor-pointer text-[22px]" aria-label="Fermer">✕</button>
	</div>

	<!-- mobile : cartes univers colorées -->
	<div class="flex flex-col gap-3 px-5 pt-5 sm:hidden">
		{#each universes as u (u.label)}
			<a
				href="/"
				class="flex items-center justify-between rounded-[20px] border-2 border-ink px-[18px] py-4 {u.bg}"
			>
				<span class="text-[30px] leading-none font-semibold">{u.label}</span>
				<Star color={u.star} size={26} />
			</a>
		{/each}
		<a href="/" class="rounded-[20px] border-2 border-ink bg-purple-soft px-[18px] py-4">
			<span class="block text-[24px] leading-[1.05] font-semibold">PERSONNALISATION</span>
			<span class="font-hand text-[19px] text-pink">crée ton bijou perle par perle ✦</span>
		</a>
	</div>

	<!-- desktop : liste typographique -->
	<nav class="mt-6 hidden flex-col gap-1 px-[34px] text-[30px] font-medium sm:flex">
		{#each shopLinks as link (link)}
			<a href="/" class="text-ink transition-colors hover:text-pink">{link}</a>
		{/each}
	</nav>

	<div class="mx-5 my-6 h-px bg-ink/15 sm:mx-[34px]"></div>

	<div class="flex flex-col gap-2.5 px-5 text-[16px] sm:px-[34px]">
		<a href="/#avis" class="text-ink">Avis</a>
		<a href="/#a-propos" class="text-ink">À propos</a>
		<a href="/connexion" class="text-ink">Mon compte</a>
		<a href="/legal" class="text-ink">Informations légales</a>
	</div>

	<div class="relative mt-auto hidden px-[34px] pb-[30px] sm:block">
		<PhotoPlaceholder
			label={'ILLUSTRATION / PHOTO\ndécorative du menu'}
			tint="rgba(255,222,89,.4)"
			bg="#FFFCF7"
			radius="20px"
			class="h-[170px]"
		/>
		<Star color="#F0369B" size={38} class="absolute -top-4 right-6 animate-twinkle" />
	</div>

	<div class="mt-auto flex gap-3.5 px-5 pb-5 text-[14px] text-ink/65 sm:hidden">
		<span>Instagram</span><span>TikTok</span><span>Pinterest</span>
	</div>
	<TornEdge variant="a" color="#F0369B" height={18} flip class="sm:hidden" />
</aside>
