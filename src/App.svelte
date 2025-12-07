<script lang="ts">
  import { API } from './api';
  import type { CategoryTag, Tag, FileTag } from './api';
  import { SvelteSet } from 'svelte/reactivity';
  import MyInput from './MyInput.svelte';
  import { tick } from 'svelte';

  let categoryTags: CategoryTag[] = $state([]);
  let sortedCategoryTags: CategoryTag[] = $derived(
    categoryTags
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(category => ({
        ...category,
        tags: category.tags.slice().sort((a, b) => a.name.localeCompare(b.name)),
      }))
  );
  let categoryMap = $derived(new Map(sortedCategoryTags.map(category => [category.id, category])));
  let categoryForeColor = $state('#000000');
  let categoryBackColor = $state('#F0F0F0');
  let tagMap = $derived(
    new Map(sortedCategoryTags.flatMap(category => category.tags.map(tag => [tag.id, tag.name])))
  );
  let tagForeColor = $state('#000000');
  let tagBackColor = $state('#F0F0F0');

  let selectedCategoryId = new SvelteSet<bigint>();
  let sortCategorySequence: bigint[] = $state([]);
  let selectedTagId = new SvelteSet<bigint>();

  let currentDirId: bigint | null = $state(null);
  type UpDir = { id: bigint | null; name: string };
  let upDirList: UpDir[] = $state([{ id: null, name: '' }]);
  let currentFiles: FileTag[] = $state([]);
  let sortedCurrentFiles: FileTag[] = $derived(
    currentFiles
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(file => ({
        ...file,
        tags: file.tags.slice().sort((a, b) => a.name.localeCompare(b.name)),
      }))
  );
  let selectedFileId = new SvelteSet<bigint>();
  let fileMap = $derived(new Map(currentFiles.map(file => [file.id, file.name])));

  async function reloadFile() {
    console.log('reload');
    currentFiles = await API.file.list(currentDirId);
  }
  async function reloadTag() {
    categoryTags = await API.tag.category.list();
  }
  let addCategoryInput = $state('');
  let addTagInput = $state('');
  let movingTag = $state<boolean>(false);

  $effect(() => {
    reloadFile();
    reloadTag();
  });

  function sorting<T>(arr: T[], pre: T[]) {
    return [...pre.filter(item => arr.includes(item)), ...arr.filter(item => !pre.includes(item))];
  }
</script>

