<script lang="ts">
	import HeartIcon from '@lucide/svelte/icons/heart';
	import { page } from '$app/state';
	import { wishlist } from '$lib/client/state/shop.svelte';
	import { toMessage } from '$lib/client/utils/errors';
	import { toggleWishlist } from '$lib/remote/wishlist.remote';

	type Props = { productId: string; productName: string; class?: string };

	let { productId, productName, class: className = '' }: Props = $props();

	const signedIn = $derived(page.data.signedIn === true);

	const saved = $derived(wishlist.has(productId));

	let pending = $state(false);
	let hint = $state('');

	async function toggle(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		if (!signedIn) {
			wishlist.toggleLocal(productId);
			hint = wishlist.has(productId)
				? 'Gardé de côté. Connecte-toi pour le retrouver partout.'
				: '';
			return;
		}

		wishlist.toggleLocal(productId);
		hint = '';
		pending = true;

		try {
			await toggleWishlist(productId);
		} catch (error) {
			wishlist.toggleLocal(productId);
			hint = toMessage(error, "Cette pièce n'a pas pu être mise de côté.");
		} finally {
			pending = false;
		}
	}
</script>

<button
	type="button"
	onclick={toggle}
	aria-busy={pending}
	aria-pressed={saved}
	aria-label={saved
		? `Retirer ${productName} de mes envies`
		: `Ajouter ${productName} à mes envies`}
	title={saved ? 'Retirer de mes envies' : 'Ajouter à mes envies'}
	class="inline-flex cursor-pointer items-center leading-none transition-transform hover:scale-110 disabled:opacity-50 {className}"
	class:text-pink={saved}
	class:text-ink={!saved}
>
	<HeartIcon class="size-5 {saved ? 'fill-current' : ''}" aria-hidden="true" />
</button>

{#if hint}
	<span class="text-[12px] text-ink/60">{hint}</span>
{/if}
