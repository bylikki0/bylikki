<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/client/utils/shadcn';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...restProps
	}: WithElementRef<HTMLTextareaAttributes, HTMLTextAreaElement> = $props();
</script>

<textarea
	bind:this={ref}
	bind:value
	data-slot="textarea"
	class={cn(
		'flex field-sizing-content min-h-16 w-full rounded-[12px] border-2 border-input bg-paper px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm',
		className
	)}
	{...restProps}></textarea>
