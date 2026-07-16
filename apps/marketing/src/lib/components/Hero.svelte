<script lang="ts">
	import { GITHUB_URL } from '$lib/site';
	import { Badge, Button } from '@repo/ui';
	import GithubIcon from '~icons/lucide/github';
</script>

<section class="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
	<Badge.Root variant="secondary">Open source · MIT</Badge.Root>
	<h1 class="text-4xl font-semibold tracking-tight sm:text-6xl">
		Ship your SaaS on Cloudflare, in Svelte.
	</h1>
	<p class="text-lg text-muted-foreground">
		Svelteflare is a production-ready boilerplate: a SvelteKit SPA, a typed Hono API, auth,
		subscriptions, and a themed component library — deployed edge-first on Cloudflare Workers.
	</p>
	<div class="flex flex-wrap items-center justify-center gap-3">
		<Button.Root href={GITHUB_URL} target="_blank" rel="noreferrer">
			<GithubIcon class="size-4" />
			View source
		</Button.Root>
		<Button.Root variant="outline" href="#quick-start">Get started</Button.Root>
	</div>
</section>
