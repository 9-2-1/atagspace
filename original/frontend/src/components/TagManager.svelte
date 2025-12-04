<script lang="ts">
  import { onMount } from 'svelte';
  import { trpc } from '../trpc/client';
  import type { Category } from '../../../backend/src/db/models/CategoryTag';

  // 状态管理
  let state = {
    categories: [] as Category[],
    loading: true,
    error: '',
    newCategory: { name: '', color: '#ffffff' },
    newTag: { name: '', category: '' },
  };

  // 加载分类和标签
  onMount(async () => {
    await loadCategories();
  });

  async function loadCategories() {
    try {
      state.loading = true;
      state.categories = await trpc.listCategories.query();
      state.error = '';
    } catch (e) {
      state.error = 'Failed to load categories';
      console.error(e);
    } finally {
      state.loading = false;
    }
  }

  // 添加分类
  async function addCategory() {
    if (!state.newCategory.name.trim()) {
      return;
    }

    try {
      await trpc.addCategory.mutate({
        name: state.newCategory.name,
        color: state.newCategory.color,
      });
      await loadCategories();
      state.newCategory = { name: '', color: '#ffffff' };
    } catch (e) {
      state.error = 'Failed to add category';
      console.error(e);
    }
  }

  // 添加标签
  async function addTag() {
    if (!state.newTag.name.trim() || !state.newTag.category) {
      return;
    }

    try {
      await trpc.addTag.mutate({ name: state.newTag.name, category: state.newTag.category });
      await loadCategories();
      state.newTag.name = '';
    } catch (e) {
      state.error = 'Failed to add tag';
      console.error(e);
    }
  }

  // 删除标签
  async function deleteTag(tagName: string) {
    try {
      await trpc.deleteTag.mutate(tagName);
      await loadCategories();
    } catch (e) {
      state.error = 'Failed to delete tag';
      console.error(e);
    }
  }

  // 删除分类
  async function deleteCategory(categoryName: string) {
    try {
      await trpc.deleteCategory.mutate(categoryName);
      await loadCategories();
    } catch (e) {
      state.error = 'Failed to delete category';
      console.error(e);
    }
  }
</script>

<div class="tag-manager">
  <h2>Tag Manager</h2>

  {#if state.error}
    <div class="error">{state.error}</div>
  {/if}

  <!-- 添加分类 -->
  <div class="section">
    <h3>Add Category</h3>
    <div class="input-group">
      <input type="text" placeholder="Category name" bind:value={state.newCategory.name} />
      <input type="color" bind:value={state.newCategory.color} />
      <button on:click={addCategory}>Add</button>
    </div>
  </div>

  <!-- 添加标签 -->
  <div class="section">
    <h3>Add Tag</h3>
    <div class="input-group">
      <input type="text" placeholder="Tag name" bind:value={state.newTag.name} />
      <select bind:value={state.newTag.category}>
        <option value="">Select category</option>
        {#each state.categories as category}
          <option value={category.name}>{category.name}</option>
        {/each}
      </select>
      <button on:click={addTag}>Add</button>
    </div>
  </div>

  <!-- 分类和标签列表 -->
  <div class="section">
    <h3>Categories & Tags</h3>
    {#if state.loading}
      <div>Loading...</div>
    {:else}
      <div class="categories">
        {#each state.categories as category}
          <div class="category">
            <div class="category-header">
              <div class="category-info" style="background-color: {category.color || '#ffffff'}">
                <strong>{category.name}</strong>
                <span class="tag-count">({category.tags.length} tags)</span>
              </div>
              <button class="delete-btn" on:click={() => deleteCategory(category.name)}
                >Delete</button
              >
            </div>
            <div class="tags">
              {#each category.tags as tag}
                <div class="tag-item">
                  <span class="tag-name">{tag.name}</span>
                  <button class="delete-btn" on:click={() => deleteTag(tag.name)}>×</button>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .tag-manager {
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

  input[type='text'],
  select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    flex: 1;
  }

  input[type='color'] {
    width: 50px;
    height: 36px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }

  button {
    padding: 8px 16px;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background: #45a049;
  }

  .delete-btn {
    background: #f44336;
    padding: 4px 8px;
    font-size: 14px;
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

  .categories {
    margin-top: 15px;
  }

  .category {
    margin-bottom: 20px;
    padding: 15px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .category-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .tag-count {
    font-size: 12px;
    color: #666;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .tag-item {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: #e3f2fd;
    border-radius: 16px;
    font-size: 14px;
  }

  .tag-name {
    color: #1976d2;
  }
</style>
