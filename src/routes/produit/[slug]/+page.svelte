<script lang="ts">
	import ChunkyButton from '#lib/components/ChunkyButton.svelte';
	import PhotoPlaceholder from '#lib/components/PhotoPlaceholder.svelte';
	import Star from '#lib/components/Star.svelte';
	import { products } from '#lib/data/catalogue';
	import { cart, euro, ui } from '#lib/state/shop.svelte';
	import { page } from '$app/state';

	const product = $derived(products.find((p) => p.slug === page.params.slug) ?? products[0]);

	const sizes = [
		{ key: 'S', label: '38 cm' },
		{ key: 'M', label: '42 cm' },
		{ key: 'L', label: '46 cm' }
	];

	let img = $state(0);
	let size = $state('M');
	let qty = $state(1);

	const unit = 26;
	const total = $derived(euro(unit * qty));

	/** étoiles qui tombent à l’arrivée sur la page */
	const falling = [
		{ color: '#FFDE59', size: 52, style: 'left:38px;top:120px', delay: 0.1, dur: 1.2, op: 0.55 },
		{ color: '#A98BF5', size: 30, style: 'left:330px;top:60px', delay: 0.3, dur: 1.4, op: 0.5 },
		{ color: '#6EC6EE', size: 40, style: 'left:700px;top:210px', delay: 0.5, dur: 1.5, op: 0.45 },
		{ color: '#F0369B', size: 46, style: 'right:60px;top:96px', delay: 0.2, dur: 1.3, op: 0.5 },
		{ color: '#7ED598', size: 34, style: 'right:300px;top:420px', delay: 0.6, dur: 1.6, op: 0.4 },
		{
			color: '#FFDE59',
			size: 38,
			style: 'left:120px;bottom:120px',
			delay: 0.75,
			dur: 1.7,
			op: 0.4
		},
		{ color: '#A98BF5', size: 28, style: 'right:110px;bottom:70px', delay: 0.9, dur: 1.5, op: 0.45 }
	];

	function addToCart() {
		cart.add({
			name: product.name,
			variant: `${sizes.find((s) => s.key === size)?.label} · perles roses`,
			qty,
			unit
		});
		ui.cartOpen = true;
	}
</script>

<svelte:head>
	<title>{product.name} — BYLIKKI</title>
</svelte:head>

<div class="relative px-5 pt-6 pb-16 lg:px-[70px] lg:pt-9 lg:pb-20">
	{#each falling as star, i (i)}
		<Star
			color={star.color}
			stroke={false}
			size={star.size}
			class="pointer-events-none absolute hidden lg:block"
			style="{star.style};opacity:{star.op};animation:fall {star.dur}s {star.delay}s ease-out both"
		/>
	{/each}

	<nav class="relative mb-5 text-[13px] text-ink/55 lg:mb-[22px]">
		<a href="/">Bijoux</a> → <a href="/">Colliers</a> →
		<span class="text-ink">{product.name}</span>
	</nav>

	<div class="relative grid grid-cols-1 gap-6 lg:grid-cols-[96px_1fr_460px] lg:gap-[26px]">
		<!-- vignettes -->
		<div class="order-2 flex gap-3 lg:order-1 lg:flex-col">
			{#each [0, 1, 2, 3] as i (i)}
				<button
					onclick={() => (img = i)}
					aria-label={`Voir la photo ${i + 1}`}
					class="h-[70px] w-[70px] cursor-pointer rounded-[12px] lg:h-[110px] lg:w-full"
					style="border:{img === i
						? '2px solid #2E1B33'
						: '1.5px solid rgba(46,27,51,.18)'};background:repeating-linear-gradient(135deg,rgba(240,54,155,.15) 0 6px,rgba(255,255,255,0) 6px 12px),#FFFCF7"
				></button>
			{/each}
		</div>

		<!-- photo principale -->
		<PhotoPlaceholder
			label={`PHOTO PRODUIT ${img + 1}/4\ncollier sur fond clair`}
			tint="rgba(240,54,155,.14)"
			bg="#FFFCF7"
			radius="24px"
			stripe={9}
			class="order-1 h-[320px] border-2 border-ink lg:order-2 lg:h-[560px]"
		/>

		<!-- achat -->
		<div class="order-3 flex flex-col gap-[18px]">
			<div>
				<span class="font-hand text-[22px] text-pink">pièce faite main ✦</span>
				<h1 class="mt-1 mb-0 text-[32px] leading-[1.02] font-semibold lg:text-[44px]">
					{product.name}
				</h1>
				<div class="mt-3 flex items-center gap-3.5">
					<span class="text-[26px] lg:text-[28px]">{euro(unit)}</span>
					<span
						class="rounded-[20px] border-[1.5px] border-ink bg-yellow-soft px-3 py-1 text-[13px]"
					>
						2 exemplaires
					</span>
				</div>
			</div>

			<p class="m-0 text-[15px] leading-[1.6] text-ink/80 lg:text-[16px]">
				Perles de verre chinées, fermoir doré et une petite étoile en pendentif. Assemblé à la main,
				donc légèrement différent d’un exemplaire à l’autre.
			</p>

			<div>
				<div class="mb-2.5 text-[12px] tracking-[0.14em] text-ink/55 uppercase">Longueur</div>
				<div class="flex gap-2.5">
					{#each sizes as s (s.key)}
						<button
							onclick={() => (size = s.key)}
							class="cursor-pointer rounded-[24px] border-[1.5px] border-ink px-5 py-2.5 text-[14px] {size ===
							s.key
								? 'bg-ink text-cream'
								: 'bg-transparent text-ink'}"
						>
							{s.label}
						</button>
					{/each}
				</div>
			</div>

			<div
				class="flex flex-col items-start gap-3.5 rounded-[20px] border-2 border-ink bg-purple-soft px-5 py-[18px] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
			>
				<div>
					<div class="text-[18px]">Envie de le personnaliser ?</div>
					<div class="mt-0.5 text-[14px] text-ink/70">Choisis tes perles et ton fermoir.</div>
				</div>
				<a
					href="/#atelier"
					class="rounded-[30px] bg-ink px-[18px] py-[11px] text-[14px] whitespace-nowrap text-cream"
				>
					Personnaliser →
				</a>
			</div>

			<div class="flex flex-col gap-3.5 sm:flex-row sm:items-center">
				<div
					class="flex items-center justify-between gap-[18px] rounded-[40px] border-[1.5px] border-ink px-5 py-3.5 text-[16px] sm:justify-start"
				>
					<button
						onclick={() => (qty = Math.max(qty - 1, 1))}
						class="cursor-pointer"
						aria-label="Moins"
					>
						−
					</button>
					<span>{qty}</span>
					<button
						onclick={() => (qty = Math.min(qty + 1, 9))}
						class="cursor-pointer"
						aria-label="Plus"
					>
						+
					</button>
				</div>
				<ChunkyButton class="flex-1 shadow-[0_7px_0_var(--color-pink-deep)]" onclick={addToCart}>
					Ajouter au panier — {total}
				</ChunkyButton>
			</div>

			<ul
				class="m-0 flex list-none flex-col gap-2 border-t-[1.5px] border-ink/12 p-0 pt-4 text-[14px] text-ink/70"
			>
				<li>✦ Expédition sous 3 jours ouvrés</li>
				<li>✦ Emballage fait main, réutilisable</li>
				<li>✦ Une question ? Écris-moi sur Instagram</li>
			</ul>
		</div>
	</div>
</div>
