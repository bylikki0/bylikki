<script lang="ts">
	import OrderCard from '#lib/components/OrderCard.svelte';
	import ConsentToggle from '#lib/components/ConsentToggle.svelte';
	import DangerZone from '#lib/components/DangerZone.svelte';
	import {
		orders,
		orderFilters,
		accountFields,
		consents,
		rgpdActions,
		type OrderState
	} from '#lib/data/account';

	let tab = $state<'achats' | 'params'>('achats');
	let filter = $state<'toutes' | OrderState>('toutes');
	let notif = $state({ news: true, resto: false, avis: true });

	const shown = $derived(filter === 'toutes' ? orders : orders.filter((o) => o.state === filter));
	const countFor = (id: 'toutes' | OrderState) =>
		id === 'toutes' ? orders.length : orders.filter((o) => o.state === id).length;
</script>

<svelte:head>
	<title>Mon espace — BYLIKKI</title>
</svelte:head>

<div class="flex flex-col gap-6 px-5 pt-8 pb-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:px-[70px] lg:pt-12">
	<div class="flex flex-col gap-2.5">
		<span class="font-hand text-[24px] text-pink lg:text-[27px]">re-bonjour ♡</span>
		<h1 class="m-0 text-[32px] leading-[1.04] font-semibold lg:text-[46px]">Mon espace</h1>
		<span class="text-[14.5px] text-ink/70">
			emma@exemple.fr · cliente depuis mars 2025 · {orders.length + 2} commandes
		</span>
	</div>

	<div class="flex gap-2.5 self-start rounded-[40px] border-2 border-ink bg-paper p-1.5">
		{#each [{ id: 'achats', label: 'Mes achats' }, { id: 'params', label: 'Paramètres' }] as const as t (t.id)}
			<button
				onclick={() => (tab = t.id)}
				class="cursor-pointer rounded-[40px] px-5 py-3 text-[15px] font-semibold transition-colors lg:px-[26px] {tab ===
				t.id
					? 'bg-pink text-white'
					: 'text-ink hover:bg-pink-pale'}"
				aria-current={tab === t.id ? 'page' : undefined}
			>
				{t.label}
			</button>
		{/each}
	</div>
</div>

{#if tab === 'achats'}
	<div class="flex flex-col gap-5 px-5 pt-4 pb-16 lg:gap-[26px] lg:px-[70px] lg:pb-20">
		<div class="flex flex-wrap gap-2.5">
			{#each orderFilters as f (f.id)}
				<button
					onclick={() => (filter = f.id)}
					class="cursor-pointer rounded-[40px] border-[1.5px] border-ink px-5 py-2.5 text-[14px] font-semibold transition-colors {filter ===
					f.id
						? 'bg-yellow'
						: 'bg-transparent hover:bg-yellow-soft'}"
				>
					{f.label} <span class="opacity-55">{countFor(f.id)}</span>
				</button>
			{/each}
		</div>

		<div class="flex flex-col gap-5">
			{#each shown as order (order.ref)}
				<OrderCard {order} />
			{/each}
		</div>

		{#if shown.length === 0}
			<p class="rounded-[26px] bg-yellow-soft p-10 text-center font-hand text-[24px] lg:text-[26px]">
				rien dans cette catégorie pour l’instant ✦
			</p>
		{/if}
	</div>
{:else}
	<div
		class="grid grid-cols-1 items-start gap-5 px-5 pt-4 pb-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-[26px] lg:px-[70px] lg:pb-20"
	>
		<div class="flex flex-col gap-5 lg:gap-[26px]">
			<section
				class="rounded-[20px] border-2 border-ink bg-paper p-6 shadow-[8px_10px_0_rgba(46,27,51,.08)] lg:rounded-[26px] lg:p-[30px] lg:shadow-[10px_12px_0_rgba(46,27,51,.08)]"
			>
				<h2 class="mt-0 mb-5 text-[22px] font-semibold lg:text-[24px]">Informations du compte</h2>
				<div class="flex flex-col gap-4">
					{#each accountFields as field (field.label)}
						<div class="flex flex-col gap-1.5">
							<span class="text-[12.5px] font-semibold text-ink/70">{field.label}</span>
							<div class="flex items-center gap-2.5">
								<div
									class="flex-1 rounded-[16px] border-[1.5px] border-ink/20 bg-cream px-[18px] py-[15px] text-[15.5px]"
								>
									{field.value}
								</div>
								<button class="cursor-pointer text-[13.5px] font-semibold whitespace-nowrap text-pink">
									Modifier
								</button>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<section class="rounded-[20px] bg-blue-soft p-6 lg:rounded-[26px] lg:p-[30px]">
				<h2 class="mt-0 mb-1.5 text-[22px] font-semibold lg:text-[24px]">Communications</h2>
				<p class="mt-0 mb-[18px] text-[14px] text-ink/72">
					Consentements séparés, révocables en un clic.
				</p>
				<div class="flex flex-col gap-3">
					{#each consents as c (c.id)}
						<ConsentToggle
							label={c.label}
							desc={c.desc}
							checked={notif[c.id]}
							onchange={() => (notif[c.id] = !notif[c.id])}
						/>
					{/each}
				</div>
			</section>
		</div>

		<div class="flex flex-col gap-5 lg:gap-[26px]">
			<section
				class="rounded-[20px] border-2 border-ink bg-paper p-6 shadow-[8px_10px_0_rgba(46,27,51,.08)] lg:rounded-[26px] lg:p-[30px] lg:shadow-[10px_12px_0_rgba(46,27,51,.08)]"
			>
				<span class="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">RGPD</span>
				<h2 class="mt-2 mb-1.5 text-[22px] font-semibold lg:text-[24px]">Tes données</h2>
				<p class="mt-0 mb-5 text-[14px] leading-[1.55] text-ink/72">
					Adresse e-mail, adresse de livraison et historique de commandes. Conservés 3 ans après le
					dernier achat, 10 ans pour les factures.
				</p>
				<div class="flex flex-col gap-3">
					{#each rgpdActions as action (action.label)}
						<div
							class="flex flex-col gap-3 rounded-[18px] border-[1.5px] border-ink/20 px-[18px] py-[15px] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
						>
							<div class="flex min-w-0 flex-col gap-[3px]">
								<span class="text-[15px] font-semibold">{action.label}</span>
								<span class="text-[12.5px] text-ink/60">{action.desc}</span>
							</div>
							<button
								class="cursor-pointer self-start rounded-[40px] border-[1.5px] border-ink bg-yellow-soft px-[18px] py-2.5 text-[13px] font-semibold whitespace-nowrap sm:self-auto"
							>
								{action.cta}
							</button>
						</div>
					{/each}
				</div>
			</section>

			<DangerZone />
		</div>
	</div>
{/if}
