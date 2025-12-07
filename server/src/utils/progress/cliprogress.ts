export default async function cliprogress<State, Result>(
  initState: State,
  threshold: number = 16,
  fn: (update: (state: State) => void) => Promise<Result>,
  format: (state: State) => string,
  hookConsoleLog: boolean = true
) {
  const originalLog = console.log;
  let rendered = false;
  if (hookConsoleLog) {
    console.log = (...args: unknown[]) => {
      if (rendered) {
        process.stdout.write(`\x1b[J`);
        rendered = false;
      }
      originalLog(...args);
    };
  }
  let lastUpdate = 0;
  function update(state: State, force: boolean = false) {
    initState = state;
    const now = Date.now();
    if (now - lastUpdate >= threshold || force) {
      lastUpdate = now;
      rendered = true;
      process.stdout.write(`\x1b[?7l${format(state)}\x1b[K\r\x1b[?7h`);
    }
  }
  update(initState, true);
  const result = await fn(update);
  update(initState, true);
  process.stdout.write('\n');
  if (hookConsoleLog) {
    console.log = originalLog;
  }
  return result;
}
