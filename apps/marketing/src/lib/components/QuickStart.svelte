<script lang="ts">
	import { Button, Card } from '@repo/ui';
	import CheckIcon from '~icons/lucide/check';
	import CopyIcon from '~icons/lucide/copy';

	const commands = `git clone https://github.com/pinebasedev/svelteflare.git my-app
cd my-app
pnpm install
cp apps/web/.env.example apps/web/.env
cp apps/api/.dev.vars.example apps/api/.dev.vars
just migrate-local   # create the local D1 database
just dev             # web on :9002, api on :9003`;

	let copied = $state(false);

	const copyCommands = async () => {
		await navigator.clipboard.writeText(commands);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	};
</script>

<section id="quick-start" class="mx-auto max-w-2xl scroll-mt-20 px-4 py-20">
	<h2 class="mb-2 text-center text-3xl font-semibold tracking-tight">Up and running in minutes</h2>
	<p class="mb-10 text-center text-muted-foreground">
		Clone, install, and you have a full-stack app running locally.
	</p>
	<Card.Root>
		<Card.Content>
			<div class="relative">
				<Button.Root
					variant="ghost"
					size="icon"
					class="absolute top-2 right-2"
					onclick={copyCommands}
					aria-label="Copy commands"
				>
					{#if copied}
						<CheckIcon class="size-4" />
					{:else}
						<CopyIcon class="size-4" />
					{/if}
				</Button.Root>
				<pre class="overflow-x-auto rounded-lg bg-muted p-4 pr-12 font-mono text-sm"><code
						>{commands}</code
					></pre>
			</div>
		</Card.Content>
	</Card.Root>
	<p class="mt-4 text-center text-sm text-muted-foreground">
		Requires Node 24+, pnpm, and just. Full setup notes in the README.
	</p>
</section>
