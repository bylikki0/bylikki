<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/client/utils/shadcn';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	class={cn(
		'flex flex-col gap-6 rounded-[20px] border-2 border-ink bg-card py-6 text-card-foreground shadow-[6px_7px_0_rgba(46,27,51,.1)]',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
