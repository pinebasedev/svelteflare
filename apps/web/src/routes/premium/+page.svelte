<script lang="ts">
	import PremiumSubscribeCard from '$lib/components/PremiumSubscribeCard.svelte';
</script>

<div class="fixed inset-0 overflow-y-auto bg-background px-4 py-10">
	<div class="flex min-h-full flex-col items-center justify-start">
		<div class="mx-auto mt-8 flex w-full max-w-3xl flex-col items-center justify-start gap-8">
			<h1 class="text-center text-2xl">Upgrade to Premium</h1>
			<PremiumSubscribeCard />
		</div>
	</div>
</div>
