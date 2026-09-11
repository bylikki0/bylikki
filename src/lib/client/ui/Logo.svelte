<script lang="ts">
	import { resolve } from '$app/paths';
	import fullBlanc from '$lib/assets/logo/full-blanc.webp';
	import fullJaune from '$lib/assets/logo/full-jaune.webp';
	import fullNoir from '$lib/assets/logo/full-noir.webp';
	import fullRose from '$lib/assets/logo/full-rose.webp';
	import iconBlanc from '$lib/assets/logo/icon-blanc.webp';
	import iconJaune from '$lib/assets/logo/icon-jaune.webp';
	import iconNoir from '$lib/assets/logo/icon-noir.webp';
	import iconRose from '$lib/assets/logo/icon-rose.webp';

	/**
	 * Le logo existe en quatre couleurs : `tone` choisit celle qui porte sur le
	 * fond courant -- « blanc » sur le pied de page sombre, « rose » ailleurs.
	 *
	 * Les fichiers sont des WebP redimensionnes a 256 px de haut, importes plutot
	 * que servis depuis `static/` : Vite les empreinte et les met en cache long.
	 * Les originaux mesurent 6590 px de large pour un rendu a 64 px.
	 */
	type Tone = 'rose' | 'blanc' | 'jaune' | 'noir';
	type Size = 'sm' | 'md' | 'lg';

	let {
		size = 'lg',
		tone = 'rose',
		priority = false
	}: { size?: Size; tone?: Tone; priority?: boolean } = $props();

	/** La declinaison « icone » est plus compacte : elle sert aux petits ecrans. */
	const icons: Record<Tone, string> = {
		rose: iconRose,
		blanc: iconBlanc,
		jaune: iconJaune,
		noir: iconNoir
	};
	const fulls: Record<Tone, string> = {
		rose: fullRose,
		blanc: fullBlanc,
		jaune: fullJaune,
		noir: fullNoir
	};

	const compact = $derived(size === 'sm');
	const src = $derived(compact ? icons[tone] : fulls[tone]);

	/** Dimensions intrinseques : elles reservent la place et evitent le sursaut. */
	const width = $derived(compact ? 320 : 490);
</script>

<a href={resolve('/')} aria-label="BYLIKKI, retour à l\'accueil">
	<img
		{src}
		alt="BYLIKKI"
		{width}
		height="256"
		class="h-16 w-auto"
		fetchpriority={priority ? 'high' : undefined}
		loading={priority ? 'eager' : 'lazy'}
		decoding="async"
	/>
</a>
