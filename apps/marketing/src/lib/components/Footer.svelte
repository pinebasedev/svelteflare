<script lang="ts">
	import { GITHUB_URL } from '$lib/site';
	import { Button } from '@repo/ui';
</script>

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
