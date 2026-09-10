<script lang="ts">
	import StarIcon from '@lucide/svelte/icons/star';

	let {
		rating,
		count = null,
		size = 15
	}: { rating: number; count?: number | null; size?: number } = $props();

	const rounded = $derived(Math.round(rating));
	const stars = [1, 2, 3, 4, 5];
</script>

<span class="inline-flex items-center gap-1.5" aria-label={`Note : ${rating} sur 5`}>
	<!-- La note est portee par le libelle du parent : les etoiles restent decoratives. -->
	<span class="inline-flex items-center gap-0.5" aria-hidden="true">
		{#each stars as star (star)}
			<StarIcon
				class="fill-current {star <= rounded ? 'text-pink' : 'text-ink/25'}"
				style="width:{size}px;height:{size}px"
				strokeWidth={0}
			/>
		{/each}
	</span>
	{#if count !== null}
		<span class="text-[12.5px] text-ink/55">{count} avis</span>
	{/if}
</span>
