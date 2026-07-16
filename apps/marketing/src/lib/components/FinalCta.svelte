<script lang="ts">
	import { GITHUB_URL } from '$lib/site';
	import { Button } from '@repo/ui';
	import GithubIcon from '~icons/lucide/github';
	import Footer from './Footer.svelte';
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

<Footer />
