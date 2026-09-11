<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'focus-visible:border-ring focus-visible:ring-ring/50 inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border-[1.5px] px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3',
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground border-ink',
				secondary: 'bg-secondary text-secondary-foreground border-ink',
				destructive: 'bg-destructive text-destructive-foreground border-ink',
				outline: 'bg-paper text-foreground border-ink/40'
			}
		},
		defaultVariants: { variant: 'default' }
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/client/utils/shadcn';

	let {
		ref = $bindable(null),
		href = undefined,
		class: className,
		variant = 'default',
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & { variant?: BadgeVariant } = $props();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
