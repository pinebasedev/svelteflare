<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
</script>

<div class="fixed inset-0 overflow-y-auto px-4 py-10 bg-secondary-background">
	<div class="min-h-full flex flex-col gap-6 items-center justify-center">
		<h1 class="font-heading text-2xl">YourApp</h1>
		<LoginForm showSignupLink showBackLink backHref="/" />
	</div>
</div>
