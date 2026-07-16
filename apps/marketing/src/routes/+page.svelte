<script lang="ts">
	import Faq from '$lib/components/Faq.svelte';
	import Features from '$lib/components/Features.svelte';
	import FinalCta from '$lib/components/FinalCta.svelte';
	import Header from '$lib/components/Header.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import QuickStart from '$lib/components/QuickStart.svelte';
	import TechStack from '$lib/components/TechStack.svelte';
</script>

<Header />
<main>
	<Hero />
	<TechStack />
	<Features />
	<QuickStart />
	<Faq />
	<FinalCta />
</main>
