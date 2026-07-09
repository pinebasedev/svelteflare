<script lang="ts">
	import { page } from '$app/state';
	import { PUBLIC_APP_URL } from '$env/static/public';
	import { settings } from '$lib/state/settings.svelte';
	import { Button } from '@repo/ui';
	import { Toaster, Tooltip } from '@repo/ui';
	import MoonIcon from '~icons/lucide/moon';
	import SunIcon from '~icons/lucide/sun';
	import { mode, ModeWatcher } from 'mode-watcher';
	import '../main.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const children_render = $derived(children);

	const toggleMode = () => settings.setColorMode(mode.current === 'dark' ? 'light' : 'dark');
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

<ModeWatcher />
<div class="relative flex flex-col h-svh overflow-hidden justify-center bg-background">
	<div class="absolute top-3 right-3 z-50">
		<Button.Root variant="ghost" size="icon" onclick={toggleMode} aria-label="Toggle color mode">
			{#if mode.current === 'dark'}
				<SunIcon class="size-4" />
			{:else}
				<MoonIcon class="size-4" />
			{/if}
		</Button.Root>
	</div>
	<Tooltip.Provider>
		{@render children_render?.()}
	</Tooltip.Provider>
	<Toaster.Root />
</div>
