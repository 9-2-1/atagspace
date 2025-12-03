<script lang="ts">
  import { onMount } from 'svelte';

  interface File {
    id: number;
    parentId: number | null;
    name: string;
    description: string | null;
    isDir: number;
  }

  let files = $state<File[]>([]);
  let currentDir = $state<number | null>(0); // 0表示根目录
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function fetchFiles(parentId: number) {
    loading = true;
    error = null;
    try {
      const response = await fetch('/api/file/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const result = await response.json();
      if (result.success) {
        files = result.data;
        currentDir = parentId;
      } else {
        throw new Error('Failed to fetch files');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      loading = false;
    }
  }

  // 处理目录点击
  function handleDirClick(file: File) {
    if (file.isDir === 1) {
      fetchFiles(file.id);
    }
  }

  // 返回上一级目录
  async function goBack() {
    if (currentDir !== 0) {
      try {
        const response = await fetch('/api/file/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: currentDir }),
        });

        if (!response.ok) {
          throw new Error('Failed to get parent directory');
        }

        const result = await response.json();
        if (result.success && result.data.parentId !== null) {
          fetchFiles(result.data.parentId);
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'An unknown error occurred';
      }
    }
  }

  // 初始化时加载根目录文件
  onMount(() => {
    fetchFiles(0);
  });
</script>

<div class="explorer">
  <div class="explorer-header">
    <button onclick={goBack} disabled={currentDir === 0}>
      ← 上一级
    </button>
    <h2>{currentDir === 0 ? '根目录' : '目录'}</h2>
  </div>

  <div class="explorer-content">
    {#if loading}
      <div class="loading">加载中...</div>
    {:else if error}
      <div class="error">{error}</div>
    {:else if files.length === 0}
      <div class="empty">该目录为空</div>
    {:else}
      <ul class="file-list">
        {#each files as file}
          <li
            class={`file-item ${file.isDir === 1 ? 'directory' : 'file'}`}
            onclick={() => handleDirClick(file)}
          >
            <span class="file-icon">{file.isDir === 1 ? '📁' : '📄'}</span>
            <span class="file-name">{file.name}</span>
            {#if file.description}
              <span class="file-description">{file.description}</span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style lang="less">
  .explorer {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .explorer-header {
    display: flex;
    align-items: center;
    padding: 10px;
    background-color: #f0f0f0;
    border-bottom: 1px solid #e0e0e0;
  }

  .explorer-header button {
    margin-right: 10px;
    padding: 5px 10px;
    border: 1px solid #ccc;
    background-color: white;
    border-radius: 4px;
    cursor: pointer;
  }

  .explorer-header button:hover:not(:disabled) {
    background-color: #e0e0e0;
  }

  .explorer-header button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .explorer-header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: normal;
  }

  .explorer-content {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
  }

  .loading,
  .error,
  .empty {
    padding: 20px;
    text-align: center;
    color: #666;
  }

  .error {
    color: #f44336;
  }

  .file-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .file-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 2px;
  }

  .file-item:hover {
    background-color: #f5f5f5;
  }

  .file-item.directory {
    font-weight: bold;
  }

  .file-icon {
    margin-right: 8px;
    font-size: 18px;
  }

  .file-name {
    flex: 1;
  }

  .file-description {
    font-size: 12px;
    color: #666;
    margin-left: 10px;
  }
</style>
