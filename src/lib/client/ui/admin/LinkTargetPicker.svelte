<script lang="ts" module>
	export const selectClass =
		'h-9 w-full rounded-[12px] border-2 border-input bg-paper px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';
</script>

<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Input } from '$lib/client/ui/shadcn/input';
	import { Label } from '$lib/client/ui/shadcn/label';
	import type { LinkTarget } from '$lib/client/validation/settings';
	import { getAdminProducts, getCategories } from '$lib/remote/admin.remote';

	let {
		target = $bindable(),
		id,
		label = 'Destination du bouton'
	}: { target: LinkTarget; id: string; label?: string } = $props();

	const kinds: { value: LinkTarget['kind']; label: string }[] = [
		{ value: 'category', label: 'Une catégorie' },
		{ value: 'search', label: 'Une recherche' },
		{ value: 'product', label: 'Un produit' },
		{ value: 'atelier', label: 'L’atelier' },
		{ value: 'none', label: 'Aucun lien' }
	];

	const categories = $derived(await getCategories());

	let productQuery = $state('');
	let debouncedQuery = $state('');
	let chosenName = $state('');

	$effect(() => {
		const value = productQuery.trim();
		const timer = setTimeout(() => (debouncedQuery = value), 300);

		return () => clearTimeout(timer);
	});

	const results = $derived(
		target.kind === 'product' && !target.slug && debouncedQuery.length >= 2
			? (
					await getAdminProducts({ query: debouncedQuery, status: 'PUBLISHED', page: 1 })
				).items.slice(0, 6)
			: []
	);

	function changeKind(kind: LinkTarget['kind']) {
		chosenName = '';
		productQuery = '';

		switch (kind) {
			case 'category':
				target = { kind, slug: categories[0]?.slug ?? '' };
				break;
			case 'search':
				target = { kind, query: '' };
				break;
			case 'product':
				target = { kind, slug: '' };
				break;
			default:
				target = { kind };
		}
	}

	function chooseProduct(product: { slug: string; name: string }) {
		target = { kind: 'product', slug: product.slug };
		chosenName = product.name;
		productQuery = '';
	}
</script>

<div class="flex flex-col gap-2">
	<Label for="{id}-kind">{label}</Label>
	<select
		id="{id}-kind"
		value={target.kind}
		onchange={(event) => changeKind(event.currentTarget.value as LinkTarget['kind'])}
		class={selectClass}
	>
		{#each kinds as kind (kind.value)}
			<option value={kind.value}>{kind.label}</option>
		{/each}
	</select>

	{#if target.kind === 'category'}
		<select
			id="{id}-category"
			aria-label="Catégorie"
			value={target.slug}
			onchange={(event) => (target = { kind: 'category', slug: event.currentTarget.value })}
			class={selectClass}
		>
			{#if categories.length === 0}
				<option value="">Aucune catégorie : crée-en une dans Catalogue</option>
			{/if}
			{#each categories as category (category.slug)}
				<option value={category.slug}>{category.name}</option>
			{/each}
		</select>
	{:else if target.kind === 'search'}
		<Input
			id="{id}-search"
			aria-label="Mots recherchés"
			placeholder="ex. étoile, lune, coeur"
			maxlength={80}
			value={target.query}
			oninput={(event) => (target = { kind: 'search', query: event.currentTarget.value })}
		/>
	{:else if target.kind === 'product'}
		{#if target.slug}
			<div
				class="flex items-center justify-between gap-2 rounded-[12px] border-2 border-ink bg-pink-soft px-3 py-1.5 text-sm"
			>
				<span class="truncate"><strong>{chosenName || target.slug}</strong></span>
				<button
					type="button"
					onclick={() => changeKind('product')}
					aria-label="Changer de produit"
					class="flex cursor-pointer items-center rounded-full p-1 hover:bg-paper"
				>
					<XIcon class="size-4" aria-hidden="true" />
				</button>
			</div>
		{:else}
			<Input
				id="{id}-product"
				aria-label="Chercher un produit"
				placeholder="Tape au moins deux lettres du nom"
				bind:value={productQuery}
			/>
			{#if results.length > 0}
				<ul
					class="m-0 flex list-none flex-col gap-1 rounded-[12px] border-2 border-input bg-paper p-1"
				>
					{#each results as product (product.id)}
						<li>
							<button
								type="button"
								onclick={() => chooseProduct(product)}
								class="w-full cursor-pointer rounded-[10px] px-2.5 py-1.5 text-left text-sm hover:bg-pink-soft"
							>
								{product.name}
							</button>
						</li>
					{/each}
				</ul>
			{:else if debouncedQuery.length >= 2}
				<p class="m-0 text-xs text-muted-foreground">Aucun produit publié ne correspond.</p>
			{/if}
		{/if}
	{/if}
</div>
