<script lang="ts">
	import { resolve } from '$app/paths';
	import { GITHUB_URL, SITE_NAME } from '$lib/site';
	import { Button } from '@repo/ui';
	import GithubIcon from '~icons/lucide/github';
	import MoonIcon from '~icons/lucide/moon';
	import SunIcon from '~icons/lucide/sun';
	import ZapIcon from '~icons/lucide/zap';
	import { mode, toggleMode } from 'mode-watcher';
</script>

<header class="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
	<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
		<a href={resolve('/')} class="flex items-center gap-2 font-semibold">
			<ZapIcon class="size-4 text-primary" />
			{SITE_NAME}
		</a>
		<div class="flex items-center gap-1">
			<Button.Root
				variant="ghost"
				size="icon"
				href={GITHUB_URL}
				target="_blank"
				rel="noreferrer"
				aria-label="View on GitHub"
			>
				<GithubIcon class="size-4" />
			</Button.Root>
			<Button.Root variant="ghost" size="icon" onclick={toggleMode} aria-label="Toggle color mode">
				{#if mode.current === 'dark'}
					<SunIcon class="size-4" />
				{:else}
					<MoonIcon class="size-4" />
				{/if}
			</Button.Root>
		</div>
	</div>
</header>
