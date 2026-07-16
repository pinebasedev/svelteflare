<script lang="ts">
	import { Accordion } from '@repo/ui';

	const faqs = [
		{
			question: 'Is it free?',
			answer: 'Yes. Svelteflare is MIT-licensed. Clone it, rename it, ship it — no strings attached.'
		},
		{
			question: 'What do I need to run it?',
			answer:
				'Node 24+, pnpm, and a free Cloudflare account. Stripe and Google OAuth keys are only needed when you want billing and social login — the app runs locally without them.'
		},
		{
			question: 'Why a SPA plus a separate API?',
			answer:
				'The frontend is a static SvelteKit SPA served from the edge; all logic lives in a Hono Worker. That split keeps deploys atomic and cheap, makes the API reusable, and the typed RPC client keeps the two ends in sync.'
		},
		{
			question: 'How do I change the look?',
			answer:
				'The whole theme is CSS variables in one file: packages/ui/src/global.css. Swap the token values and all 57 components — light and dark mode — update at once.'
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
