<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { authClient } from '$lib/authClient';
	import { Button, Card } from '@repo/ui';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const user = $derived(data.user);
	const isEntitled = $derived(data.isEntitled);

	const signOut = async () => {
		try {
			await authClient.signOut();
			await invalidate('auth:session');
		} catch {
			toast.error('Could not sign out. Please try again.');
		}
	};
</script>

<div class="flex h-full flex-col items-center justify-center gap-6 p-4">
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
						<span class={isEntitled ? 'text-primary' : 'text-foreground/60'}>
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
	{/if}
</div>
