<script lang="ts">
	import { resolve } from '$app/paths';
	import { stickyParam } from '$lib/client/utils/params';
	import ChunkyButton from '$lib/client/ui/ChunkyButton.svelte';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { formatPrice } from '$lib/client/utils/money';
	import AstroidIcon from '@lucide/svelte/icons/astroid';

	import { getSharedDesign } from '$lib/remote/atelier.remote';

	const readToken = stickyParam('token');
	const design = $derived(await getSharedDesign(readToken()));

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
</script>

<svelte:head>
	<title>Une création de l'atelier BYLIKKI</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex max-w-[720px] flex-col gap-6 px-5 py-12 text-center lg:py-16">
	<span class="font-hand text-[24px] text-pink"
		>une pièce unique <AstroidIcon class="inline-block size-3" aria-hidden="true" /></span
	>
	<h1 class="m-0 text-[30px] font-semibold lg:text-[40px]">Cette création</h1>

	<div class="rounded-[24px] border-2 border-ink bg-cream p-6">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG construit par le serveur, sans donnee tierce -->
		{@html design.previewSvg}
	</div>

	<p class="m-0 text-[15.5px] text-ink/75">
		{Math.round(design.lengthMm / 10)} cm · {formatPrice(design.priceCents)} · composée le
		{dateFormatter.format(design.createdAt)}
	</p>

	<div class="flex justify-center">
		<ChunkyButton href={resolve('/atelier')}
			>Composer la mienne <ArrowRightIcon
				class="inline-block size-3"
				aria-hidden="true"
			/></ChunkyButton
		>
	</div>
</div>
