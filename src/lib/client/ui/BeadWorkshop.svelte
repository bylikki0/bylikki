<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import AstroidIcon from '@lucide/svelte/icons/astroid';
	import { dndzone, dragHandle, dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { resolve } from '$app/paths';
	import { strand, type StrandItem } from '$lib/client/state/shop.svelte';
	import { copyOnDragStart } from '$lib/client/utils/dnd';
	import { MAX_BEADS } from '$lib/client/validation/atelier';
	import { getComponents } from '$lib/remote/atelier.remote';
	import TornEdge from './TornEdge.svelte';

	const FLIP_MS = 160;
	const ZONE = 'fil-accueil';

	const components = $derived(await getComponents());
	const beads = $derived(
		components.filter((component) => component.kind === 'BEAD' && component.stock > 0)
	);
	const byKey = $derived(new Map(components.map((component) => [component.key, component])));

	let generation = 0;
	const freshBins = (list: { key: string }[]): StrandItem[] =>
		list.map((component) => ({ id: `bac-${component.key}-${generation++}`, key: component.key }));

	let bins = $derived(freshBins(beads));

	$effect(() => {
		strand.hydrate(components);
	});

	function onStrandKey(event: KeyboardEvent, id: string) {
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			strand.remove(id);
		}
	}

	function onBinKey(event: KeyboardEvent, key: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			strand.add(key);
		}
	}
</script>

<TornEdge variant="b" color="#E9DFFF" />
<section
	class="relative bg-purple-soft px-5 pt-4 pb-10 lg:px-[clamp(70px,5vw,220px)] lg:pt-5 lg:pb-[78px]"
