<script lang="ts">
  import type { Snippet } from 'svelte';
  const { x, children }: { x: number; children?: Snippet } = $props();
</script>

<div style:--flex={x}>
  {@render children?.()}
</div>

<style>
  div {
    flex: var(--flex) var(--flex) 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    align-items: stretch;
  }
</style>
