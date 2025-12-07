<script lang="ts">
  let inputElement: HTMLInputElement | null = $state(null);
  let value: string | null = $state(null);
  let focused: boolean = $state(false);
  let {
    defaultValue,
    onenter,
  }: { defaultValue: string; onenter: (value: string) => Promise<void> } = $props();
</script>

<input
  style:color={value === defaultValue ? 'gray' : focused ? 'black' : 'red'}
  bind:focused
  DefaultValue={defaultValue}
  bind:this={inputElement}
  bind:value
  onkeydown={async event => {
    if (event.key === 'Enter') {
      await onenter(value ?? '');
      value = defaultValue;
    }
  }}
/>
