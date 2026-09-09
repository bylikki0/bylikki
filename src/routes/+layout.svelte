<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import TopBar from '#lib/components/TopBar.svelte';
	import MenuDrawer from '#lib/components/MenuDrawer.svelte';
	import CartDrawer from '#lib/components/CartDrawer.svelte';
	import SiteFooter from '#lib/components/SiteFooter.svelte';

	let { children } = $props();

	/** fondu rose de la topbar au scroll, comme dans la maquette */
	let fuse = $state(0);

	function onScroll() {
		fuse = Math.max(0, Math.min(1, window.scrollY / 420));
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=Caveat:wght@500;600;700&display=swap"
	/>
</svelte:head>

<svelte:window onscroll={onScroll} />

<div class="mx-auto flex min-h-screen max-w-[1440px] flex-col bg-cream">
	<TopBar {fuse} />
	<MenuDrawer />
	<CartDrawer />
	<main class="flex-1">
		{@render children()}
	</main>
	<SiteFooter />
</div>
