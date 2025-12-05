export default async function cliprogress<State, Result>(
  initState: State,
  threshold: number = 16,
  fn: (update: (state: State) => void) => Promise<Result>,
  format: (state: State) => string
) {
  let lastUpdate = 0;
  function update(state: State, force: boolean = false) {
    initState = state;
    const now = Date.now();
    if (now - lastUpdate >= threshold || force) {
      lastUpdate = now;
      process.stdout.write(`${format(state)}\x1b[J\r`);
    }
  }
  update(initState as State, true);
  const result = await fn(update);
  update(initState, true);
  process.stdout.write('\n');
  return result;
}
