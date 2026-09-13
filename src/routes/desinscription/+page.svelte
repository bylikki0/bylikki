<script lang="ts">
	import AstroidIcon from '@lucide/svelte/icons/astroid';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import ChunkyButton from '$lib/client/ui/ChunkyButton.svelte';

	let { data, form } = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Désinscription BYLIKKI</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex max-w-[560px] flex-col gap-5 px-5 py-16 text-center lg:py-24">
	{#if form?.done}
		<span class="font-hand text-[26px] text-pink"
			>c'est noté <AstroidIcon class="inline-block size-3" aria-hidden="true" /></span
		>
		<h1 class="m-0 text-[30px] font-semibold lg:text-[38px]">Tu ne recevras plus la lettre</h1>
		<p class="m-0 text-[15.5px] leading-[1.6] text-ink/75">
			Ta désinscription est prise en compte. Les e-mails liés à tes commandes, eux, continuent
			d'arriver : ils sont nécessaires au suivi de tes achats.
		</p>
	{:else if data.status === 'confirm'}
		<h1 class="m-0 text-[30px] font-semibold lg:text-[38px]">Ne plus recevoir la lettre ?</h1>
		<p class="m-0 text-[15.5px] leading-[1.6] text-ink/75">
			Un clic suffit : tu ne recevras plus les nouvelles de l'atelier. Tu pourras te réabonner
			depuis ton compte quand tu veux.
		</p>
		<form
			method="POST"
			class="flex justify-center"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<input type="hidden" name="u" value={data.userId} />
			<input type="hidden" name="s" value={data.signature} />
			<ChunkyButton type="submit" disabled={submitting}>
				{submitting ? 'Un instant…' : 'Me désinscrire'}
			</ChunkyButton>
		</form>
	{:else}
		<h1 class="m-0 text-[30px] font-semibold lg:text-[38px]">Ce lien n'est plus valable</h1>
		<p class="m-0 text-[15.5px] leading-[1.6] text-ink/75">
			Tu peux gérer tes préférences directement depuis ton compte.
		</p>
	{/if}

	<div class="mt-2 flex justify-center">
		<ChunkyButton href={resolve('/profile')} variant="ghost">Mes préférences</ChunkyButton>
	</div>
</div>
