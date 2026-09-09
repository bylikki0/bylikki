<script lang="ts">
	import BeadWorkshop from '#lib/components/BeadWorkshop.svelte';
	import GetToKnowMe from '#lib/components/GetToKnowMe.svelte';
	import HeroCarousel from '#lib/components/HeroCarousel.svelte';
	import ReviewsSection from '#lib/components/ReviewsSection.svelte';
	import UniversesSection from '#lib/components/UniversesSection.svelte';
</script>

<svelte:head>
	<title>BYLIKKI — des créations faites pour te ressembler</title>
	<meta
		name="description"
		content="Bijoux et pièces cousues faites main à Nantes, en petites séries. Personnalise ton bijou perle par perle."
	/>
</svelte:head>

<HeroCarousel />
<UniversesSection />
<BeadWorkshop />
<ReviewsSection />
<GetToKnowMe />
