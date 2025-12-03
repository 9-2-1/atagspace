<script lang="ts">
  import type { Snippet } from 'svelte';
  const { children }: { children?: Snippet } = $props();
</script>

<div>
  {@render children?.()}
</div>

<style>
  div {
    flex: 0 0 1px;
    background-color: #e0e0e0;
  }
</style>
