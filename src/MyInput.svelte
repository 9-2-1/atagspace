<script lang="ts">
  let inputElement: HTMLInputElement | null = $state(null);
  let value: string | null = $state(null);
  let focused: boolean = $state(false);

  let {
    defaultValue,
    onenter,
  }: { defaultValue: string; onenter: (value: string) => Promise<void> } = $props();

  function isnull(str: string | null, defaultStr: string): string {
    return str ?? defaultStr;
  }
</script>

<input
  style:--color={isnull(value, '') === isnull(defaultValue, '') ? '#0088ee' : '#ee8800'}
  bind:focused
  {defaultValue}
  bind:this={inputElement}
  bind:value
  onkeydown={async event => {
    if (event.key === 'Enter') {
      await onenter(value ?? '');
      value = defaultValue;
    }
  }}
/>

<style>
  input {
    border: 1px dashed var(--color);
    outline: none;
    background-color: transparent;
    color: var(--color);
    margin: 2px;
  }
</style>
