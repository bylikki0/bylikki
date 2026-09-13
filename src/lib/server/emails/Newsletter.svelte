<script lang="ts">
	import { Column, Section, Text } from 'svelte-email-tailwind';
	import CallToAction from './CallToAction.svelte';
	import Layout from './Layout.svelte';
	import {
		highlight,
		highlightLabel,
		highlightValue,
		linkStyleString,
		palette,
		styles
	} from './theme';

	type Props = {
		title: string;
		preheader: string;
		paragraphs: string[];
		heroImageUrl: string | null;
		cta: { label: string; href: string } | null;
		products: { name: string; href: string; price: string; imageUrl: string | null }[];
		discount: { code: string; label: string; detail: string } | null;
		unsubscribeUrl: string;
		origin: string;
	};

	let {
		title,
		preheader,
		paragraphs,
		heroImageUrl,
		cta,
		products,
		discount,
		unsubscribeUrl,
		origin
	}: Props = $props();
</script>

<Layout {origin} preview={preheader || title} eyebrow="Des nouvelles de l'atelier" {title}>
	{#if heroImageUrl}
		<img
			src={heroImageUrl}
			alt=""
			width="496"
			style="display:block;width:100%;max-width:496px;height:auto;border:2px solid {palette.ink};border-radius:18px;margin:0 0 18px"
		/>
	{/if}

	{#each paragraphs as paragraph, index (index)}
		<Text style={styles.text}>{paragraph}</Text>
	{/each}

	{#if discount}
		<Section style={{ ...highlight(palette.yellowSoft), margin: '10px 0 16px' }}>
			<Column>
				<Text style={highlightLabel}>{discount.label}</Text>
				<Text style={highlightValue}>{discount.code}</Text>
				<Text style={{ ...styles.small, marginTop: '6px' }}>{discount.detail}</Text>
			</Column>
		</Section>
	{/if}

	{#each products as product (product.href)}
		<Section style={{ ...highlight(palette.pinkPale), margin: '0 0 12px' }}>
			{#if product.imageUrl}
				<Column style={{ width: '104px', verticalAlign: 'middle' }}>
					<img
						src={product.imageUrl}
						alt={product.name}
						width="88"
						height="88"
						style="display:block;width:88px;height:88px;object-fit:cover;border:2px solid {palette.ink};border-radius:14px"
					/>
				</Column>
			{/if}
			<Column style={{ verticalAlign: 'middle' }}>
				<Text style={{ ...styles.text, margin: '0', fontWeight: '700' }}>{product.name}</Text>
				<Text style={{ ...styles.small, margin: '2px 0 8px' }}>{product.price}</Text>
				<a href={product.href} style={linkStyleString}>Voir la pièce</a>
			</Column>
		</Section>
	{/each}

	{#if cta}
		<CallToAction href={cta.href} label={cta.label} />
	{/if}

	<Text style={{ ...styles.small, marginTop: '20px' }}>
		Tu reçois cette lettre parce que tu l'as demandée dans ton compte.
		<a href={unsubscribeUrl} style={linkStyleString}>Se désinscrire en un clic</a>.
	</Text>
</Layout>
