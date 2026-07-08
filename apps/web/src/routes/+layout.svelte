<script lang="ts">
	import { browser } from '$app/environment';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { PUBLIC_APP_URL } from '$env/static/public';
	import { ph } from '$lib/posthog';
	import { Toaster, Tooltip } from '@repo/ui';
	import { onMount } from 'svelte';
	import '../main.css';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const children_render = $derived(children);

	if (browser) {
		beforeNavigate(() => ph.pageLeave());
		afterNavigate(() => ph.pageView());
	}

	onMount(() => {
		if (!browser) return;

		if (data.user) {
			ph.identify(data.user);
		} else {
			ph.reset();
		}
	});
</script>

<svelte:head>
	<link rel="canonical" href={page.data.canonical_url ?? `${PUBLIC_APP_URL}${page.url.pathname}`} />
	<title>{page.data.seoTitle ?? 'YourApp'}</title>
	<meta name="description" content={page.data.seoDescription} />

	<meta property="og:title" content={page.data.seoTitle} />
	<meta property="og:description" content={page.data.seoDescription} />
	<meta property="og:image" content={page.data.ogImage} />
	<meta property="og:url" content={page.url.toString()} />
	<meta property="og:type" content="website" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={page.data.seoTitle} />
	<meta name="twitter:description" content={page.data.seoDescription} />
	<meta name="twitter:image" content={page.data.ogImage} />
	<meta name="twitter:url" content={page.url.toString()} />

	<!-- PWA -->
	<meta name="theme-color" content="#000000" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black" />
</svelte:head>

<div class="flex flex-col h-svh overflow-hidden justify-center bg-background">
	<Tooltip.Provider>
		{@render children_render?.()}
	</Tooltip.Provider>
	<Toaster.Root />
</div>
