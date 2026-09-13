<script lang="ts">
	import { Input } from '$lib/client/ui/shadcn/input';
	import { getAdminProducts } from '$lib/remote/admin.remote';

	let {
		id,
		label,
		onpick,
		exclude = [],
		disabled = false
	}: {
		id: string;
		label: string;
		onpick: (product: { id: string; name: string }) => void;
		exclude?: string[];
		disabled?: boolean;
	} = $props();

	let search = $state('');
	let debounced = $state('');

	$effect(() => {
		const value = search.trim();
		const timer = setTimeout(() => (debounced = value), 300);

		return () => clearTimeout(timer);
	});

	const results = $derived(
		debounced.length >= 2
			? (await getAdminProducts({ query: debounced, status: 'PUBLISHED', page: 1 })).items
					.filter((product) => !exclude.includes(product.id))
					.slice(0, 6)
			: []
	);

	function pick(product: { id: string; name: string }) {
		onpick({ id: product.id, name: product.name });
		search = '';
		debounced = '';
	}
</script>

<div class="flex flex-col gap-1.5">
	<Input
		{id}
		aria-label={label}
		placeholder="Tape au moins deux lettres du nom"
		bind:value={search}
		{disabled}
	/>
	{#if results.length > 0}
		<ul class="m-0 flex list-none flex-col gap-1 rounded-[12px] border-2 border-input bg-paper p-1">
			{#each results as product (product.id)}
				<li>
					<button
						type="button"
						onclick={() => pick(product)}
						class="w-full cursor-pointer rounded-[10px] px-2.5 py-1.5 text-left text-sm hover:bg-pink-soft"
					>
						{product.name}
					</button>
				</li>
			{/each}
		</ul>
	{:else if debounced.length >= 2}
		<p class="m-0 text-xs text-muted-foreground">Aucun produit publié ne correspond.</p>
	{/if}
</div>
