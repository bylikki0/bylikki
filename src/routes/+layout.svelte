<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ui, wishlist } from '$lib/client/state/shop.svelte';
	import AnnouncementBar from '$lib/client/ui/AnnouncementBar.svelte';
	import CartDrawer from '$lib/client/ui/CartDrawer.svelte';
	import MenuDrawer from '$lib/client/ui/MenuDrawer.svelte';
	import PageError from '$lib/client/ui/PageError.svelte';
	import SearchBar from '$lib/client/ui/SearchBar.svelte';
	import SiteFooter from '$lib/client/ui/SiteFooter.svelte';
	import TopBar from '$lib/client/ui/TopBar.svelte';
	import { importWishlist } from '$lib/remote/wishlist.remote';

	let { children, data } = $props();

	let wishlistSynced = $state(false);

	$effect(() => {
		if (wishlistSynced || !data.signedIn) {
			return;
		}

		wishlistSynced = true;
		const pending = wishlist.pending().filter((id) => !data.wishlist.includes(id));

		if (pending.length === 0) {
			wishlist.adopt(data.wishlist);
			return;
		}

		importWishlist(pending)
			.then(() => wishlist.adopt([...new Set([...data.wishlist, ...pending])]))
			.catch(() => wishlist.adopt(data.wishlist));
	});

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			ui.closeAll();
		}
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

<svelte:window onkeydown={onKeydown} />

<div class="site-shell flex min-h-screen w-full flex-col bg-cream">
	<AnnouncementBar announcement={data.announcement} />
	<TopBar signedIn={data.signedIn} isAdmin={data.isAdmin} />
	<MenuDrawer signedIn={data.signedIn} />
	<CartDrawer signedIn={data.signedIn} />
	<SearchBar />
	<main class="flex-1">
		<!-- Sans snippet `pending`, le rendu serveur attend les donnees : la page
		     part complete dans le HTML, et une erreur de chargement reste locale. -->
		<svelte:boundary>
			{@render children()}

			{#snippet failed(error, reset)}
				<PageError {error} {reset} />
			{/snippet}
		</svelte:boundary>
	</main>
	<SiteFooter />
</div>
