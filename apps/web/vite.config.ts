import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 9002,
    host: true
  },
  preview: {
    port: 9002,
    host: true
  },
  plugins: [
    sveltekit(),
    tailwindcss(),
    Icons({
      compiler: 'svelte'
    })
  ]
});
