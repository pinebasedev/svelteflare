<script lang="ts">
	import { page } from '$app/state';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import { Button } from '@repo/ui';
</script>

<div class="flex min-h-svh flex-col">
	<Header />
	<div class="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
		<h1 class="mb-4 text-7xl tracking-tight font-semibold lg:text-9xl">
			{page.status}
		</h1>
		<p class="mb-8 text-lg text-muted-foreground">
			{#if page.status === 404}
				This page doesn't exist. Let's get you back home.
			{:else}
				Something went wrong. Please try again later.
			{/if}
		</p>
		<Button.Root href="/">Back to homepage</Button.Root>
	</div>
	<Footer />
</div>
