<script lang="ts">
	import { page } from '$app/state';
	import { JSON_LD, OG_IMAGE, SEO_DESCRIPTION, SEO_TITLE, SITE_NAME, SITE_URL } from '$lib/site';
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
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:image" content={OG_IMAGE} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={SEO_TITLE} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={SEO_TITLE} />
	<meta name="twitter:description" content={SEO_DESCRIPTION} />
	<meta name="twitter:image" content={OG_IMAGE} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html '<' + 'script type="application/ld+json">' + JSON.stringify(JSON_LD) + '</' + 'script>'}
</svelte:head>

<ModeWatcher />
<div class="min-h-svh bg-background text-foreground">
	{@render children?.()}
</div>
