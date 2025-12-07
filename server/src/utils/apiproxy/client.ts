import * as devalue from 'devalue';

function noop() {}

async function callapi(path: string, ...args: unknown[]) {
  const res = await fetch(path, {
    method: 'POST',
    body: devalue.stringify(Array.from(args)),
    headers: { 'Content-Type': 'application/json' },
  });
  const ret = devalue.unflatten(await res.json());
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
      return APIproxy(`${path}/${prop}`);
    },
    apply(target, thisArg, argumentsList) {
      return callapi(path, ...argumentsList);
    },
  });
}
