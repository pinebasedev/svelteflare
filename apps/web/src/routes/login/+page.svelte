<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
</script>

<div class="fixed inset-0 overflow-y-auto bg-background px-4 py-10">
	<div class="flex min-h-full flex-col items-center justify-center gap-6">
		<h1 class="text-2xl">Demo App</h1>
		<LoginForm showSignupLink />
	</div>
</div>
