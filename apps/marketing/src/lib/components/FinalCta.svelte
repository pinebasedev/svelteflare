<script lang="ts">
	import { GITHUB_URL } from '$lib/site';
	import { Button } from '@repo/ui';
	import GithubIcon from '~icons/lucide/github';
</script>

<section class="border-t border-border bg-muted/40">
	<div class="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center">
		<h2 class="text-3xl font-semibold tracking-tight">Start building, today.</h2>
		<div class="flex flex-wrap items-center justify-center gap-3">
			<Button.Root href={GITHUB_URL} target="_blank" rel="noreferrer">
				<GithubIcon class="size-4" />
				View source
			</Button.Root>
		</div>
	</div>
</section>

<footer class="border-t border-border">
	<div
		class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground"
	>
		<span class="flex items-center gap-1">
			MIT License ·
			<Button.Root
				variant="link"
				href={GITHUB_URL}
				target="_blank"
				rel="noreferrer"
				class="h-auto p-0 text-muted-foreground underline underline-offset-4 hover:text-foreground"
			>
				GitHub
			</Button.Root>
		</span>
		<span>Built with SvelteKit, Hono, and Cloudflare Workers</span>
	</div>
</footer>
