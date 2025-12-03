<script lang="ts">
  import type { Snippet } from 'svelte';
  const { children }: { children?: Snippet } = $props();
</script>

<div>
  {@render children?.()}
</div>

<style>
  div {
    flex: 0 0 auto;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    align-items: stretch;
  }
</style>
