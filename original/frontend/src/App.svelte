<script lang="ts">
  import { onMount } from 'svelte';
  import TagManager from './components/TagManager.svelte';
  import SourceManager from './components/SourceManager.svelte';
  import MoveRuleManager from './components/MoveRuleManager.svelte';
  import { trpc } from './trpc/client';

  // 状态管理
  let state = {
    scanStatus: {
      running: false,
      progress: 0,
      totalFiles: 0,
      scannedFiles: 0,
      currentFile: '',
      startTime: 0,
      endTime: null,
    },
    moveStatus: {
      running: false,
      progress: 0,
      totalFiles: 0,
      movedFiles: 0,
      currentFile: '',
      startTime: 0,
      endTime: null,
    },
  };

  // 定期更新状态
  let statusInterval: number;

  onMount(() => {
    // 每秒更新一次状态
    statusInterval = window.setInterval(async () => {
      await updateStatus();
    }, 1000);

    return () => {
      clearInterval(statusInterval);
    };
  });

  async function updateStatus() {
    try {
      state.scanStatus = await trpc.getScanStatus.query();
      state.moveStatus = await trpc.getMoveStatus.query();
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  }

  // 开始扫描
  async function startScan() {
    try {
      await trpc.startScan.mutate({ fullScan: false });
      await updateStatus();
    } catch (e) {
      console.error('Failed to start scan:', e);
    }
  }

  // 停止扫描
  async function stopScan() {
    try {
      await trpc.stopScan.mutate();
      await updateStatus();
    } catch (e) {
      console.error('Failed to stop scan:', e);
    }
  }

  // 开始移动
  async function startMove() {
    try {
      await trpc.startMove.mutate();
      await updateStatus();
    } catch (e) {
      console.error('Failed to start move:', e);
    }
  }

  // 停止移动
  async function stopMove() {
    try {
      await trpc.stopMove.mutate();
      await updateStatus();
    } catch (e) {
      console.error('Failed to stop move:', e);
    }
  }
</script>

<div>
  <h1>atagspace - File Tagging and Management Tool</h1>

  <!-- 扫描和移动控制 -->
  <div class="controls">
    <div class="control-section">
      <h2>Scan Control</h2>
      <div class="control-buttons">
        <button class="primary-btn" on:click={startScan} disabled={state.scanStatus.running}>
          Start Scan
        </button>
        <button class="secondary-btn" on:click={stopScan} disabled={!state.scanStatus.running}>
          Stop Scan
        </button>
      </div>
      {#if state.scanStatus.running || state.scanStatus.endTime}
        <div class="progress-section">
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${state.scanStatus.progress}%"></div>
          </div>
          <div class="progress-info">
            <span>{state.scanStatus.scannedFiles} / {state.scanStatus.totalFiles} files</span>
            <span>{state.scanStatus.progress}%</span>
          </div>
          <div class="current-file">
            {state.scanStatus.currentFile}
          </div>
        </div>
      {/if}
    </div>

    <div class="control-section">
      <h2>Move Control</h2>
      <div class="control-buttons">
        <button class="primary-btn" on:click={startMove} disabled={state.moveStatus.running}>
          Start Move
        </button>
        <button class="secondary-btn" on:click={stopMove} disabled={!state.moveStatus.running}>
          Stop Move
        </button>
      </div>
      {#if state.moveStatus.running || state.moveStatus.endTime}
        <div class="progress-section">
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${state.moveStatus.progress}%"></div>
          </div>
          <div class="progress-info">
            <span>{state.moveStatus.movedFiles} / {state.moveStatus.totalFiles} files</span>
            <span>{state.moveStatus.progress}%</span>
          </div>
          <div class="current-file">
            {state.moveStatus.currentFile}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- 管理组件 -->
  <div class="managers">
    <SourceManager />
    <TagManager />
    <MoveRuleManager />
  </div>
</div>

<style>
  body {
    font-family: Arial, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f0f0f0;
  }

  h1 {
    color: #333;
    font-size: 2rem;
    margin-bottom: 2rem;
    text-align: center;
  }

  .controls {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }

  .control-section {
    flex: 1;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .control-section h2 {
    margin-top: 0;
    color: #333;
    font-size: 1.2rem;
    margin-bottom: 15px;
  }

  .control-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
  }

  .primary-btn {
    background: #4caf50;
    color: white;
  }

  .primary-btn:hover {
    background: #45a049;
  }

  .secondary-btn {
    background: #f44336;
    color: white;
  }

  .secondary-btn:hover {
    background: #da190b;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .progress-section {
    margin-top: 15px;
  }

  .progress-bar-container {
    width: 100%;
    height: 20px;
    background: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
  }

  .progress-bar {
    height: 100%;
    background: #4caf50;
    transition: width 0.3s ease;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
  }

  .current-file {
    font-size: 12px;
    color: #888;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .managers {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  @media (max-width: 768px) {
    .controls {
      flex-direction: column;
    }
  }
</style>
