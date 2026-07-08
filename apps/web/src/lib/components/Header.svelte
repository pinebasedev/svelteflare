<script lang="ts">
	import { Button } from '@repo/ui';
</script>

<header
	class="sticky top-0 z-50 flex h-16 w-full items-center justify-center border-b border-border bg-background"
>
	<div class="mx-auto max-w-7xl flex w-full items-center justify-between px-4 sm:px-8">
		<Button.Root href="/" variant="link" class="h-auto p-0 font-sans text-lg font-semibold">
			YourApp
		</Button.Root>
		<nav class="flex items-center gap-2">
			<Button.Root href="/login" variant="outline" size="sm">Login</Button.Root>
		</nav>
	</div>
</header>
