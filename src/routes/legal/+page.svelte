<script lang="ts">
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import LegalNav from '#lib/components/LegalNav.svelte';
	import LegalDocument from '#lib/components/LegalDocument.svelte';
	import { findLegalDoc } from '#lib/data/legal';

	const doc = $derived(findLegalDoc(page.url.searchParams.get('doc')));

	function pick(id: string) {
		const url = new URL(page.url);
		url.searchParams.set('doc', id);
		replaceState(url, {});
	}
</script>

<svelte:head>
	<title>{doc.title} — BYLIKKI</title>
</svelte:head>

<div
	class="grid grid-cols-1 gap-8 px-5 pt-10 pb-16 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-[56px] lg:px-[70px] lg:pt-[56px] lg:pb-[90px]"
>
	<LegalNav active={doc} onpick={pick} />
	<LegalDocument {doc} />
</div>
