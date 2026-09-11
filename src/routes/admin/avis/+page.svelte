<script lang="ts">
	import StarIcon from '@lucide/svelte/icons/star';
	import { resolve } from '$app/paths';
	import TestimonialsPicker from '$lib/client/ui/admin/TestimonialsPicker.svelte';
	import { Badge } from '$lib/client/ui/shadcn/badge';
	import { Button } from '$lib/client/ui/shadcn/button';
	import { Label } from '$lib/client/ui/shadcn/label';
	import { Textarea } from '$lib/client/ui/shadcn/textarea';
	import { toMessage } from '$lib/client/utils/errors';
	import { answerReview, getAdminReviews, setReviewStatus } from '$lib/remote/admin.remote';
	import { getSettings } from '$lib/remote/settings.remote';

	const statuses = ['PENDING', 'PUBLISHED', 'REJECTED'] as const;
	const statusLabels: Record<(typeof statuses)[number], string> = {
		PENDING: 'À modérer',
		PUBLISHED: 'Publiés',
		REJECTED: 'Rejetés'
	};

	let status = $state<(typeof statuses)[number]>('PENDING');
	const reviews = $derived(await getAdminReviews(status));

	/** La mise a la une ne porte que sur des avis publies. */
	const publishedReviews = $derived(await getAdminReviews('PUBLISHED'));
	const settings = $derived(await getSettings());

	let selection = $state<string[]>([]);
	let selectionLoaded = $state(false);

	/**
	 * Hydratation unique : passe la selection enregistree dans l'etat local, sans
	 * ecraser ce que l'administration est en train de composer.
	 */
	$effect(() => {
		if (selectionLoaded) {
			return;
		}

		selection = [...settings.testimonials.reviewIds];
		selectionLoaded = true;
	});

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

	let pending = $state('');
	let feedback = $state('');
	/** Brouillons de reponse, un par avis, avant enregistrement. */
	const replies = $state<Record<string, string>>({});

	async function reply(reviewId: string, body: string) {
		pending = reviewId;
		feedback = '';

		try {
			await answerReview({ reviewId, body });
			await getAdminReviews(status).refresh();
			feedback = body.trim() === '' ? 'Réponse retirée.' : 'Réponse publiée.';
		} catch (error) {
			feedback = toMessage(error, "La réponse n'a pas pu être enregistrée.");
		} finally {
			pending = '';
		}
	}

	async function moderate(reviewId: string, next: 'PUBLISHED' | 'REJECTED') {
		pending = reviewId;

		try {
			await setReviewStatus({ reviewId, status: next });
			await getAdminReviews(status).refresh();
			await getAdminReviews('PUBLISHED').refresh();

			/** Un avis depublie ne peut plus rester a la une. */
			if (next !== 'PUBLISHED') {
				selection = selection.filter((entry) => entry !== reviewId);
			}
		} finally {
			pending = '';
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Avis</h1>
		<p class="text-sm text-muted-foreground">
			Un avis n'apparaît sur la fiche produit qu'une fois publié ici. Une réponse de l'atelier
			s'affiche sous l'avis, publiquement.
		</p>
	</div>

	{#if feedback}
		<p class="text-sm font-medium">{feedback}</p>
	{/if}

	<TestimonialsPicker published={publishedReviews} bind:selection />

	<div class="flex gap-2">
		{#each statuses as entry (entry)}
			<Button
				size="sm"
				variant={status === entry ? 'default' : 'outline'}
				onclick={() => (status = entry)}
			>
				{statusLabels[entry]}
			</Button>
		{/each}
	</div>

	{#if reviews.length === 0}
		<p class="text-sm text-muted-foreground">Rien dans cette file.</p>
	{:else}
		<ul class="m-0 flex list-none flex-col gap-4 p-0">
			{#each reviews as review (review.id)}
				<li class="flex flex-col gap-3 rounded-lg border p-4">
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-sm font-medium">{review.authorName}</span>
						<span
							class="inline-flex items-center gap-0.5"
							aria-label="Note : {review.rating} sur 5"
						>
							{#each [1, 2, 3, 4, 5] as star (star)}
								<StarIcon
									class="size-3.5 fill-current {star <= review.rating
										? 'text-foreground'
										: 'text-muted-foreground/30'}"
									strokeWidth={0}
									aria-hidden="true"
								/>
							{/each}
						</span>
						{#if review.verifiedPurchase}
							<Badge variant="secondary">Achat vérifié</Badge>
						{/if}
						{#if selection.includes(review.id)}
							<Badge>À la une</Badge>
						{/if}
						<span class="text-xs text-muted-foreground">
							{dateFormatter.format(review.createdAt)} ·
							<a href={resolve('/[slug]', { slug: review.product.slug })} class="underline">
								{review.product.name}
							</a>
						</span>
					</div>

					{#if review.title}
						<div class="font-medium">{review.title}</div>
					{/if}
					<p class="m-0 text-sm">{review.body}</p>

					{#if review.photos.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each review.photos as photo (photo.id)}
								<img
									src={photo.url}
									alt="Pièce reçue par la cliente"
									class="h-24 w-24 rounded-md border object-cover"
								/>
							{/each}
						</div>
					{/if}

					<div class="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
						<Label for="reply-{review.id}" class="text-xs">
							Réponse de l'atelier{review.repliedAt ? ' (publiée)' : ''}
						</Label>
						<Textarea
							id="reply-{review.id}"
							rows={2}
							maxlength={1200}
							value={replies[review.id] ?? review.replyBody ?? ''}
							oninput={(event) => (replies[review.id] = event.currentTarget.value)}
						/>
						<Button
							size="sm"
							variant="secondary"
							class="self-start"
							disabled={pending === review.id}
							onclick={() => reply(review.id, replies[review.id] ?? review.replyBody ?? '')}
						>
							{review.replyBody ? 'Mettre à jour la réponse' : 'Répondre'}
						</Button>
					</div>

					<div class="flex gap-2">
						{#if review.status !== 'PUBLISHED'}
							<Button
								size="sm"
								disabled={pending === review.id}
								onclick={() => moderate(review.id, 'PUBLISHED')}
							>
								Publier
							</Button>
						{/if}
						{#if review.status !== 'REJECTED'}
							<Button
								size="sm"
								variant="destructive"
								disabled={pending === review.id}
								onclick={() => moderate(review.id, 'REJECTED')}
							>
								Rejeter
							</Button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
