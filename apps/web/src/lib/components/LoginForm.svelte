<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { PUBLIC_APP_URL } from '$env/static/public';
	import { authClient } from '$lib/authClient';
	import { loginFormSchema } from '$lib/forms/login-schema';
	import { Button, Card, Form, Input } from '@repo/ui';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import ArrowLeftIcon from '~icons/lucide/arrow-left';
	import GoogleIcon from '~icons/ph/google-logo-bold';

	type LoginFormProps = {
		title?: string;
		description?: string;
		showSignupLink?: boolean;
		showBackLink?: boolean;
		backHref?: string;
		onBack?: () => void;
	};

	let {
		title = 'Login',
		description = 'Enter your email below to login to your account',
		showSignupLink = true,
		showBackLink = false,
		backHref = undefined,
		onBack = undefined
	}: LoginFormProps = $props();

	const initialData = { email: '', password: '' };

	const signInWithGoogle = async () => {
		if ($submitting) return;

		try {
			await authClient.signIn.social({
				provider: 'google',
				callbackURL: `${PUBLIC_APP_URL}/`,
				errorCallbackURL: `${PUBLIC_APP_URL}/login?error=google`,
				requestSignUp: false
			});
		} catch {
			toast.error('Could not start Google sign-in. Please try again.');
		}
	};

	const form = superForm(defaults(initialData, zod4(loginFormSchema)), {
		SPA: true,
		validators: zod4Client(loginFormSchema),
		validationMethod: 'onsubmit',
		async onUpdate({ form }) {
			if (!form.valid) return;

			try {
				const { error } = await authClient.signIn.email({
					email: form.data.email as string,
					password: form.data.password as string,
					rememberMe: true
				});

				if (error) {
					toast.error(error.message ?? 'Could not log in. Please try again.');
					return;
				}

				await goto(resolve('/'));
				await invalidate('auth:session');
			} catch {
				toast.error('Could not log in. Please try again.');
			}
		}
	});

	const { form: formData, enhance, submitting } = form;
</script>

<Card.Root class="mx-auto w-full sm:w-sm">
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		{#if description}
			<Card.Description>{description}</Card.Description>
		{/if}
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

			<Form.Field {form} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex items-end">
							<Form.Label>Password</Form.Label>
							<Button.Root
								variant="link"
								href="/forgot-password"
								class="ml-auto inline-block text-xs underline py-0 h-auto"
							>
								Forgot your password?
							</Button.Root>
						</div>
						<Input.Root
							bind:value={$formData.password}
							type="password"
							{...props}
							class="placeholder:text-sm text-base"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Button.Root type="submit" class="w-full mb-6" disabled={$submitting}>
				{$submitting ? 'Logging in...' : 'Login'}
			</Button.Root>

			<div
				class="font-normal mb-6 after:border-border text-xs relative text-center after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"
			>
				<span class="bg-background text-muted-foreground relative z-10 px-2">OR</span>
			</div>

			<Button.Root
				onclick={signInWithGoogle}
				disabled={$submitting}
				variant="secondary"
				class="text-sm w-full"
			>
				<GoogleIcon />
				Continue with Google
			</Button.Root>
		</form>

		{#if showSignupLink}
			<div class="mt-4 text-center text-sm">
				Don't have an account?
				<Button.Root variant="link" href="/register" class="underline p-0 text-sm h-fit">
					Sign up
				</Button.Root>
			</div>
		{/if}

		{#if showBackLink}
			<div class="mt-4 text-center">
				{#if backHref}
					<Button.Root
						href={backHref}
						variant="link"
						size="sm"
						class="inline-flex items-center gap-1 p-0 text-xs"
					>
						<ArrowLeftIcon class="size-4!" />Go back
					</Button.Root>
				{:else if onBack}
					<Button.Root
						variant="link"
						size="sm"
						class="inline-flex items-center gap-1 p-0 text-xs"
						onclick={onBack}
					>
						<ArrowLeftIcon class="size-4!" />Go back
					</Button.Root>
				{/if}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
