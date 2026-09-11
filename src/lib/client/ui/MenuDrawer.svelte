<script lang="ts">
	import AstroidIcon from '@lucide/svelte/icons/astroid';
	import XIcon from '@lucide/svelte/icons/x';
	import { resolve } from '$app/paths';
	import { shopLinks, universeLinks } from '$lib/client/data/content';
	import { ui } from '$lib/client/state/shop.svelte';
	import Logo from './Logo.svelte';
	import Star from './Star.svelte';
	import TornEdge from './TornEdge.svelte';

	let { signedIn = false }: { signedIn?: boolean } = $props();

	let closeButton = $state<HTMLButtonElement>();
	let returnFocus: HTMLElement | null = null;

	$effect(() => {
		if (ui.menuOpen) {
			returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			closeButton?.focus();
		} else if (returnFocus) {
			returnFocus.focus();
			returnFocus = null;
		}
	});

	const infoLinks = $derived([
		{ label: 'Avis', href: resolve('/#avis') },
		{ label: 'À propos', href: resolve('/#a-propos') },
		{
			label: signedIn ? 'Mon espace' : 'Se connecter',
			href: signedIn ? resolve('/profile') : resolve('/sign')
		},
		{ label: 'Informations légales', href: resolve('/legal') }
	]);

	const tabPositions = ['left-5', 'left-[36%]', 'right-6', 'left-[20%]', 'right-[18%]'];

	const tilt = (index: number) => (index % 2 === 0 ? -1.2 : 1.1);
	const tabPosition = (index: number) => tabPositions[index % tabPositions.length];

	const cardClass =
		'relative -mt-3.5 block rounded-[22px] border-2 border-ink pb-7 text-ink shadow-[6px_7px_0_rgba(46,27,51,.14)] first:mt-0 last:pb-4 hover:z-30 hover:text-ink hover:shadow-[10px_13px_0_rgba(46,27,51,.22)] focus-within:z-30 motion-safe:rotate-(--tilt) motion-safe:transition-[rotate,translate,box-shadow] motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-2 motion-safe:hover:rotate-0 motion-safe:focus-within:-translate-y-2 motion-safe:focus-within:rotate-0';
	const tabClass =
		'absolute -top-[27px] rounded-t-[14px] border-2 border-b-0 border-ink px-3.5 pt-1 pb-1.5 font-hand text-[19px] leading-none';

	function onWindowKey(event: KeyboardEvent) {
		if (event.key === 'Escape' && ui.menuOpen) {
			ui.closeAll();
		}
	}
</script>

<svelte:window onkeydown={onWindowKey} />

<!-- eslint-disable svelte/no-navigation-without-resolve -->

<button
	aria-label="Fermer le menu"
	onclick={() => ui.closeAll()}
	inert={!ui.menuOpen}
	class="fixed inset-0 z-[60] cursor-default bg-ink/35 transition-opacity duration-300 {ui.menuOpen
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
></button>

<div
	role="dialog"
	aria-modal="true"
	aria-label="Menu"
	class="fixed top-0 left-0 z-[61] flex h-full w-full flex-col shadow-[22px_0_60px_rgba(46,27,51,.2)] transition-transform duration-[450ms] [transition-timing-function:cubic-bezier(.4,0,.2,1)] sm:w-[396px] {ui.menuOpen
		? 'translate-x-0'
		: '-translate-x-full'}"
	style="background:repeating-linear-gradient(90deg,#FFF0F6 0 20px,#FFFCF7 20px 40px)"
	aria-hidden={!ui.menuOpen}
	inert={!ui.menuOpen}
>
	<div class="flex items-center justify-between px-5 pt-6 sm:px-[30px] sm:pt-[26px]">
		<span class="text-[12px] tracking-[0.16em] text-ink/50 uppercase">Navigation</span>
		<div class="sm:hidden"><Logo size="sm" /></div>
		<button
			bind:this={closeButton}
			onclick={() => ui.closeAll()}
			class="flex cursor-pointer items-center rounded-full p-1.5 hover:bg-pink-soft"
			aria-label="Fermer"
		>
			<XIcon class="size-5" aria-hidden="true" />
		</button>
	</div>

	<div
		class="relative flex-1 overflow-y-auto px-5 pt-10 pb-8 sm:px-[30px]"
		data-testid="menu-stack"
	>
		{#each universeLinks as universe, index (universe.label)}
			<a
				href={universe.href}
				onclick={() => ui.closeAll()}
				class="{cardClass} {universe.bg}"
				style="--tilt:{tilt(index)}deg; z-index:{index + 1}"
			>
				<span class="{tabClass} {tabPosition(index)} {universe.bg}">univers</span>
				<span class="flex items-center justify-between px-[18px] pt-4">
					<span class="text-[28px] leading-none font-semibold">{universe.label}</span>
					<Star
						color={universe.star}
						size={26}
						class="motion-safe:transition-transform motion-safe:duration-500"
					/>
				</span>
			</a>
		{/each}

		<a
			href={resolve('/search?query=personnalisable')}
			onclick={() => ui.closeAll()}
			class="{cardClass} bg-purple-soft"
			style="--tilt:{tilt(universeLinks.length)}deg; z-index:{universeLinks.length + 1}"
		>
			<span class="{tabClass} {tabPosition(universeLinks.length)} bg-purple-soft">sur mesure</span>
			<span class="block px-[18px] pt-4">
				<span class="block text-[24px] leading-[1.05] font-semibold">Personnalisation</span>
				<span class="font-hand text-[19px] text-pink-deep">
					crée ton bijou perle par perle
					<AstroidIcon class="inline-block size-3" aria-hidden="true" />
				</span>
			</span>
		</a>

		<div
			class="{cardClass} bg-pink-soft"
			style="--tilt:{tilt(universeLinks.length + 1)}deg; z-index:{universeLinks.length + 2}"
		>
			<span class="{tabClass} {tabPosition(universeLinks.length + 1)} bg-pink-soft">boutique</span>
			<nav aria-label="Boutique" class="flex flex-col gap-0.5 px-[18px] pt-4">
				{#each shopLinks as link (link.label)}
					<a
						href={link.href}
						onclick={() => ui.closeAll()}
						class="w-fit text-[21px] font-medium text-ink decoration-pink decoration-2 underline-offset-4 hover:text-ink hover:underline"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>

		<div
			class="{cardClass} bg-paper"
			style="--tilt:{tilt(universeLinks.length + 2)}deg; z-index:{universeLinks.length + 3}"
		>
			<span class="{tabClass} {tabPosition(universeLinks.length + 2)} bg-paper">infos</span>
			<nav aria-label="Informations" class="flex flex-col gap-1.5 px-[18px] pt-4 text-[16px]">
				{#each infoLinks as link (link.label)}
					<a
						href={link.href}
						onclick={() => ui.closeAll()}
						class="w-fit text-ink decoration-pink decoration-2 underline-offset-4 hover:text-ink hover:underline"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>
	</div>

	<div class="flex gap-3.5 px-5 pb-5 text-[14px] text-ink/65 sm:px-[30px]">
		<span>Instagram</span><span>TikTok</span><span>Pinterest</span>
	</div>
	<TornEdge variant="a" color="#F0369B" height={18} flip class="sm:hidden" />
</aside>
