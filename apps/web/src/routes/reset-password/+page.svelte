<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { authClient } from '$lib/authClient';
	import { passwordResetFormSchema } from '$lib/forms/password-reset-schema';
	import { Button, Card, Form, Input } from '@repo/ui';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import ArrowLeftBold from '~icons/ph/arrow-left-bold';

	const initialData = {
		newPassword: '',
		confirmPassword: '',
		token: page.url.searchParams.get('token') ?? ''
	};

	const form = superForm(defaults(initialData, zod4(passwordResetFormSchema)), {
		SPA: true,
		validators: zod4Client(passwordResetFormSchema),
		validationMethod: 'onsubmit',
		async onUpdate({ form }) {
			if (!form.valid) return;

			try {
				const { error } = await authClient.resetPassword({
					newPassword: form.data.newPassword as string,
					token: form.data.token as string
				});

				if (error) {
					toast.error(error.message ?? 'Could not reset your password. Please try again.');
					return;
				}

				toast.success('Password reset successfully');
				await goto(resolve('/login'));
			} catch {
				toast.error('Could not reset your password. Please try again.');
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
				<Card.Title>Reset Password</Card.Title>
				<Card.Description>Enter your new password below.</Card.Description>
			</Card.Header>
			<Card.Content>
				<form method="POST" use:enhance>
					<Input.Root bind:value={$formData.token} type="hidden" />
					<Form.Field {form} name="newPassword">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>New Password</Form.Label>
								<Input.Root
									bind:value={$formData.newPassword}
									type="password"
									{...props}
									class="placeholder:text-sm text-base"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="confirmPassword">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Confirm Password</Form.Label>
								<Input.Root
									bind:value={$formData.confirmPassword}
									type="password"
									{...props}
									class="placeholder:text-sm text-base"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Button.Root type="submit" class="w-full" disabled={$submitting}>
						{$submitting ? 'Saving...' : 'Reset Password'}
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
