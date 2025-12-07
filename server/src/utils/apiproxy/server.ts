import type { Router } from 'express';
import * as devalue from 'devalue';

type APIfunc = (...args: unknown[]) => unknown;
export type APIdef = APIfunc | { [key in string]: APIdef };

export type BeAwait<T> = T extends (...args: infer Args) => infer Ret
  ? (...args: Args) => Promise<Awaited<Ret>>
  : T extends { [key in string]: unknown }
    ? { [key in keyof T]: BeAwait<T[key]> }
    : T;

export function registerAPIs(router: Router, path: string, apiDef: APIdef) {
  if (typeof apiDef === 'function') {
    router.post(path, async (req, res) => {
      let status = 200;
      let ret: unknown = {};
      try {
        const args = devalue.unflatten(req.body);
        const retn = await apiDef(...args);
        ret={ result: retn }
      } catch (err) {
        console.error(err);
          status = 500;
        if (err instanceof Error) {
          ret = { error: err.message };
        } else {
          ret = { error: 'Unknown error' };
        }
      }
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.write(devalue.stringify(ret));
        res.end();
    });
  } else {
    for (const [name, def] of Object.entries(apiDef)) {
      registerAPIs(router, `${path}/${name}`, def);
    }
  }
}
