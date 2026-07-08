<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '@repo/ui';
</script>

<div class="py-8 px-4 mx-auto max-w-2xl lg:py-16 lg:px-6 text-center">
	<h1 class="mb-4 text-7xl tracking-tight font-heading lg:text-9xl">
		{page.status}
	</h1>
	<p class="mb-4 text-4xl font-heading">
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
