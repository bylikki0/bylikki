<script lang="ts">
	import { resolve } from '$app/paths';

	let { size = 'lg' }: { size?: 'sm' | 'lg' } = $props();
</script>

<a
	href={resolve('/')}
>
	{#if size === 'sm'}
		<img src="/logo/Logo-Icone_Bylikki_Rose.png" alt={"Logo BYLIKKI"}  class="h-16"/>
	  {:else}
		<img src="/logo/Logo_Bylikki_Rose.png" alt={"Logo BYLIKKI"} class="h-16" />
	  {/if}
</a>
