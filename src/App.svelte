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

  let progress = $state(80);
  let message = $state('hello');
  let progresscolor = $state('lightgreen');
  let backcolor = $state('white');
  let forecolor = $state('black');
</script>

<main>
  {#if isTest}
    <ProgressTest />
  {:else}
    <div class="page">
      <div class="page-left">
        <div>
          <Category {categorylist} bind:{categoryselection} />
        </div>
        <div>
          <Tags {taglist} bind:{tagselection} />
        </div>
      </div>
      <div class="page-middle">
        <div>
          <Navigation bind:{curpath} />
        </div>
        <div>
          <Explorer {filelist} bind:{selection} bind:{current} />
        </div>
        <div>
          <StatusBar {progress} {message} {progresscolor} {backcolor} {forecolor} />
        </div>
      </div>
      <!--
      <div class="page-right">
        <div>
          <Name />
        </div>
        <div>
          <Preview />
        </div>
      </div>
      -->
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

  .split() {
    display: grid;
    width: 100%;
    height: 100%;
  }

  .vsplit(@vsp) {
    .split;
    grid-template-columns: @vsp;
    grid-template-rows: 1fr;
    > div {
      border-right: 1px solid #e0e0e0;
      overflow: auto;
    }
  }

  .hsplit(@vsp) {
    .split;
    grid-template-columns: 1fr;
    grid-template-rows: @vsp;
    > div {
      border-bottom: 1px solid #e0e0e0;
      overflow: auto;
    }
  }

  .page {
    .vsplit(1fr 2fr);
  }

  .page-left {
    .hsplit(1fr 2fr);
  }
  .page-middle {
    .hsplit(auto 1fr auto);
  }
  .page-right {
    .hsplit(1fr 3fr);
  }
</style>
