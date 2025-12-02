<script lang="ts">
  import Tags from './component/Tags.svelte';
  import Explorer from './component/Explorer.svelte';
  let ccc = $state(0);
</script>

<main>
  <Tags></Tags>
  <Explorer></Explorer>
</main>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px;
  }
</style>
