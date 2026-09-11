<script lang="ts" module>
	import * as v from 'valibot';
	import { slideSchema, type Slide } from '$lib/client/validation/settings';

	export type EditableSlide = Slide & { uid: string };

	type SlideField = 'kicker' | 'title' | 'desc' | 'cta' | 'target';

	export function slideProblems(slide: Slide) {
		const problems: Partial<Record<SlideField, string>> = {};
		const parsed = v.safeParse(slideSchema, slide);

		if (!parsed.success) {
			for (const issue of parsed.issues) {
				const key = issue.path?.[0]?.key as SlideField | undefined;

				if (key && !problems[key]) {
					problems[key] = issue.message;
				}
			}
		}

		if (slide.target.kind === 'category' && !slide.target.slug) {
			problems.target = 'Choisis une catégorie.';
		}

		if (slide.target.kind === 'product' && !slide.target.slug) {
			problems.target = 'Choisis un produit.';
		}

		return problems;
	}
</script>

<script lang="ts">
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash';
	import { Button } from '$lib/client/ui/shadcn/button';
	import { Input } from '$lib/client/ui/shadcn/input';
	import { Label } from '$lib/client/ui/shadcn/label';
	import { Textarea } from '$lib/client/ui/shadcn/textarea';
	import { MAX_SLIDES, SLIDE_LIMITS } from '$lib/client/validation/settings';
	import LinkTargetPicker from './LinkTargetPicker.svelte';

	let { slides = $bindable() }: { slides: EditableSlide[] } = $props();

	const fields: { key: keyof typeof SLIDE_LIMITS; label: string; multiline: boolean }[] = [
		{ key: 'kicker', label: 'Accroche', multiline: false },
		{ key: 'title', label: 'Titre', multiline: false },
		{ key: 'desc', label: 'Description', multiline: true },
		{ key: 'cta', label: 'Texte du bouton', multiline: false }
	];

	function move(index: number, direction: -1 | 1) {
		const target = index + direction;

		if (target < 0 || target >= slides.length) {
			return;
		}

		const next = [...slides];
		[next[index], next[target]] = [next[target], next[index]];
		slides = next;
	}

	function remove(index: number) {
		slides = slides.filter((_, position) => position !== index);
	}

	function add() {
		slides = [
			...slides,
			{
				uid: crypto.randomUUID(),
				kicker: '',
				title: '',
				desc: '',
				cta: 'Découvrir',
				target: { kind: 'search', query: '' }
			}
		];
	}
</script>

<div class="flex flex-col gap-4">
	<ol class="m-0 grid list-none gap-4 p-0 xl:grid-cols-2 3xl:grid-cols-3">
		{#each slides as slide, index (slide.uid)}
			{@const problems = slideProblems(slide)}
			<li
				class="flex flex-col gap-3 rounded-[18px] border-2 border-ink bg-paper p-4"
				aria-label="Diapositive {index + 1} sur {slides.length}"
			>
				<div class="flex items-center justify-between gap-2">
					<span class="font-hand text-[22px] leading-none text-pink-deep">
						Diapositive {index + 1}
					</span>
					<div class="flex gap-1">
						<Button
							variant="ghost"
							size="icon"
							disabled={index === 0}
							onclick={() => move(index, -1)}
							aria-label="Monter la diapositive {index + 1}"
						>
							<ArrowUpIcon aria-hidden="true" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							disabled={index === slides.length - 1}
							onclick={() => move(index, 1)}
							aria-label="Descendre la diapositive {index + 1}"
						>
							<ArrowDownIcon aria-hidden="true" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							disabled={slides.length === 1}
							onclick={() => remove(index)}
							aria-label="Supprimer la diapositive {index + 1}"
						>
							<Trash2Icon aria-hidden="true" />
						</Button>
					</div>
				</div>

				{#each fields as field (field.key)}
					{@const inputId = `${slide.uid}-${field.key}`}
					{@const problem = problems[field.key]}
					<div class="flex flex-col gap-1.5">
						<div class="flex items-baseline justify-between gap-2">
							<Label for={inputId}>{field.label}</Label>
							<span class="text-xs text-muted-foreground tabular-nums" aria-hidden="true">
								{slide[field.key].length} / {SLIDE_LIMITS[field.key]}
							</span>
						</div>
						{#if field.multiline}
							<Textarea
								id={inputId}
								rows={3}
								maxlength={SLIDE_LIMITS[field.key]}
								bind:value={slides[index][field.key]}
								aria-invalid={problem ? 'true' : undefined}
								aria-describedby={problem ? `${inputId}-error` : undefined}
							/>
						{:else}
							<Input
								id={inputId}
								maxlength={SLIDE_LIMITS[field.key]}
								bind:value={slides[index][field.key]}
								aria-invalid={problem ? 'true' : undefined}
								aria-describedby={problem ? `${inputId}-error` : undefined}
							/>
						{/if}
						{#if problem}
							<p id="{inputId}-error" class="m-0 text-xs font-semibold text-destructive">
								{problem}
							</p>
						{/if}
					</div>
				{/each}

				<LinkTargetPicker id="{slide.uid}-target" bind:target={slides[index].target} />
				{#if problems.target}
					<p class="m-0 text-xs font-semibold text-destructive">{problems.target}</p>
				{/if}
			</li>
		{/each}
	</ol>

	<div>
		<Button variant="outline" disabled={slides.length >= MAX_SLIDES} onclick={add}>
			<PlusIcon aria-hidden="true" />
			Ajouter une diapositive
		</Button>
		{#if slides.length >= MAX_SLIDES}
			<span class="ml-2 text-xs text-muted-foreground">{MAX_SLIDES} diapositives au maximum.</span>
		{/if}
	</div>
</div>
