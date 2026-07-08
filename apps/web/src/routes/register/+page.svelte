<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { PUBLIC_APP_URL } from '$env/static/public';
	import { authClient } from '$lib/authClient';
	import { registerFormSchema } from '$lib/forms/register-schema';
	import { Button, Card, Form, Input } from '@repo/ui';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';

	const initialData = { name: '', email: '', password: '', confirmPassword: '' };

	const form = superForm(defaults(initialData, zod4(registerFormSchema)), {
		SPA: true,
		validators: zod4Client(registerFormSchema),
		validationMethod: 'onsubmit',
		async onUpdate({ form }) {
			if (!form.valid) return;

			try {
				const { error } = await authClient.signUp.email({
					name: form.data.name as string,
					email: form.data.email as string,
					password: form.data.password as string,
					callbackURL: `${PUBLIC_APP_URL}/`
				});

				if (error) {
					toast.error(error.message ?? 'Could not create account. Please try again.');
					return;
				}

				await goto(resolve(`/verify-email?email=${encodeURIComponent(form.data.email as string)}`));
			} catch {
				toast.error('Could not create account. Please try again.');
			}
		}
	});

	const { form: formData, enhance, submitting } = form;
</script>

<div class="fixed inset-0 overflow-y-auto px-4 py-10 bg-secondary-background">
	<div class="min-h-full flex flex-col gap-6 items-center justify-center">
		<h1 class="font-heading text-2xl">YourApp</h1>
		<Card.Root class="mx-auto w-full sm:w-sm">
			<Card.Header>
				<Card.Title>Create an account</Card.Title>
				<Card.Description>Fill in your details to get started</Card.Description>
			</Card.Header>
			<Card.Content>
				<form method="POST" use:enhance>
					<Form.Field {form} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Name</Form.Label>
								<Input.Root
									bind:value={$formData.name}
									type="text"
									{...props}
									class="text-base"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="email">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Email</Form.Label>
								<Input.Root
									bind:value={$formData.email}
									type="email"
									{...props}
									class="text-base"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="password">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Password</Form.Label>
								<Input.Root
									bind:value={$formData.password}
									type="password"
									{...props}
									class="text-base"
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
									class="text-base"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Button.Root type="submit" class="w-full" disabled={$submitting}>
						{$submitting ? 'Creating account...' : 'Create account'}
					</Button.Root>
				</form>

				<div class="mt-4 text-center text-sm">
					Already have an account?
					<Button.Root variant="link" href="/login" class="underline p-0 text-sm h-fit">
						Login
					</Button.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
