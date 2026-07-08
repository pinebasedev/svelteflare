<script lang="ts">
	import PremiumSubscribeCard from '$lib/components/PremiumSubscribeCard.svelte';
</script>

<div class="fixed inset-0 overflow-y-auto px-4 py-10 bg-secondary-background">
	<div class="min-h-full flex flex-col items-center justify-start">
		<div class="mx-auto w-full max-w-3xl flex flex-col gap-8 items-center justify-start mt-8">
			<h1 class="font-heading text-2xl text-center">Upgrade to Premium</h1>
			<PremiumSubscribeCard />
		</div>
	</div>
</div>
