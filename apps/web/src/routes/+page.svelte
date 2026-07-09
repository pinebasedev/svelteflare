<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { authClient } from '$lib/authClient';
	import { Button, Card } from '@repo/ui';

	let { data } = $props();

	const user = $derived(data.user);
	const isEntitled = $derived(data.isEntitled);

	const signOut = async () => {
		await authClient.signOut();
		await invalidate('auth:session');
	};
</script>

<div class="flex flex-col h-full items-center justify-center gap-6 p-4">
	{#if user}
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title>Dashboard</Card.Title>
				<Card.Description>Welcome back, {user.name}</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex flex-col gap-3 text-sm">
					<div class="flex items-center justify-between">
						<span class="text-foreground/60">Email</span>
						<span>{user.email}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-foreground/60">Subscription</span>
						<span class={isEntitled ? 'text-green-500' : 'text-foreground/60'}>
							{isEntitled ? 'Premium' : 'Free'}
						</span>
					</div>
				</div>
			</Card.Content>
			<Card.Footer class="flex gap-2">
				{#if !isEntitled}
					<Button.Root href="/premium" variant="default" class="flex-1">Upgrade</Button.Root>
				{/if}
				<Button.Root onclick={signOut} variant="outline" class="flex-1">Sign out</Button.Root>
			</Card.Footer>
		</Card.Root>
	{:else}
		<div class="text-center flex flex-col gap-4">
			<h1 class="text-4xl font-sans font-semibold">YourApp</h1>
			<p class="text-foreground/60">Your app description goes here.</p>
			<Button.Root href="/login">Get started</Button.Root>
		</div>
	{/if}
</div>
