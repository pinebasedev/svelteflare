<script lang="ts">
	import BetterAuthIcon from '~icons/simple-icons/betterauth';
	import CloudflareIcon from '~icons/simple-icons/cloudflare';
	import CloudflareWorkersIcon from '~icons/simple-icons/cloudflareworkers';
	import DrizzleIcon from '~icons/simple-icons/drizzle';
	import HonoIcon from '~icons/simple-icons/hono';
	import StripeIcon from '~icons/simple-icons/stripe';
	import SvelteIcon from '~icons/simple-icons/svelte';
	import TailwindcssIcon from '~icons/simple-icons/tailwindcss';

	const stack = [
		{ label: 'Svelte 5', icon: SvelteIcon },
		{ label: 'SvelteKit', icon: SvelteIcon },
		{ label: 'Hono', icon: HonoIcon },
		{ label: 'Better Auth', icon: BetterAuthIcon },
		{ label: 'Drizzle', icon: DrizzleIcon },
		{ label: 'Cloudflare D1', icon: CloudflareIcon },
		{ label: 'Stripe', icon: StripeIcon },
		{ label: 'Tailwind v4', icon: TailwindcssIcon },
		{ label: 'Cloudflare Workers', icon: CloudflareWorkersIcon }
	];
</script>

<section class="border-y border-border bg-muted/40">
	<ul
		class="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-6 text-sm text-muted-foreground"
	>
		{#each stack as item (item.label)}
			<li class="flex items-center gap-2">
				<item.icon class="size-4" />
				{item.label}
			</li>
		{/each}
	</ul>
</section>
