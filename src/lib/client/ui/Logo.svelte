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

	type Tone = 'rose' | 'blanc' | 'jaune' | 'noir';
	type Size = 'sm' | 'md' | 'lg';

	let {
		size = 'lg',
		tone = 'rose',
		priority = false
	}: { size?: Size; tone?: Tone; priority?: boolean } = $props();

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

	const width = $derived(compact ? 320 : 490);
</script>

<a href={resolve('/')} aria-label="BYLIKKI, retour à l'accueil">
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
