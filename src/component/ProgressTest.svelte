<script lang="ts">
  let isTesting = $state(false);
  let progress = $state(0);
  let messages = $state<string[]>([]);
  let eventSource: EventSource | null = null;

  function startTest() {
    // 重置状态
    isTesting = true;
    progress = 0;
    messages = [];

    // 创建 EventSource 连接
    const url = `api/progress/test`;
    messages.push(`正在连接到 ${url}...`);

    try {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        messages.push('连接已建立');
      };

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          messages.push(data.message || JSON.stringify(data));

          // 尝试从消息中提取进度信息（如果有）
          if (typeof data.progress === 'number') {
            progress = Math.max(0, Math.min(1, data.progress));
          }
        } catch (error) {
          messages.push(`解析数据错误: ${error}`);
        }
      };

      eventSource.addEventListener('end', event => {
        try {
          const result = JSON.parse(event.data);
          messages.push(`测试完成: ${result.message || JSON.stringify(result)}`);
        } catch (error) {
          messages.push(`解析结束数据错误: ${error}`);
        }
        stopTest();
      });

      eventSource.onerror = error => {
        messages.push(`连接错误: ${error.type}`);
        stopTest();
      };
    } catch (error) {
      messages.push(`创建连接失败: ${error}`);
      stopTest();
    }
  }

  function stopTest() {
    isTesting = false;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }
</script>

<div class="progress-test">
  <h2>进度测试</h2>

  <div class="controls">
    <button class="start-button" onclick={startTest} disabled={isTesting}>
      {isTesting ? '测试中...' : '开始测试'}
    </button>
    <button class="stop-button" onclick={stopTest} disabled={!isTesting}> 停止测试 </button>
  </div>

  <div class="progress-section">
    <div class="progress-bar-container">
      <div class="progress-bar" style={`width: ${progress * 100}%`}></div>
    </div>
    <div class="progress-text">
      {Math.round(progress * 100)}%
    </div>
  </div>

  <div class="messages">
    <h3>消息日志</h3>
    <div class="messages-list">
      {#each messages as message, index (index)}
        <div class="message">
          {message}
        </div>
      {/each}
      {#if messages.length === 0}
        <div class="no-messages">暂无消息</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .progress-test {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #f9f9f9;
  }

  h2 {
    color: #333;
    margin-bottom: 20px;
    text-align: center;
  }

  .controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    justify-content: center;
  }

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s;
  }

  .start-button {
    background-color: #4caf50;
    color: white;
  }

  .start-button:hover:not(:disabled) {
    background-color: #45a049;
  }

  .stop-button {
    background-color: #f44336;
    color: white;
  }

  .stop-button:hover:not(:disabled) {
    background-color: #da190b;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .progress-section {
    margin-bottom: 20px;
  }

  .progress-bar-container {
    width: 100%;
    height: 20px;
    background-color: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
  }

  .progress-bar {
    height: 100%;
    background-color: #4caf50;
    transition: width 0.3s ease;
  }

  .progress-text {
    text-align: center;
    font-weight: bold;
    color: #333;
  }

  .messages {
    margin-top: 20px;
  }

  h3 {
    color: #555;
    margin-bottom: 10px;
  }

  .messages-list {
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-family: monospace;
    font-size: 14px;
  }

  .message {
    margin-bottom: 5px;
    padding: 5px;
    border-bottom: 1px solid #f0f0f0;
  }

  .message:last-child {
    border-bottom: none;
  }

  .no-messages {
    text-align: center;
    color: #999;
    padding: 20px;
  }
</style>
