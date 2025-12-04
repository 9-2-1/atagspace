<script lang="ts">
  import { onMount } from 'svelte';
  import { trpc } from '../trpc/client';
  import type { Source } from '../../../backend/src/db/models/Source';

  // 状态管理
  let state = {
    sources: [] as Source[],
    loading: true,
    error: '',
    newSource: { name: '', path: '' }
  };

  // 加载源文件夹
  onMount(async () => {
    await loadSources();
  });

  async function loadSources() {
    try {
      state.loading = true;
      state.sources = await trpc.listSources.query();
      state.error = '';
    } catch (e) {
      state.error = 'Failed to load sources';
      console.error(e);
    } finally {
      state.loading = false;
    }
  }

  // 添加源文件夹
  async function addSource() {
    if (!state.newSource.name.trim() || !state.newSource.path.trim()) {
      return;
    }

    try {
      await trpc.addSource.mutate({
        name: state.newSource.name,
        path: state.newSource.path
      });
      await loadSources();
      state.newSource = { name: '', path: '' };
    } catch (e) {
      state.error = 'Failed to add source';
      console.error(e);
    }
  }

  // 更新源文件夹
  async function updateSource(source: Source) {
    try {
      await trpc.updateSource.mutate({
        id: source.id,
        name: source.name,
        path: source.path
      });
      await loadSources();
    } catch (e) {
      state.error = 'Failed to update source';
      console.error(e);
    }
  }

  // 删除源文件夹
  async function deleteSource(id: number) {
    try {
      await trpc.deleteSource.mutate(id);
      await loadSources();
    } catch (e) {
      state.error = 'Failed to delete source';
      console.error(e);
    }
  }
</script>

<div class="source-manager">
  <h2>Source Folders</h2>
  
  {#if state.error}
    <div class="error">{state.error}</div>
  {/if}

  <!-- 添加源文件夹 -->
  <div class="section">
    <h3>Add Source Folder</h3>
    <div class="input-group">
      <input 
        type="text" 
        placeholder="Source name" 
        bind:value={state.newSource.name}
      />
      <input 
        type="text" 
        placeholder="Source path" 
        bind:value={state.newSource.path}
      />
      <button on:click={addSource}>Add</button>
    </div>
  </div>

  <!-- 源文件夹列表 -->
  <div class="section">
    <h3>Source Folders List</h3>
    {#if state.loading}
      <div>Loading...</div>
    {:else}
      <div class="sources">
        {#each state.sources as source}
          <div class="source">
            <div class="source-info">
              <div class="source-name">
                <input 
                  type="text" 
                  bind:value={source.name}
                  placeholder="Source name"
                />
              </div>
              <div class="source-path">
                <input 
                  type="text" 
                  bind:value={source.path}
                  placeholder="Source path"
                />
              </div>
            </div>
            <div class="source-actions">
              <button class="save-btn" on:click={() => updateSource(source)}>Save</button>
              <button class="delete-btn" on:click={() => deleteSource(source.id)}>Delete</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .source-manager {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  
  h2 {
    margin-top: 0;
    color: #333;
  }
  
  h3 {
    color: #555;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  
  .section {
    margin-bottom: 20px;
  }
  
  .input-group {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  input[type="text"] {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    flex: 1;
  }
  
  button {
    padding: 8px 16px;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .save-btn {
    background: #2196F3;
  }
  
  .save-btn:hover {
    background: #0b7dda;
  }
  
  .delete-btn {
    background: #f44336;
    margin-left: 5px;
  }
  
  .delete-btn:hover {
    background: #da190b;
  }
  
  .error {
    color: red;
    margin-bottom: 15px;
    padding: 10px;
    background: #ffebee;
    border-radius: 4px;
  }
  
  .sources {
    margin-top: 15px;
  }
  
  .source {
    margin-bottom: 15px;
    padding: 15px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }
  
  .source-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .source-name, .source-path {
    display: flex;
    flex-direction: column;
  }
  
  .source-name label, .source-path label {
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
  }
  
  .source-actions {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
</style>
