import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { less } from 'svelte-preprocess-less';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [svelte({ preprocess: [less()] })],
  server: {
    proxy: { '/api': { target: 'http://localhost:4590', changeOrigin: true, secure: false } },
  },
});
