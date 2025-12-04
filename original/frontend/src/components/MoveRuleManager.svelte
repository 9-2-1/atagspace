<script lang="ts">
  import { onMount } from 'svelte';
  import { trpc } from '../trpc/client';
  import type { MoveRule } from '../../../backend/src/db/models/MoveRule';

  // 状态管理
  let state = {
    rules: [] as MoveRule[],
    loading: true,
    error: '',
    newRule: {
      name: '',
      conditions: '',
      targetPath: '',
      enabled: true
    }
  };

  // 加载移动规则
  onMount(async () => {
    await loadRules();
  });

  async function loadRules() {
    try {
      state.loading = true;
      state.rules = await trpc.listMoveRules.query();
      state.error = '';
    } catch (e) {
      state.error = 'Failed to load move rules';
      console.error(e);
    } finally {
      state.loading = false;
    }
  }

  // 添加移动规则
  async function addRule() {
    if (!state.newRule.name.trim() || !state.newRule.conditions.trim() || !state.newRule.targetPath.trim()) {
      return;
    }

    try {
      await trpc.addMoveRule.mutate({
        name: state.newRule.name,
        conditions: state.newRule.conditions,
        targetPath: state.newRule.targetPath,
        enabled: state.newRule.enabled
      });
      await loadRules();
      state.newRule = {
        name: '',
        conditions: '',
        targetPath: '',
        enabled: true
      };
    } catch (e) {
      state.error = 'Failed to add move rule';
      console.error(e);
    }
  }

  // 更新移动规则
  async function updateRule(rule: MoveRule) {
    try {
      await trpc.updateMoveRule.mutate({
        id: rule.id,
        name: rule.name,
        conditions: rule.conditions,
        targetPath: rule.targetPath,
        enabled: rule.enabled
      });
      await loadRules();
    } catch (e) {
      state.error = 'Failed to update move rule';
      console.error(e);
    }
  }

  // 删除移动规则
  async function deleteRule(id: number) {
    try {
      await trpc.deleteMoveRule.mutate(id);
      await loadRules();
    } catch (e) {
      state.error = 'Failed to delete move rule';
      console.error(e);
    }
  }

  // 切换规则启用状态
  async function toggleRule(rule: MoveRule) {
    try {
      await trpc.toggleMoveRule.mutate({
        id: rule.id,
        enabled: !rule.enabled
      });
      await loadRules();
    } catch (e) {
      state.error = 'Failed to toggle move rule';
      console.error(e);
    }
  }
</script>

<div class="move-rule-manager">
  <h2>Move Rules</h2>
  
  {#if state.error}
    <div class="error">{state.error}</div>
  {/if}

  <!-- 添加移动规则 -->
  <div class="section">
    <h3>Add Move Rule</h3>
    <div class="input-group">
      <input 
        type="text" 
        placeholder="Rule name" 
        bind:value={state.newRule.name}
      />
      <input 
        type="text" 
        placeholder="Conditions (e.g., +tag1 +tag2)" 
        bind:value={state.newRule.conditions}
      />
      <input 
        type="text" 
        placeholder="Target path" 
        bind:value={state.newRule.targetPath}
      />
      <label class="checkbox-label">
        <input 
          type="checkbox" 
          bind:checked={state.newRule.enabled}
        />
        Enabled
      </label>
      <button on:click={addRule}>Add</button>
    </div>
  </div>

  <!-- 移动规则列表 -->
  <div class="section">
    <h3>Move Rules List</h3>
    {#if state.loading}
      <div>Loading...</div>
    {:else}
      <div class="rules">
        {#each state.rules as rule}
          <div class="rule">
            <div class="rule-info">
              <div class="rule-header">
                <div class="rule-name">
                  <input 
                    type="text" 
                    bind:value={rule.name}
                    placeholder="Rule name"
                  />
                </div>
                <div class="rule-toggle">
                  <button 
                    class={`toggle-btn ${rule.enabled ? 'enabled' : 'disabled'}`}
                    on:click={() => toggleRule(rule)}
                  >
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
              <div class="rule-conditions">
                <input 
                  type="text" 
                  bind:value={rule.conditions}
                  placeholder="Conditions"
                />
              </div>
              <div class="rule-target">
                <input 
                  type="text" 
                  bind:value={rule.target_path}
                  placeholder="Target path"
                />
              </div>
            </div>
            <div class="rule-actions">
              <button class="save-btn" on:click={() => updateRule(rule)}>Save</button>
              <button class="delete-btn" on:click={() => deleteRule(rule.id)}>Delete</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .move-rule-manager {
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
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .input-group input[type="text"] {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    flex: 1;
    min-width: 200px;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px;
    cursor: pointer;
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
  
  .toggle-btn {
    padding: 4px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .toggle-btn.enabled {
    background: #4CAF50;
    color: white;
  }
  
  .toggle-btn.disabled {
    background: #f5f5f5;
    color: #666;
  }
  
  .error {
    color: red;
    margin-bottom: 15px;
    padding: 10px;
    background: #ffebee;
    border-radius: 4px;
  }
  
  .rules {
    margin-top: 15px;
  }
  
  .rule {
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
  
  .rule-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .rule-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .rule-name {
    flex: 1;
  }
  
  .rule-conditions, .rule-target {
    display: flex;
    flex-direction: column;
  }
  
  .rule-actions {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
</style>
