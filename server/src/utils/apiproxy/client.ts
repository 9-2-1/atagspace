function noop() {}

async function callapi(path: string, ...args: unknown[]) {
  const res = await fetch(path, { method: 'POST', body: JSON.stringify(args) });
  const ret = await res.json();
  if (ret.error) {
    throw new Error(ret.error);
  }
  return ret.result;
}

export function APIproxy(path: string): unknown {
  return new Proxy(noop, {
    get(target, prop, receiver) {
      if (typeof prop === 'symbol') {
        return Reflect.get(target, prop, receiver);
      }
      console.log('get', path, prop);
      return APIproxy(`${path}/${prop}`);
    },
    apply(target, thisArg, argumentsList) {
      return callapi(path, ...argumentsList);
    },
  });
}
