<script lang="ts">
	import { Accordion } from '@repo/ui';

	const faqs = [
		{
			question: 'Is it free?',
			answer:
				'Yes. Svelteflare is MIT-licensed. Clone it, rename it, ship it — no strings attached.'
		},
		{
			question: 'What do I need to run it?',
			answer:
				'Node 24+, pnpm, and a free Cloudflare account. pnpm dev runs everything locally with simulated D1, R2, and email, no .env needed. Stripe and Google OAuth keys are only needed when you want billing and social login.'
		},
		{
			question: 'Why a SPA plus a separate API?',
			answer:
				'The frontend is a static SvelteKit SPA served from the edge; all logic lives in a Hono Worker. That split keeps deploys atomic and cheap, makes the API reusable, and the typed RPC client keeps the two ends in sync.'
		},
		{
			question: 'How does it deploy?',
			answer:
				'Alchemy defines every Cloudflare resource in TypeScript, and GitHub Actions deploys a stage per pull request, plus staging and prod. Previews sit behind Cloudflare Access and are torn down when the PR closes.'
		},
		{
			question: 'How do I change the look?',
			answer:
				'The theme combines semantic variables in packages/ui/src/global.css with the visual implementations of all 56 components. Colors, typography, shape, spacing, and interactions can change together in light and dark mode.'
		},
		{
			question: 'Does it come with a marketing site?',
			answer:
				'Yes — apps/marketing is a prerendered SvelteKit site built from the same @repo/ui components as the app. Swap in your own copy and ship it, or delete it if you don’t need one.'
		}
	];
</script>

<section class="mx-auto max-w-2xl px-4 py-20">
	<h2 class="mb-10 text-center text-3xl font-semibold tracking-tight">Frequently asked</h2>
	<Accordion.Root type="single">
		{#each faqs as faq (faq.question)}
			<Accordion.Item value={faq.question}>
				<Accordion.Trigger>{faq.question}</Accordion.Trigger>
				<Accordion.Content>{faq.answer}</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</section>
