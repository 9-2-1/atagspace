<script lang="ts">
  import { API } from './api';
  import type { CategoryTag, Tag, FileTag } from './api';
  import { SvelteSet } from 'svelte/reactivity';
  import MyInput from './MyInput.svelte';
  import ItemSelector from './ItemSelector.svelte';
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
        <ItemSelector
          items={sortedCategoryTags}
          selectedIds={selectedCategoryId}
          addPlaceholder="Add Category"
          addInputValue={addCategoryInput}
          onAdd={async value => {
            await API.tag.category.add(value);
            await reloadTag();
            addCategoryInput = '';
          }}
          onDelete={async () => {
            for (const id of selectedCategoryId) {
              await API.tag.category.delete(id);
              await reloadTag();
            }
          }}
          onUpdateColors={async () => {
            for (const id of selectedCategoryId) {
              await API.tag.category.color(id, categoryForeColor, categoryBackColor);
            }
            await reloadTag();
            await reloadFile();
          }}
          onClearColors={async () => {
            for (const id of selectedCategoryId) {
              await API.tag.category.color(id, null, null);
              await reloadTag();
              await reloadFile();
            }
          }}
          foreColor={categoryForeColor}
          backColor={categoryBackColor}
          sortSequence={sortCategorySequence}
          onItemMouseDown={(item, event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.button === 0) {
              selectedCategoryId.clear();
              selectedCategoryId.add(item.id);
            }
            sortCategorySequence = [item.id, ...sortCategorySequence.filter(id => id !== item.id)];
          }}
        />
      </div>
      <div>
        <ItemSelector
          items={sortedCategoryTags.flatMap(category => category.tags)}
          selectedIds={selectedTagId}
          addPlaceholder="Add Tags"
          addInputValue={addTagInput}
          onAdd={async value => {
            const tagName = value
              .split(' ')
              .map(name => name.trim())
              .filter(name => name);
            if (sortCategorySequence.length) {
              await API.tag.adds(tagName, sortCategorySequence[0]);
              await reloadTag();
              addTagInput = '';
            }
          }}
          onDelete={async () => {
            await API.tag.deletes([...selectedTagId]);
            await reloadTag();
          }}
          onUpdateColors={async () => {
            await API.tag.colors([...selectedTagId], tagForeColor, tagBackColor);
            await reloadTag();
            await reloadFile();
          }}
          onClearColors={async () => {
            await API.tag.colors([...selectedTagId], null, null);
            await reloadTag();
            await reloadFile();
          }}
          foreColor={tagForeColor}
          backColor={tagBackColor}
          onItemMouseDown={(item, event) => {
            event.preventDefault();
            event.stopPropagation();
            // Ctrl+left click simulates middle click (button=2)
            const effectiveButton = event.ctrlKey && event.button === 0 ? 2 : event.button;

            if (effectiveButton === 0) {
              if (selectedTagId.has(item.id)) {
                selectedTagId.delete(item.id);
              } else {
                selectedTagId.add(item.id);
              }
            } else if (effectiveButton === 1) {
              selectedTagId.clear();
              selectedTagId.add(item.id);
            } else if (effectiveButton === 2) {
              selectedTagId.clear();
            }
          }}
        />
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
            <div>
              {file.name}
            </div>
            <div
              onmousedown={async event => {
                event.preventDefault();
                event.stopPropagation();
                // Ctrl+left click simulates middle click (button=2)
                const effectiveButton = event.ctrlKey && event.button === 0 ? 2 : event.button;

                if (effectiveButton === 0) {
                  await API.file.tag.adds(file.id, [...selectedTagId]);
                  await reloadFile();
                } else if (effectiveButton === 1) {
                  await API.file.tag.sets(file.id, [...selectedTagId]);
                  await reloadFile();
                } else if (effectiveButton === 2) {
                  await API.file.tag.deletes(file.id, [...selectedTagId]);
                  await reloadFile();
                }
              }}
              oncontextmenu={event => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <button
                onmousedown={async event => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (event.button == 0) {
                    if (file.isDir) {
                      currentDirId = file.id;
                      upDirList.push(file);
                    } else {
                      await API.file.openFile(file.id);
                    }
                  }
                }}>O</button
              >
              <button
                onmousedown={async event => {
                  event.preventDefault();
                  event.stopPropagation();
                }}>=</button
              >
              {#each file.tags as tag (tag.id)}
                <button
                  class="tag-item"
                  class:selected={selectedTagId.has(tag.id)}
                  style:--backcolor={tag.background ?? tag.category.background}
                  style:--forecolor={tag.foreground ?? tag.category.foreground}
                  ondblclick={async () => {
                    await API.tag.move(tag.id, sortCategorySequence[0]);
                    await reloadTag();
                    await reloadFile();
                  }}
                  onmousedown={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    // Ctrl+left click simulates middle click (button=2)
                    const effectiveButton = event.ctrlKey && event.button === 0 ? 2 : event.button;

                    if (effectiveButton === 0) {
                      if (selectedTagId.has(tag.id)) {
                        selectedTagId.delete(tag.id);
                      } else {
                        selectedTagId.add(tag.id);
                      }
                    } else if (effectiveButton === 1) {
                      selectedTagId.clear();
                      selectedTagId.add(tag.id);
                    } else if (effectiveButton === 2) {
                      selectedTagId.clear();
                    }
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

  /* Category and tag styles now handled by ItemSelector component */

  .file {
    border: 1px solid #808080;
    height: 90px;
    display: grid;
    grid-template-rows: 1fr 1fr 1fr;
    > div {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 2px;
    }
  }
</style>
