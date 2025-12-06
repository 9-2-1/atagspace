import type { Response } from 'express';

class HangUpError extends Error {
  constructor() {
    super('Progress stream closed');
  }
}

export async function webprogress<State, Result>(
  initState: State,
  threshold: number = 16,
  res: Response,
  fn: (update: (state: State) => void) => Promise<Result>
) {
  let lastUpdate = 0;
  let closed = false;
  function update(state: State) {
    if (closed) {
      throw new HangUpError();
    }
    initState = state;
    const now = Date.now();
    if (now - lastUpdate >= threshold) {
      lastUpdate = now;
      res.write(`data: ${JSON.stringify(state)}\n\n`);
    }
  }
  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.on('close', () => {
    closed = true;
    res.end();
  });
  try {
    res.write(`data: ${JSON.stringify(initState)}\n\n`);
    const result = await fn(update);
    res.write(`event: end\ndata: ${JSON.stringify(result)}\n\n`);
  } finally {
    if (!closed) {
      res.end();
    }
  }
}
