<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import * as v from 'valibot';
	import { selectClass } from '$lib/client/ui/admin/LinkTargetPicker.svelte';
	import ProductSearch from '$lib/client/ui/admin/ProductSearch.svelte';
	import { Badge } from '$lib/client/ui/shadcn/badge';
	import { Button } from '$lib/client/ui/shadcn/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/client/ui/shadcn/card';
	import { Input } from '$lib/client/ui/shadcn/input';
	import { Label } from '$lib/client/ui/shadcn/label';
	import { Textarea } from '$lib/client/ui/shadcn/textarea';
	import { toMessage } from '$lib/client/utils/errors';
	import {
		INACTIVE_DAYS,
		ISSUE_LIMITS,
		issueDraftSchema,
		MAX_ISSUE_PRODUCTS,
		segmentLabels,
		segmentSchema,
		type IssueDraft,
		type Segment,
		type SegmentKind
	} from '$lib/client/validation/newsletter';
	import {
		continueIssue,
		getAudienceCount,
		getIssues,
		getNewsletterDiscounts,
		getNewsletterProducts,
		previewIssue,
		removeIssue,
		saveIssue,
		scheduleIssue,
		sendIssueNow,
		sendTestIssue,
		unscheduleIssue
	} from '$lib/remote/newsletter.remote';

	type Picked = { id: string; name: string };
	type Issue = Awaited<ReturnType<typeof getIssues>>[number];

	const issues = $derived(await getIssues());
	const discounts = $derived(await getNewsletterDiscounts());

	const segmentKinds = Object.keys(segmentLabels) as SegmentKind[];

	const blankDraft = (): IssueDraft => ({
		subject: '',
		preheader: '',
		body: '',
		heroImageUrl: '',
		ctaLabel: '',
		ctaUrl: '',
		productIds: [],
		discountId: null,
		segment: { kind: 'ALL' }
	});

	let draft = $state<IssueDraft>(blankDraft());
	let pickedProducts = $state<Picked[]>([]);
	let segmentKind = $state<SegmentKind>('ALL');
	let segmentProduct = $state<Picked | null>(null);
	let inactiveDays = $state<number>(INACTIVE_DAYS.fallback);

	let feedback = $state('');
	let pending = $state('');
	let confirmingId = $state<string | null>(null);
	let scheduleInputs = $state<Record<string, string>>({});
	let autoSendHalted = $state(false);
	let previewHtml = $state('');
	let previewToken = 0;

	const segment = $derived.by((): Segment | null => {
		switch (segmentKind) {
			case 'WISHLISTED':
			case 'RESTOCK':
				return segmentProduct ? { kind: segmentKind, productId: segmentProduct.id } : null;
			case 'INACTIVE':
				return { kind: 'INACTIVE', days: inactiveDays };
			default:
				return { kind: segmentKind };
		}
	});

	const validation = $derived(
		segment
			? v.safeParse(issueDraftSchema, {
					...draft,
					productIds: pickedProducts.map((product) => product.id),
					segment
				})
			: null
	);

	const problems = $derived(
		!segment
			? ['Choisis le produit qui définit l’audience.']
			: validation && !validation.success
				? [...new Set(validation.issues.map((issue) => issue.message))]
				: []
	);

	const touched = $derived(draft.subject.trim() !== '' || draft.body.trim() !== '');
	const readyDraft = $derived(validation?.success ? validation.output : null);

	const audience = $derived(
		segment && v.is(segmentSchema, segment) ? await getAudienceCount(segment) : null
	);

	const sendingIssue = $derived(issues.find((issue) => issue.status === 'SENDING'));

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	$effect(() => {
		const current = readyDraft;

		if (!current) {
			return;
		}

		const token = ++previewToken;
		const timer = setTimeout(async () => {
			try {
				const { html } = await previewIssue(current);

				if (token === previewToken) {
					previewHtml = html;
				}
			} catch {
				if (token === previewToken) {
					previewHtml = '';
				}
			}
		}, 600);

		return () => clearTimeout(timer);
	});

	$effect(() => {
		const current = sendingIssue;

		if (!current || autoSendHalted || pending) {
			return;
		}

		const timer = setTimeout(async () => {
			const succeeded = await run(current.id, async () => {
				const progress = await continueIssue(current.id);

				return progress.done
					? `Lettre envoyée : ${progress.sent} e-mail(s) parti(s).`
					: `Envoi en cours : ${progress.sent} / ${current.recipientCount}.`;
			});

			if (!succeeded) {
				autoSendHalted = true;
			}
		}, 1500);

		return () => clearTimeout(timer);
	});

	async function run(key: string, action: () => Promise<string>) {
		pending = key;
		feedback = '';

		try {
			feedback = await action();
			return true;
		} catch (error) {
			feedback = toMessage(error, "L'opération a échoué.");
			return false;
		} finally {
			pending = '';
		}
	}

	function startNew() {
		draft = blankDraft();
		pickedProducts = [];
		segmentKind = 'ALL';
		segmentProduct = null;
		inactiveDays = INACTIVE_DAYS.fallback;
		previewHtml = '';
	}

	async function edit(issue: Issue) {
		const ids = [...issue.productIds, ...(issue.segmentProductId ? [issue.segmentProductId] : [])];
		const known = ids.length > 0 ? await getNewsletterProducts(ids) : [];
		const nameOf = (id: string) =>
			known.find((product) => product.id === id)?.name ?? 'Produit retiré';

		draft = {
			id: issue.id,
			subject: issue.subject,
			preheader: issue.preheader,
			body: issue.body,
			heroImageUrl: issue.heroImageUrl ?? '',
			ctaLabel: issue.ctaLabel ?? '',
			ctaUrl: issue.ctaUrl ?? '',
			productIds: [...issue.productIds],
			discountId: issue.discountId,
			segment: issue.audience ?? { kind: 'ALL' }
		};
		pickedProducts = issue.productIds.map((id) => ({ id, name: nameOf(id) }));
		segmentKind = issue.segment;
		segmentProduct = issue.segmentProductId
			? { id: issue.segmentProductId, name: nameOf(issue.segmentProductId) }
			: null;
		inactiveDays = issue.segmentInactiveDays ?? INACTIVE_DAYS.fallback;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function save() {
		const current = readyDraft;

		if (!current) {
			return;
		}

		void run('save', async () => {
			const { id } = await saveIssue(current);
			draft.id = id;
			return 'Brouillon enregistré.';
		});
	}

	function sendTest() {
		const current = readyDraft;

		if (!current) {
			return;
		}

		void run('test', async () => {
			const { sentTo } = await sendTestIssue(current);
			return `Test envoyé à ${sentTo}.`;
		});
	}

	function defaultSchedule() {
		const tomorrow = new Date(Date.now() + 86_400_000);
		const date = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0);
		const pad = (value: number) => String(value).padStart(2, '0');

		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	function statusBadge(issue: Issue) {
		switch (issue.status) {
			case 'SCHEDULED':
				return {
					label: issue.scheduledAt
						? `Programmée · ${dateFormatter.format(issue.scheduledAt)}`
						: 'Programmée',
					variant: 'secondary' as const
				};
			case 'SENDING':
				return {
					label: `Envoi en cours · ${issue.sentCount} / ${issue.recipientCount}`,
					variant: 'default' as const
				};
			case 'SENT':
				return {
					label: issue.sentAt
						? `Envoyée le ${dateFormatter.format(issue.sentAt)} · ${issue.recipientCount} destinataires`
						: 'Envoyée',
					variant: 'default' as const
				};
			default:
				return { label: 'Brouillon', variant: 'outline' as const };
		}
	}
</script>

<svelte:head>
	<title>Newsletter Administration BYLIKKI</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Newsletter</h1>
		<p class="text-sm text-muted-foreground">
			Envoyée uniquement aux comptes ayant accepté « Nouveautés et collections ». Chaque e-mail
			porte un lien de désinscription en un clic, reconnu par les messageries.
		</p>
	</div>

	{#if feedback}
		<p class="text-sm font-medium" role="status">{feedback}</p>
	{/if}

	<div class="grid items-start gap-4 xl:grid-cols-2 3xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
		<Card>
			<CardHeader>
				<CardTitle>{draft.id ? 'Modifier la lettre' : 'Nouvelle lettre'}</CardTitle>
				<CardDescription>Un paragraphe par ligne. Aucune mise en forme à saisir.</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-5">
				<div class="flex flex-col gap-1.5">
					<div class="flex items-baseline justify-between gap-2">
						<Label for="subject">Objet</Label>
						<span class="text-xs text-muted-foreground tabular-nums" aria-hidden="true">
							{draft.subject.length} / {ISSUE_LIMITS.subject}
						</span>
					</div>
					<Input id="subject" maxlength={ISSUE_LIMITS.subject} bind:value={draft.subject} />
				</div>

				<div class="flex flex-col gap-1.5">
					<Label for="preheader">Pré-en-tête</Label>
					<Input
						id="preheader"
						maxlength={ISSUE_LIMITS.preheader}
						placeholder="La phrase affichée après l’objet dans la boîte de réception"
						bind:value={draft.preheader}
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<Label for="body">Contenu</Label>
					<Textarea id="body" rows={8} maxlength={ISSUE_LIMITS.body} bind:value={draft.body} />
				</div>

				<div class="flex flex-col gap-1.5">
					<Label for="hero">Image d’en-tête (adresse)</Label>
					<Input
						id="hero"
						maxlength={ISSUE_LIMITS.heroImageUrl}
						placeholder="https://… ou /demo/piece-1.webp"
						bind:value={draft.heroImageUrl}
					/>
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					<div class="flex flex-col gap-1.5">
						<Label for="cta-label">Texte du bouton</Label>
						<Input id="cta-label" maxlength={ISSUE_LIMITS.ctaLabel} bind:value={draft.ctaLabel} />
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="cta-url">Lien du bouton</Label>
						<Input
							id="cta-url"
							maxlength={ISSUE_LIMITS.ctaUrl}
							placeholder="/search?category=bijoux"
							bind:value={draft.ctaUrl}
						/>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<Label for="newsletter-products">
						Produits mis en avant ({pickedProducts.length} / {MAX_ISSUE_PRODUCTS})
					</Label>
					{#if pickedProducts.length > 0}
						<ul class="m-0 flex list-none flex-wrap gap-2 p-0">
							{#each pickedProducts as product (product.id)}
								<li
									class="flex items-center gap-1 rounded-full border-2 border-ink bg-pink-soft py-0.5 pr-1 pl-3 text-sm"
								>
									{product.name}
									<button
										type="button"
										aria-label="Retirer {product.name}"
										onclick={() =>
											(pickedProducts = pickedProducts.filter((item) => item.id !== product.id))}
										class="flex cursor-pointer rounded-full p-1 hover:bg-paper"
									>
										<XIcon class="size-3.5" aria-hidden="true" />
									</button>
								</li>
							{/each}
						</ul>
					{/if}
					<ProductSearch
						id="newsletter-products"
						label="Ajouter un produit à la lettre"
						exclude={pickedProducts.map((product) => product.id)}
						disabled={pickedProducts.length >= MAX_ISSUE_PRODUCTS}
						onpick={(product) => (pickedProducts = [...pickedProducts, product])}
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<Label for="discount">Code promo mis en avant</Label>
					<select
						id="discount"
						value={draft.discountId ?? ''}
						onchange={(event) => (draft.discountId = event.currentTarget.value || null)}
						class={selectClass}
					>
						<option value="">Aucun</option>
						{#each discounts as discount (discount.id)}
							<option value={discount.id}>{discount.code} · {discount.label}</option>
						{/each}
					</select>
				</div>

				<div class="flex flex-col gap-2 rounded-[16px] border-2 border-ink bg-pink-pale p-4">
					<Label for="segment">Audience</Label>
					<select
						id="segment"
						value={segmentKind}
						onchange={(event) => {
							segmentKind = event.currentTarget.value as SegmentKind;
							segmentProduct = null;
						}}
						class={selectClass}
					>
						{#each segmentKinds as kind (kind)}
							<option value={kind}>{segmentLabels[kind]}</option>
						{/each}
					</select>

					{#if segmentKind === 'WISHLISTED' || segmentKind === 'RESTOCK'}
						{#if segmentProduct}
							<div
								class="flex items-center justify-between gap-2 rounded-[12px] border-2 border-ink bg-paper px-3 py-1.5 text-sm"
							>
								<strong class="truncate">{segmentProduct.name}</strong>
								<button
									type="button"
									aria-label="Changer de produit ciblé"
									onclick={() => (segmentProduct = null)}
									class="flex cursor-pointer rounded-full p-1 hover:bg-pink-soft"
								>
									<XIcon class="size-4" aria-hidden="true" />
								</button>
							</div>
						{:else}
							<ProductSearch
								id="segment-product"
								label="Produit ciblé"
								onpick={(product) => (segmentProduct = product)}
							/>
						{/if}
					{:else if segmentKind === 'INACTIVE'}
						<Label for="inactive-days" class="text-xs">Sans commande depuis (jours)</Label>
						<Input
							id="inactive-days"
							type="number"
							min={INACTIVE_DAYS.min}
							max={INACTIVE_DAYS.max}
							bind:value={inactiveDays}
						/>
					{/if}

					<p class="m-0 text-sm" aria-live="polite" data-testid="audience-count">
						{#if audience === null}
							Choisis l’audience pour voir le nombre de destinataires.
						{:else}
							<strong>{audience}</strong> destinataire{audience > 1 ? 's' : ''} aujourd’hui
						{/if}
					</p>
				</div>

				{#if touched && problems.length > 0}
					<ul class="m-0 flex list-none flex-col gap-1 p-0 text-xs font-semibold text-destructive">
						{#each problems as problem (problem)}
							<li>{problem}</li>
						{/each}
					</ul>
				{/if}

				<div class="flex flex-wrap gap-2">
					<Button disabled={!readyDraft || pending === 'save'} onclick={save}>
						Enregistrer le brouillon
					</Button>
					<Button variant="outline" disabled={!readyDraft || pending === 'test'} onclick={sendTest}>
						Tester sur mon adresse
					</Button>
					{#if draft.id}
						<Button variant="ghost" onclick={startNew}>Nouvelle lettre</Button>
					{/if}
				</div>
			</CardContent>
		</Card>

		<Card class="xl:sticky xl:top-6">
			<CardHeader>
				<CardTitle>Aperçu</CardTitle>
				<CardDescription>
					Tel que le recevront les abonnées. Les images hébergées ailleurs n’apparaissent que dans
					la boîte de réception.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if previewHtml}
					<iframe
						title="Aperçu de la lettre"
						sandbox=""
						srcdoc={previewHtml}
						data-testid="newsletter-preview"
						class="h-[720px] w-full rounded-[14px] border-2 border-ink bg-cream"
					></iframe>
				{:else}
					<p class="m-0 text-sm text-muted-foreground">
						L’aperçu s’affiche dès que l’objet et le contenu sont remplis.
					</p>
				{/if}
			</CardContent>
		</Card>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Lettres</CardTitle>
			<CardDescription>
				Les lettres programmées partent lors du passage quotidien de la tâche planifiée, le matin.
				Tant que cette page reste ouverte, un envoi en cours se poursuit ici.
			</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-col gap-4">
			{#if issues.length === 0}
				<p class="text-sm text-muted-foreground">Aucune lettre pour l'instant.</p>
			{/if}

			{#each issues as issue (issue.id)}
				{@const badge = statusBadge(issue)}
				{@const editable = issue.status === 'DRAFT' || issue.status === 'SCHEDULED'}
				<article
					aria-label={issue.subject}
					class="flex flex-col gap-3 rounded-[18px] border-2 border-ink bg-paper p-4"
				>
					<div class="flex flex-wrap items-center justify-between gap-2">
						<span class="font-semibold">{issue.subject}</span>
						<Badge variant={badge.variant}>{badge.label}</Badge>
					</div>

					<p class="m-0 text-sm text-muted-foreground">
						{segmentLabels[issue.segment]}
						{#if issue.status === 'SENT'}
							· {issue.sentCount} envoyé(s){issue.failedCount > 0
								? `, ${issue.failedCount} échec(s)`
								: ''}
						{/if}
					</p>

					{#if issue.status === 'SENDING'}
						<div
							role="progressbar"
							aria-label="Progression de l’envoi"
							aria-valuemin={0}
							aria-valuemax={Math.max(issue.recipientCount, 1)}
							aria-valuenow={issue.sentCount + issue.failedCount}
							class="h-3 overflow-hidden rounded-full border-2 border-ink bg-paper"
						>
							<div
								class="h-full bg-pink transition-[width] duration-500"
								style="width:{issue.recipientCount === 0
									? 100
									: Math.round(
											((issue.sentCount + issue.failedCount) / issue.recipientCount) * 100
										)}%"
							></div>
						</div>
						{#if autoSendHalted}
							<Button
								size="sm"
								class="w-fit"
								onclick={() => {
									autoSendHalted = false;
								}}
							>
								Reprendre l’envoi
							</Button>
						{/if}
					{/if}

					{#if editable}
						<div class="flex flex-wrap items-end gap-2">
							<Button size="sm" variant="outline" onclick={() => edit(issue)}>Modifier</Button>

							{#if confirmingId === issue.id}
								<Button
									size="sm"
									disabled={pending === issue.id}
									onclick={() =>
										run(issue.id, async () => {
											confirmingId = null;
											const result = await sendIssueNow(issue.id);
											return result.done
												? `Lettre envoyée : ${result.sent ?? 0} e-mail(s) parti(s).`
												: `Envoi lancé : ${result.sent ?? 0} / ${result.recipientCount}.`;
										})}
								>
									Confirmer l’envoi
								</Button>
								<Button size="sm" variant="ghost" onclick={() => (confirmingId = null)}>
									Annuler
								</Button>
							{:else}
								<Button
									size="sm"
									disabled={pending === issue.id}
									onclick={() => (confirmingId = issue.id)}
								>
									Envoyer maintenant
								</Button>
							{/if}

							{#if issue.status === 'SCHEDULED'}
								<Button
									size="sm"
									variant="secondary"
									disabled={pending === issue.id}
									onclick={() =>
										run(issue.id, async () => {
											await unscheduleIssue(issue.id);
											return 'Programmation annulée.';
										})}
								>
									Annuler la programmation
								</Button>
							{:else}
								<div class="flex flex-col gap-1">
									<Label for="schedule-{issue.id}" class="text-xs">Programmer pour</Label>
									<Input
										id="schedule-{issue.id}"
										type="datetime-local"
										class="h-8 w-auto"
										value={scheduleInputs[issue.id] ?? defaultSchedule()}
										oninput={(event) => (scheduleInputs[issue.id] = event.currentTarget.value)}
									/>
								</div>
								<Button
									size="sm"
									variant="secondary"
									disabled={pending === issue.id}
									onclick={() =>
										run(issue.id, async () => {
											const local = scheduleInputs[issue.id] ?? defaultSchedule();
											await scheduleIssue({
												id: issue.id,
												scheduledAt: new Date(local).toISOString()
											});
											return 'Lettre programmée.';
										})}
								>
									Programmer
								</Button>
							{/if}

							<Button
								size="sm"
								variant="ghost"
								disabled={pending === issue.id}
								onclick={() =>
									run(issue.id, async () => {
										await removeIssue(issue.id);
										if (draft.id === issue.id) {
											startNew();
										}
										return 'Lettre supprimée.';
									})}
							>
								Supprimer
							</Button>
						</div>
					{/if}
				</article>
			{/each}
		</CardContent>
	</Card>
</div>
