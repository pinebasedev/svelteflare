<script lang="ts">
	// alchemy.run's mark (from its favicon.svg), not in simple-icons: its
	// "alchemy" icon is the unrelated web3 company. Stroke thickened to read at 16px.
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg
	class={className}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<circle cx="12" cy="12" r="9.5" />
	<path d="M12 21.225 L4.0109 7.3875 L19.9891 7.3875 Z" />
	<circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
</svg>