<main>
  <div class="page">
    <div class="page-left">
      <div>
        <input
          type="text"
          placeholder="Add Category"
          bind:value={addCategoryInput}
          onkeydown={async event => {
            if (event.key === 'Enter') {
              await API.tag.category.add(addCategoryInput);
              await reloadTag();
              addCategoryInput = '';
            }
          }}
        />
        <button
          class="category-delete"
          onclick={async () => {
            // selectedCategoryId.size() && selectedCategoryId.value().next().value ??
            for (const id of selectedCategoryId) {
              await API.tag.category.delete(id);
              await reloadTag();
            }
          }}>[-]</button
        >
        <input type="color" bind:value={categoryForeColor} />
        <input type="color" bind:value={categoryBackColor} />
        <button
          onclick={async () => {
            for (const id of selectedCategoryId) {
              await API.tag.category.color(id, categoryForeColor, categoryBackColor);
            }
            await reloadTag();
          }}
        >
          Update
        </button>
        <button
          onclick={async () => {
            for (const id of selectedCategoryId) {
              await API.tag.category.color(id, null, null);
              await reloadTag();
            }
          }}
        >
          Clear
        </button>
        {#each sortedCategoryTags as category (category.id)}
          <button
            class="category-item"
            class:selected={selectedCategoryId.has(category.id)}
            style:--backcolor={category.background}
            style:--forecolor={category.foreground}
            onmousedown={event => {
              if (event.button === 0) {
                selectedCategoryId.clear();
                selectedCategoryId.add(category.id);
              }
              sortCategorySequence = [
                category.id,
                ...sortCategorySequence.filter(id => id !== category.id),
              ];
              event.preventDefault();
              event.stopPropagation();
            }}
            oncontextmenu={event => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            {category.name}
          </button>
        {/each}
      </div>
      <div>
        <input
          type="text"
          placeholder="Add Tags"
          bind:value={addTagInput}
          onkeydown={async event => {
            if (event.key === 'Enter') {
              const tagName = addTagInput
                .split(' ')
                .map(name => name.trim())
                .filter(name => name);
              if (sortCategorySequence.length) {
                await API.tag.adds(tagName, sortCategorySequence[0]);
                await reloadTag();
                addTagInput = '';
              }
            }
          }}
        />
        <button
          class="tag-delete"
          onclick={async () => {
            await API.tag.deletes([...selectedTagId]);
            await reloadTag();
          }}>[-]</button
        >
        <input type="color" bind:value={tagForeColor} />
        <input type="color" bind:value={tagBackColor} />
        <button
          onclick={async () => {
            await API.tag.colors([...selectedTagId], tagForeColor, tagBackColor);
            await reloadTag();
            await reloadFile();
          }}
        >
          Update
        </button>
        <button
          onclick={async () => {
            await API.tag.colors([...selectedTagId], null, null);
            await reloadTag();
            await reloadFile();
          }}
        >
          Clear
        </button>
        {#each sorting( sortedCategoryTags.map(category => category.id), sortCategorySequence ) as cateId}
          {@const cate = categoryMap.get(cateId)}
          {#if cate}
            {#each cate.tags as tag (tag.id)}
              <button
                class="tag-item"
                class:selected={selectedTagId.has(tag.id)}
                style:--backcolor={tag.background ?? cate.background}
                style:--forecolor={tag.foreground ?? cate.foreground}
                ondblclick={() => {}}
                onmousedown={event => {
                  if (event.button === 0) {
                    selectedTagId.clear();
                    selectedTagId.add(tag.id);
                  } else if (event.button === 1) {
                    selectedTagId.delete(tag.id);
                  } else if (event.button === 2) {
                    selectedTagId.add(tag.id);
                  }
                  event.preventDefault();
                  event.stopPropagation();
                }}
                oncontextmenu={event => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                {tag.name}
              </button>
            {/each}
          {:else}
            <div style:border="1px solid #f00;">Category not found: {cateId}</div>
          {/if}
        {/each}
      </div>
    </div>
    <div class="page-right">
      <div>
        {#each upDirList as upDir, index (upDir.id)}
          <button
            onclick={() => {
              currentDirId = upDir.id;
              upDirList = upDirList.slice(0, index + 1);
            }}
          >
            {upDir.name}
          </button>
        {/each}
      </div>
      <div>
        {#each sortedCurrentFiles as file (file.id)}
          <div class="file">
            <div
              onclick={() => {
                currentDirId = file.id;
                upDirList.push(file);
              }}
            >
              {file.name}
            </div>
            <div>
              <button
                onclick={async () => {
                  await API.file.tag.adds(file.id, [...selectedTagId]);
                  await reloadFile();
                }}>[+]</button
              >
              <button
                onclick={async () => {
                  await API.file.tag.deletes(file.id, [...selectedTagId]);
                  await reloadFile();
                }}>[-]</button
              >
              {#each file.tags as tag (tag.id)}
                <button
                  class="tag-item"
                  class:selected={selectedTagId.has(tag.id)}
                  style:--backcolor={tag.background ?? tag.category.background}
                  style:--forecolor={tag.foreground ?? tag.category.foreground}
                  ondblclick={() => {}}
                  onmousedown={event => {
                    if (event.button === 0) {
                      selectedTagId.clear();
                      selectedTagId.add(tag.id);
                    } else if (event.button === 1) {
                      selectedTagId.delete(tag.id);
                    } else if (event.button === 2) {
                      selectedTagId.add(tag.id);
                    }
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  oncontextmenu={event => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  {tag.name}
                </button>
              {/each}
            </div>
            <MyInput
              defaultValue={file.description ?? ''}
              onenter={async value => {
                await API.file.describe(file.id, value);
                await reloadFile();
                await tick();
              }}
            />
          </div>
        {/each}
      </div>
    </div>
  </div>
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

  button {
    min-width: 20px;
    min-height: 20px;
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
  .page-right {
    .hsplit(auto 1fr);
  }

  .tag-item {
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

  .category-item {
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

  .file {
    border: 1px solid #808080;
    height: 75px;
    display: grid;
    grid-template-rows: 1fr 1fr 1fr;
    > div {
      padding: 2px;
    }
  }
</style>
