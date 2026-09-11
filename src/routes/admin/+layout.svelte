<script lang="ts">
	import BoxIcon from '@lucide/svelte/icons/box';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import MailIcon from '@lucide/svelte/icons/mail';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import PackageIcon from '@lucide/svelte/icons/package';
	import ReceiptIcon from '@lucide/svelte/icons/receipt';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import StoreIcon from '@lucide/svelte/icons/store';
	import TagsIcon from '@lucide/svelte/icons/tags';
	import TicketIcon from '@lucide/svelte/icons/ticket';
	import UsersIcon from '@lucide/svelte/icons/users';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Logo from '$lib/client/ui/Logo.svelte';
	import { Separator } from '$lib/client/ui/shadcn/separator';

	let { children, data } = $props();

	const links = [
		{ href: resolve('/admin'), label: 'Tableau de bord', icon: LayoutDashboardIcon, exact: true },
		{ href: resolve('/admin/produits'), label: 'Produits', icon: BoxIcon, exact: false },
		{ href: resolve('/admin/commandes'), label: 'Commandes', icon: ReceiptIcon, exact: false },
		{ href: resolve('/admin/retours'), label: 'Retours', icon: PackageIcon, exact: false },
		{ href: resolve('/admin/comptes'), label: 'Comptes', icon: UsersIcon, exact: false },
		{ href: resolve('/admin/avis'), label: 'Avis', icon: MessageSquareIcon, exact: false },
		{ href: resolve('/admin/catalogue'), label: 'Catalogue', icon: TagsIcon, exact: false },
		{ href: resolve('/admin/promotions'), label: 'Promotions', icon: TicketIcon, exact: false },
		{ href: resolve('/admin/newsletter'), label: 'Newsletter', icon: MailIcon, exact: false },
		{ href: resolve('/admin/parametres'), label: 'Paramètres', icon: SettingsIcon, exact: false }
	];

	const isActive = (link: (typeof links)[number]) =>
		link.exact ? page.url.pathname === link.href : page.url.pathname.startsWith(link.href);
</script>

<svelte:head>
	<title>Administration BYLIKKI</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="admin-shell flex min-h-screen flex-col md:flex-row">
	<aside
		class="w-full shrink-0 border-b-2 border-ink p-4 md:w-60 md:border-r-2 md:border-b-0 xl:w-72 3xl:w-80"
		style="background:repeating-linear-gradient(90deg,#FFF0F6 0 18px,#FFFCF7 18px 36px)"
	>
		<div class="mb-5 flex items-center justify-between gap-3 md:flex-col md:items-start">
			<Logo size="sm" />
			<div class="min-w-0 text-right md:text-left">
				<div class="font-hand text-[22px] leading-none text-pink-deep">l’atelier admin</div>
				<div class="truncate text-xs text-muted-foreground">{data.admin.email}</div>
			</div>
		</div>

		<nav class="flex flex-wrap gap-1.5 md:flex-col">
			{#each links as link (link.href)}
				<a
					href={link.href}
					aria-current={isActive(link) ? 'page' : undefined}
					class="flex items-center gap-2 rounded-[14px] border-2 px-3 py-2 text-sm font-medium text-ink transition-[background-color,border-color,transform] hover:border-ink hover:bg-pink-soft hover:text-ink motion-safe:hover:-translate-y-px {isActive(
						link
					)
						? 'border-ink bg-pink-soft font-semibold shadow-[3px_3px_0_#2e1b33]'
						: 'border-transparent'}"
				>
					<link.icon class="size-4" aria-hidden="true" />
					{link.label}
				</a>
			{/each}
		</nav>

		<Separator class="my-4 hidden bg-ink/20 md:block" />

		<a
			href={resolve('/')}
			class="flex items-center gap-2 rounded-[14px] px-3 py-2 text-sm text-ink/75 hover:text-pink-deep"
		>
			<StoreIcon class="size-4" />
			Retour à la boutique
		</a>
	</aside>

	<main class="min-w-0 flex-1 p-4 md:p-8 xl:p-10 3xl:p-12">
		{@render children()}
	</main>
</div>
