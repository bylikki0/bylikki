<script lang="ts">
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import XIcon from '@lucide/svelte/icons/x';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { Badge } from '$lib/client/ui/shadcn/badge';
	import { Button } from '$lib/client/ui/shadcn/button';
	import { Checkbox } from '$lib/client/ui/shadcn/checkbox';
	import { Label } from '$lib/client/ui/shadcn/label';
	import { toMessage } from '$lib/client/utils/errors';
	import { MAX_TESTIMONIALS } from '$lib/client/validation/settings';
	import { saveTestimonials } from '$lib/remote/admin.remote';

	type PublishedReview = {
		id: string;
		authorName: string;
		rating: number;
		title: string | null;
		body: string;
		product: { name: string; slug: string };
	};

	let {
		published,
		selection = $bindable()
	}: { published: PublishedReview[]; selection: string[] } = $props();

	let saving = $state(false);
	let feedback = $state('');

	const byId = $derived(new Map(published.map((review) => [review.id, review])));

	/**
	 * `svelte-dnd-action` veut des objets porteurs d'un `id` : on projette la
	 * selection, et on la reecrit a partir de l'ordre rendu par la zone.
	 */
	const chosen = $derived(
		selection
			.map((id) => byId.get(id))
			.filter((review): review is PublishedReview => review !== undefined)
	);

	const full = $derived(selection.length >= MAX_TESTIMONIALS);

	function toggle(id: string, next: boolean) {
		feedback = '';

		if (next) {
			if (!selection.includes(id) && selection.length < MAX_TESTIMONIALS) {
				selection = [...selection, id];
			}

			return;
		}

		selection = selection.filter((entry) => entry !== id);
	}

	/** Deplacement au clavier : le glisser-deposer seul exclurait trop de monde. */
	function move(index: number, delta: number) {
		const target = index + delta;

		if (target < 0 || target >= selection.length) {
			return;
		}

		const next = [...selection];
		[next[index], next[target]] = [next[target], next[index]];
		selection = next;
	}

	function onDrop(event: CustomEvent<{ items: PublishedReview[] }>) {
		selection = event.detail.items.map((review) => review.id);
	}

	async function save() {
		saving = true;
		feedback = '';

		try {
			await saveTestimonials({ reviewIds: selection });
			feedback =
				selection.length === 0
					? "Enregistré. La section est masquée sur la page d'accueil."
					: `Enregistré. ${selection.length} avis à la une.`;
		} catch (error) {
			feedback = toMessage(error, "La sélection n'a pas pu être enregistrée.");
		} finally {
			saving = false;
		}
	}
</script>

<section class="flex flex-col gap-4 rounded-lg border p-4">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="m-0 text-lg font-semibold tracking-tight">À la une sur la page d\'accueil</h2>
			<p class="m-0 text-sm text-muted-foreground">
				Coche les avis à mettre en avant, puis range-les dans l\'ordre d\'affichage. Sans aucun avis
				coché, la section disparaît de la page d\'accueil.
			</p>
		</div>
		<Button size="sm" disabled={saving} onclick={save}>
			{saving ? 'Enregistrement…' : 'Enregistrer la sélection'}
		</Button>
	</div>

	{#if feedback}
		<p class="m-0 text-sm font-medium">{feedback}</p>
	{/if}

	{#if published.length === 0}
		<p class="m-0 text-sm text-muted-foreground">
			Aucun avis publié pour l'instant : publie d'abord un avis pour pouvoir le mettre à la une.
		</p>
	{:else}
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="flex flex-col gap-2">
				<Label class="text-xs uppercase">Avis publiés</Label>
				<ul class="m-0 flex max-h-80 list-none flex-col gap-2 overflow-y-auto p-0 pr-1">
					{#each published as review (review.id)}
						{@const picked = selection.includes(review.id)}
						<li class="flex items-start gap-3 rounded-md border p-3">
							<Checkbox
								id="tm-{review.id}"
								checked={picked}
								disabled={!picked && full}
								onCheckedChange={(value) => toggle(review.id, value === true)}
							/>
							<Label for="tm-{review.id}" class="flex flex-col items-start gap-1 font-normal">
								<span class="text-sm font-medium">
									{review.title || review.body.slice(0, 60)}
								</span>
								<span class="text-xs text-muted-foreground">
									{review.authorName} · {review.rating}/5 · {review.product.name}
								</span>
							</Label>
						</li>
					{/each}
				</ul>
				{#if full}
					<p class="m-0 text-xs text-muted-foreground">
						Maximum atteint ({MAX_TESTIMONIALS}). Décoche un avis pour en ajouter un autre.
					</p>
				{/if}
			</div>

			<div class="flex flex-col gap-2">
				<Label class="text-xs uppercase">Ordre d\'affichage</Label>
				{#if chosen.length === 0}
					<p
						class="m-0 rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground"
					>
						Aucun avis à la une : la section disparaît de la page d\'accueil.
					</p>
				{:else}
					<ul
						use:dragHandleZone={{ items: chosen, flipDurationMs: 160, type: 'testimonials' }}
						onconsider={onDrop}
						onfinalize={onDrop}
						class="m-0 flex list-none flex-col gap-2 p-0"
					>
						{#each chosen as review, index (review.id)}
							<li
								animate:flip={{ duration: 160 }}
								class="flex items-center gap-2 rounded-md border bg-muted/40 p-2"
							>
								<button
									use:dragHandle
									aria-label="Déplacer « {review.title || review.authorName} », position {index +
										1} sur {chosen.length}"
									class="cursor-grab text-muted-foreground active:cursor-grabbing"
								>
									<GripVerticalIcon class="size-4" aria-hidden="true" />
								</button>

								<Badge variant="secondary">{index + 1}</Badge>

								<span class="min-w-0 flex-1 truncate text-sm">
									{review.title || review.body.slice(0, 50)}
									<span class="text-muted-foreground">— {review.authorName}</span>
								</span>

								<Button
									size="icon"
									variant="ghost"
									aria-label="Monter"
									disabled={index === 0}
									onclick={() => move(index, -1)}
								>
									<ArrowUpIcon class="size-4" aria-hidden="true" />
								</Button>
								<Button
									size="icon"
									variant="ghost"
									aria-label="Descendre"
									disabled={index === chosen.length - 1}
									onclick={() => move(index, 1)}
								>
									<ArrowDownIcon class="size-4" aria-hidden="true" />
								</Button>
								<Button
									size="icon"
									variant="ghost"
									aria-label="Retirer de la une"
									onclick={() => toggle(review.id, false)}
								>
									<XIcon class="size-4" aria-hidden="true" />
								</Button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</section>
