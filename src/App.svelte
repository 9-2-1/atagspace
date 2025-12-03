<script lang="ts">
  import Tags from './component/Tags.svelte';
  import Explorer from './component/Explorer.svelte';
  import Preview from './component/Preview.svelte';
  import ProgressTest from './component/ProgressTest.svelte';
  import Category from './component/Category.svelte';
  import Name from './component/Name.svelte';
  import Navigation from './component/Navigation.svelte';
  import StatusBar from './component/StatusBar.svelte';

  const urlParams = new URLSearchParams(window.location.search);
  const isTest = urlParams.has('test');
</script>

<main>
  {#if isTest}
    <ProgressTest />
  {:else}
    <div class="page">
      <div class="page-left">
        <div>
          <Category />
        </div>
        <div>
          <Tags />
        </div>
      </div>
      <div class="page-middle">
        <div>
          <Navigation />
        </div>
        <div>
          <Explorer />
        </div>
        <div>
          <StatusBar />
        </div>
      </div>
      <div class="page-right">
        <div>
          <Name />
        </div>
        <div>
          <Preview />
        </div>
      </div>
    </div>
  {/if}
</main>

<style lang="less">
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  main {
    width: 100vw;
    height: 100vh;
  }

  .grid() {
    display: grid;
    place-items: stretch;
    place-content: stretch;
    width: 100%;
    height: 100%;
  }

  .page {
    .grid();
    grid-template-columns: 1fr 2fr 1fr;
    grid-template-rows: 1fr;
    > div {
      border-right: 1px solid #e0e0e0;
    }
  }

  .page-left {
    .grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 2fr;
    > div {
      border-bottom: 1px solid #e0e0e0;
    }
  }
  .page-middle {
    .grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    > div {
      border-bottom: 1px solid #e0e0e0;
    }
  }
  .page-right {
    .grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 3fr;
    > div {
      border-bottom: 1px solid #e0e0e0;
    }
  }
</style>
