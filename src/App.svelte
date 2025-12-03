<script lang="ts">
  import Tags from './component/Tags.svelte';
  import Explorer from './component/Explorer.svelte';
  import Preview from './component/Preview.svelte';
  import ProgressTest from './component/ProgressTest.svelte';
  import SplitVertical from './layout/SplitVertical.svelte';
  import SplitHorizontal from './layout/SplitHorizontal.svelte';
  import Separator from './layout/Separator.svelte';
  import Flex from './layout/Flex.svelte';
</script>

<main>
  <SplitVertical>
    <Flex x={1}>
      <SplitHorizontal>
        <Flex x={2}>
          <Tags />
        </Flex>
        <Separator />
        <Flex x={1}>
          <Preview />
        </Flex>
      </SplitHorizontal>
    </Flex>
    <Separator />
    <Flex x={3}>
      <Explorer />
    </Flex>
  </SplitVertical>
</main>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  main {
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    align-items: stretch;
    width: 100vw;
    height: 100vh;
  }
</style>
