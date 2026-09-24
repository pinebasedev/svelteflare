<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '@repo/ui';
</script>

<div class="mx-auto max-w-2xl px-4 py-8 text-center lg:px-6 lg:py-16">
	<h1 class="mb-4 text-7xl tracking-tight lg:text-9xl">
		{page.status}
	</h1>
	<p class="mb-4 text-4xl">
		{page.error?.message}
	</p>
	<p class="mb-8 text-lg">
		{#if page.status === 404}
			It seems like you've taken a wrong turn.
		{:else}
			Something went wrong. Please try again later.
		{/if}
	</p>
	<Button.Root href="/">Back to Homepage</Button.Root>
</div>
