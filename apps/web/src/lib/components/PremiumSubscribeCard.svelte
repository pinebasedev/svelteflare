<script lang="ts">
	import { browser } from '$app/environment';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { PUBLIC_APP_URL } from '$env/static/public';
	import { authClient } from '$lib/authClient';
	import { Badge, Button, Card, Switch } from '@repo/ui';
	import { toast } from 'svelte-sonner';
	import CheckIcon from '~icons/lucide/check';
	import ArrowLeftIcon from '~icons/lucide/arrow-left';

	type Props = {
		onSuccess?: () => void;
	};

	let { onSuccess }: Props = $props();

	const OFFER = {
		monthlyPrice: 9,
		yearlyPrice: 79,
		discountBadge: '27% OFF',
		features: ['Full access to all features', 'Priority support', 'Unlimited usage']
	} as const;

	let isYearly = $state(false);
	let loading = $state(false);

	let price = $derived(isYearly ? OFFER.yearlyPrice : OFFER.monthlyPrice);
	let periodLabel = $derived(isYearly ? '/year' : '/mo');
	let hasSession = $derived(Boolean((page.data as { session?: unknown }).session));
	let hasActiveSubscription = $derived(
		Boolean((page.data as { activeSubscription?: unknown }).activeSubscription)
	);

	const appUrl = (path: string) => new URL(path, `${PUBLIC_APP_URL}/`).toString();

	$effect(() => {
		if (!browser) return;

		const url = new URL(window.location.href);
		const checkout = url.searchParams.get('checkout');
		if (!checkout) return;

		const nextUrl = new URL(window.location.href);
		nextUrl.searchParams.delete('checkout');
		window.history.replaceState(window.history.state, '', nextUrl.toString());

		if (checkout === 'success') {
			void invalidate('auth:session').then(async () => {
				if ((page.data as { isEntitled?: boolean }).isEntitled) {
					onSuccess?.();
					toast.success("You're subscribed! Enjoy premium.");
					await goto(resolve('/'));
				}
			});
		}
	});

	async function subscribe() {
		if (loading) return;
		loading = true;

		try {
			if (!hasSession) {
				await goto(resolve('/login'));
				toast.error('Please sign in first!');
				return;
			}

			const { error } = await authClient.subscription.upgrade({
				plan: 'premium',
				annual: isYearly,
				successUrl: appUrl('/premium?checkout=success'),
				cancelUrl: appUrl('/premium'),
				returnUrl: appUrl('/premium')
			});

			if (error?.message) {
				toast.error(error.message.toString());
			}
		} catch {
			toast.error('An unexpected error occurred. Please try again.');
		} finally {
			loading = false;
		}
	}
</script>

<div class="w-full max-w-xl">
	<Card.Root class="w-full">
		<Card.Header>
			<Card.Title class="text-center text-xl">Premium</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-3">
				<div class="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2">
					<div class="justify-self-end text-sm">Monthly</div>
					<div class="justify-self-center">
						<Switch.Root bind:checked={isYearly} />
					</div>
					<div class="flex items-center gap-1 justify-self-start">
						<span class="text-sm">Yearly</span>
						<Badge.Root class="bg-primary text-primary-foreground">{OFFER.discountBadge}</Badge.Root
						>
					</div>
				</div>

				<div class="my-2 mb-6 w-full text-center text-6xl">
					${price}<span class="text-base">{periodLabel}</span>
				</div>

				{#each OFFER.features as feature (feature)}
					<div class="inline-flex items-center gap-2 text-sm">
						<CheckIcon class="size-5 text-primary" />{feature}
					</div>
				{/each}

				{#if hasActiveSubscription}
					<div class="mt-4 inline-flex w-full items-center justify-center text-sm text-primary">
						You already have an active subscription.
					</div>
				{:else}
					<div class="mt-4 mb-2 flex w-full flex-col items-center">
						<Button.Root onclick={subscribe} disabled={loading} class="w-64">
							{loading ? 'Opening checkout...' : 'Subscribe'}
						</Button.Root>
					</div>
				{/if}
			</div>

			<div class="mt-4 text-center">
				<Button.Root
					href="/"
					variant="link"
					size="sm"
					class="inline-flex items-center gap-1 p-0 text-xs"
				>
					<ArrowLeftIcon class="size-4!" />Go back
				</Button.Root>
			</div>
		</Card.Content>
	</Card.Root>
</div>
