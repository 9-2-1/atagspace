<script lang="ts">
  import type { SvelteSet } from 'svelte/reactivity';

  interface Item {
    id: bigint;
    name: string;
    foreground?: string | null;
    background?: string | null;
  }

  let {
    items,
    selectedIds,
    addPlaceholder,
    addInputValue,
    onAdd,
    onDelete,
    onUpdateColors,
    onClearColors,
    foreColor,
    backColor,
    sortSequence,
    onItemMouseDown,
  }: {
    items: Item[];
    selectedIds: SvelteSet<bigint>;
    addPlaceholder: string;
    addInputValue: string;
    onAdd: (value: string) => Promise<void>;
    onDelete: () => Promise<void>;
    onUpdateColors: () => Promise<void>;
    onClearColors: () => Promise<void>;
    foreColor: string;
    backColor: string;
    sortSequence?: bigint[];
    onItemMouseDown: (item: Item, event: MouseEvent) => void;
  } = $props();

  function handleAddKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      onAdd(addInputValue);
    }
  }
</script>

<div class="item-selector">
  <div class="controls" style="display: flex; align-items: baseline; gap: 4px;">
    <input
      type="text"
      placeholder={addPlaceholder}
      bind:value={addInputValue}
      onkeydown={handleAddKeyDown}
      style="vertical-align: baseline;"
    />
    <button class="delete-btn" onclick={onDelete} style="vertical-align: baseline;">-</button>
    <input type="color" bind:value={foreColor} style="vertical-align: baseline;" />
    <input type="color" bind:value={backColor} style="vertical-align: baseline;" />
    <button onclick={onUpdateColors} style="vertical-align: baseline;">Update</button>
    <button onclick={onClearColors} style="vertical-align: baseline;">Clear</button>
  </div>
  <div class="items">
    {#each items as item (item.id)}
      <button
        class="item"
        class:selected={selectedIds.has(item.id)}
        style:--backcolor={item.background ?? '#F0F0F0'}
        style:--forecolor={item.foreground ?? '#000000'}
        onmousedown={e => onItemMouseDown(item, e)}
        oncontextmenu={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style="vertical-align: baseline;"
      >
        {item.name}
      </button>
    {/each}
  </div>
</div>

<style lang="less">
  .item-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .controls {
    display: flex;
    align-items: baseline;
    gap: 4px;
    flex-wrap: wrap;
  }

  .item {
    margin: 2px;
    padding: 2px;
    border: 1px solid var(--forecolor, #707070);
    background-color: var(--backcolor, #f0f0f0);
    color: var(--forecolor, #707070);
    outline: 1px solid #808080;
    &.selected {
      border-bottom-width: 4px;
    }
  }
</style>
