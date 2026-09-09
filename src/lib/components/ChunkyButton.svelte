<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Bouton « chunky » de la maquette : pilule + ombre portée pleine. */
	let {
		variant = 'pink',
		href = undefined,
		type = 'button',
		full = false,
		class: klass = '',
		onclick = undefined,
		children
	}: {
		variant?: 'pink' | 'ink' | 'ghost' | 'danger';
		href?: string;
		type?: 'button' | 'submit';
		full?: boolean;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();

	const styles = {
		pink:
			'bg-pink text-white shadow-[0_8px_0_var(--color-pink-deep)] hover:translate-y-[3px] hover:shadow-[0_5px_0_var(--color-pink-deep)]',
		ink: 'bg-ink text-cream hover:bg-ink/90',
		ghost: 'border-[1.5px] border-ink text-ink hover:bg-ink/5',
		danger: 'border-2 border-pink-deep text-pink-deep hover:bg-pink-deep/10'
	};
</script>

{#snippet inner()}
	{@render children()}
{/snippet}

{#if href}
	<a
		{href}
		class="inline-flex items-center justify-center rounded-[40px] px-6 py-4 text-center text-[16px] font-semibold transition-[transform,box-shadow,background] duration-200 sm:text-[17px] {styles[
			variant
		]} {full ? 'w-full' : ''} {klass}"
	>
		{@render inner()}
	</a>
{:else}
	<button
		{type}
		{onclick}
		class="inline-flex cursor-pointer items-center justify-center rounded-[40px] px-6 py-4 text-center text-[16px] font-semibold transition-[transform,box-shadow,background] duration-200 sm:text-[17px] {styles[
			variant
		]} {full ? 'w-full' : ''} {klass}"
	>
		{@render inner()}
	</button>
{/if}