>
	<div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-[56px]">
		<div>
			<span class="text-[12px] font-semibold tracking-[0.16em] text-purple-ink uppercase">
				Personnalisation
			</span>
			<h2
				class="mt-3 mb-0 text-[26px] leading-[1.1] font-semibold lg:text-[48px] lg:leading-[1.02]"
			>
				Choisis tes perles <ArrowRightIcon class="inline-block size-3" aria-hidden="true" /><br
					class="hidden lg:inline"
				/>
				assemble <ArrowRightIcon class="inline-block size-3" aria-hidden="true" /> crée ton bijou
			</h2>
			<p class="mt-4 mb-0 max-w-[420px] text-[15px] leading-[1.55] text-ink/75 lg:text-[16px]">
				Tire les perles des bacs et pose-les sur le fil, à l’endroit de ton choix. Elles y restent
				accrochées : déplace-les pour changer l’ordre, ou remets-les dans les bacs pour les retirer.
			</p>
			<div class="mt-5 flex flex-wrap items-center gap-3.5 lg:mt-[26px]">
				<a
					href={resolve('/atelier')}
					class="rounded-[40px] bg-ink px-[26px] py-3.5 text-[16px] text-cream hover:bg-ink/90"
				>
					Créer mon bijou <ArrowRightIcon class="inline-block size-3" aria-hidden="true" />
				</a>
				<button
					onclick={() => strand.reset()}
					class="cursor-pointer border-b-[1.5px] border-ink/40 pb-0.5 text-[14px]"
				>
					Recommencer
				</button>
			</div>
		</div>

		<div
			class="rounded-[20px] border-2 border-ink bg-paper p-4 shadow-[10px_12px_0_rgba(169,139,245,.55)] lg:rounded-[28px] lg:p-[26px]"
		>
			<div
				class="flex flex-wrap items-center justify-between gap-2 text-[12px] tracking-[0.12em] text-ink/55 uppercase"
			>
				<span>Atelier (aperçu)</span>
				<span class="font-hand text-[17px] tracking-normal text-pink normal-case">
					à toi de jouer <AstroidIcon class="inline-block size-3" aria-hidden="true" />
				</span>
				<span>{strand.keys.length} / {MAX_BEADS} perles</span>
			</div>

			<div class="relative mt-3.5 flex h-[130px] items-center justify-center lg:h-[170px]">
				<svg
					viewBox="0 0 520 120"
					preserveAspectRatio="none"
					class="pointer-events-none absolute inset-0 h-full w-full"
					aria-hidden="true"
				>
					<path
						d="M10,34C130,110 390,110 510,34"
						fill="none"
						stroke="#2E1B33"
						stroke-width="2"
						stroke-dasharray="4 5"
					/>
				</svg>

				{#if strand.items.length === 0}
					<span
						class="pointer-events-none absolute inset-0 flex items-center justify-center font-hand text-[22px] text-ink/50"
					>
						glisse une perle ici ↓
					</span>
				{/if}

				<ul
					data-testid="bead-strand"
					aria-label="Ton fil de perles"
					use:dragHandleZone={{
						items: strand.items,
						type: ZONE,
						flipDurationMs: FLIP_MS,
						dropTargetStyle: { outline: '2px dashed #F0369B', outlineOffset: '6px' }
					}}
					onconsider={(event: CustomEvent<DndEvent<StrandItem>>) =>
						strand.preview(event.detail.items)}
					onfinalize={(event: CustomEvent<DndEvent<StrandItem>>) =>
						strand.commit(event.detail.items)}
					class="relative m-0 flex min-h-[54px] w-full max-w-full list-none flex-wrap items-center justify-center gap-1.5 rounded-[14px] p-0 pt-6"
				>
					{#each strand.items as item, index (item.id)}
						<li animate:flip={{ duration: FLIP_MS }}>
							<span
								role="button"
								tabindex="0"
								use:dragHandle
								onkeydown={(event) => onStrandKey(event, item.id)}
								aria-label="{byKey.get(item.key)?.label ?? 'Perle'}, position {index +
									1} sur {strand.items.length} glisse-la vers les bacs pour la retirer"
								class="block h-[30px] w-[30px] cursor-grab rounded-full border-2 border-ink active:cursor-grabbing lg:h-[38px] lg:w-[38px]"
								style="background:{byKey.get(item.key)?.hexColor ?? '#FFF0F6'}"
							></span>
						</li>
					{/each}
				</ul>
			</div>

			<p class="mt-2 mb-0 text-center text-[12px] text-ink/50" aria-live="polite">
				{strand.full
					? 'Le fil est plein : remets une perle dans les bacs pour en poser une autre.'
					: 'Glisse une perle sur le fil, ou clique dans un bac pour l’enfiler au bout.'}
			</p>

			<div class="my-3.5 h-px bg-ink/12 lg:mt-2 lg:mb-[18px]"></div>

			<div class="flex items-center justify-between gap-2">
				<span class="text-[12px] font-semibold tracking-[0.12em] text-ink/55 uppercase">
					Bacs de perles
				</span>
				<span class="font-hand text-[16px] text-purple-ink">dépose ici pour ranger</span>
			</div>

			{#if bins.length === 0}
				<p class="mt-2 mb-0 text-[13px] text-ink/60">Les perles arrivent très bientôt.</p>
			{/if}

			<ul
				data-testid="bead-palette"
				aria-label="Bacs de perles"
				use:dndzone={{
					items: bins,
					type: ZONE,
					flipDurationMs: FLIP_MS,
					dragDisabled: strand.full,
					dropTargetStyle: { outline: '2px dashed #7A4FD8', outlineOffset: '6px' }
				}}
				onconsider={(event) => (bins = copyOnDragStart(event, bins))}
				onfinalize={() => (bins = freshBins(beads))}
				class="mt-2 flex min-h-[58px] list-none flex-wrap justify-center gap-2 rounded-[16px] bg-purple-soft/50 p-2 lg:justify-start lg:gap-3"
			>
				{#each bins as bin (bin.id)}
					{@const bead = byKey.get(bin.key)}
					<li animate:flip={{ duration: FLIP_MS }}>
						<span
							role="button"
							tabindex={strand.full ? -1 : 0}
							aria-disabled={strand.full}
							onclick={() => strand.add(bin.key)}
							onkeydown={(event) => onBinKey(event, bin.key)}
							aria-label="Ajouter {bead?.label ?? 'cette perle'}"
							title={bead?.label}
							class="block h-[38px] w-[38px] rounded-full border-2 border-ink transition-transform lg:h-[46px] lg:w-[46px] {strand.full
								? 'cursor-not-allowed opacity-40'
								: 'cursor-grab hover:-translate-y-1'}"
							style="background:{bead?.hexColor ?? '#FFF0F6'}"
						></span>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>
<TornEdge variant="b" color="#E9DFFF" flip />
