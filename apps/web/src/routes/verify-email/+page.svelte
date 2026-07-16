<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { authClient } from '$lib/authClient';
	import { Button, Card, Form, Input } from '@repo/ui';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	const email = page.url.searchParams.get('email') ?? '';

	const schema = z.object({ otp: z.string().length(6, 'Enter the 6-digit code') });

	const form = superForm(defaults({ otp: '' }, zod4(schema)), {
		SPA: true,
		validators: zod4Client(schema),
		validationMethod: 'onsubmit',
		async onUpdate({ form }) {
			if (!form.valid) return;

			try {
				const { error } = await authClient.emailOtp.verifyEmail({
					email,
					otp: form.data.otp as string
				});

				if (error) {
					toast.error(error.message ?? 'Invalid code. Please try again.');
					return;
				}

				await goto(resolve('/'));
			} catch {
				toast.error('Could not verify email. Please try again.');
			}
		}
	});

	const { form: formData, enhance, submitting } = form;

	const resend = async () => {
		try {
			const { error } = await authClient.emailOtp.sendVerificationOtp({
				email,
				type: 'email-verification'
			});
			if (error) {
				toast.error(error.message ?? 'Could not resend code.');
				return;
			}
			toast.success('New code sent — check your email.');
		} catch {
			toast.error('Could not resend code.');
		}
	};
</script>

<div class="fixed inset-0 overflow-y-auto px-4 py-10">
	<div class="min-h-full flex flex-col gap-6 items-center justify-center">
		<h1 class="font-sans text-2xl font-semibold">Demo App</h1>
		<Card.Root class="mx-auto w-full sm:w-sm">
			<Card.Header>
				<Card.Title>Check your email</Card.Title>
				<Card.Description>
					We sent a 6-digit code to <span class="text-foreground font-medium">{email}</span>.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form method="POST" use:enhance>
					<Form.Field {form} name="otp">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Verification code</Form.Label>
								<Input.Root
									bind:value={$formData.otp}
									type="text"
									inputmode="numeric"
									autocomplete="one-time-code"
									maxlength={6}
									placeholder="000000"
									{...props}
									class="text-base tracking-widest"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Button.Root type="submit" class="w-full" disabled={$submitting}>
						{$submitting ? 'Verifying...' : 'Verify email'}
					</Button.Root>
				</form>

				<div class="mt-4 text-center text-sm text-muted-foreground">
					Didn't get a code?
					<Button.Root variant="link" class="p-0 h-auto text-sm" onclick={resend}>
						Resend
					</Button.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
