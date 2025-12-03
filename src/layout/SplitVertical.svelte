<script lang="ts">
  import type { Snippet } from 'svelte';
  const { children }: { children?: Snippet } = $props();
</script>

<div>
  {@render children?.()}
</div>

<style>
  div {
    flex: 1 1 auto;
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    align-items: stretch;
  }
</style>
