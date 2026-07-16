<script lang="ts">
	import { PUBLIC_APP_URL } from '$env/static/public';
	import { authClient } from '$lib/authClient';
	import { requestPasswordResetFormSchema } from '$lib/forms/request-password-reset-schema';
	import { Button, Card, Form, Input } from '@repo/ui';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import ArrowLeftBold from '~icons/ph/arrow-left-bold';

	const initialData = { email: '' };

	const form = superForm(defaults(initialData, zod4(requestPasswordResetFormSchema)), {
		SPA: true,
		validators: zod4Client(requestPasswordResetFormSchema),
		validationMethod: 'onsubmit',
		async onUpdate({ form }) {
			if (!form.valid) return;

			try {
				const { error } = await authClient.requestPasswordReset({
					email: form.data.email as string,
					redirectTo: `${PUBLIC_APP_URL}/reset-password`
				});

				if (error) {
					toast.error(error.message ?? 'Could not send the reset email. Please try again.');
					return;
				}

				toast.info('Please check your email to reset your password.');
			} catch {
				toast.error('Could not send the reset email. Please try again.');
			}
		}
	});

	const { form: formData, enhance, submitting } = form;
</script>

<div class="fixed inset-0 overflow-y-auto px-4 py-10 bg-background">
	<div class="min-h-full flex flex-col gap-6 items-center justify-center">
		<h1 class="text-2xl">Demo App</h1>
		<Card.Root class="w-full sm:w-sm">
			<Card.Header>
				<Card.Title>Reset your password</Card.Title>
				<Card.Description>We'll email you a secure reset link.</Card.Description>
			</Card.Header>
			<Card.Content>
				<form method="POST" use:enhance>
					<Form.Field {form} name="email">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Email</Form.Label>
								<Input.Root
									bind:value={$formData.email}
									type="email"
									{...props}
									class="placeholder:text-sm text-base"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Button.Root type="submit" class="w-full" disabled={$submitting}>
						{$submitting ? 'Sending...' : 'Reset Password'}
					</Button.Root>
				</form>
				<div class="mt-4 text-center">
					<Button.Root
						href="/login"
						variant="link"
						size="sm"
						class="inline-flex items-center gap-1 p-0 text-xs"
					>
						<ArrowLeftBold class="size-4!" />Go back
					</Button.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
