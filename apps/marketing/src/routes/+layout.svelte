<script lang="ts">
	import { page } from '$app/state';
	import { SEO_DESCRIPTION, SEO_TITLE, SITE_URL } from '$lib/site';
	import '../main.css';
	import { ModeWatcher } from 'mode-watcher';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="canonical" href={`${SITE_URL}${page.url.pathname}`} />
	<title>{SEO_TITLE}</title>
	<meta name="description" content={SEO_DESCRIPTION} />

	<meta property="og:title" content={SEO_TITLE} />
	<meta property="og:description" content={SEO_DESCRIPTION} />
	<meta property="og:url" content={`${SITE_URL}${page.url.pathname}`} />
	<meta property="og:type" content="website" />

	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={SEO_TITLE} />
	<meta name="twitter:description" content={SEO_DESCRIPTION} />
</svelte:head>

<ModeWatcher />
<div class="bg-background text-foreground min-h-svh">
	{@render children?.()}
</div>
