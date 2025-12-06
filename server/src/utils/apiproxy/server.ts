import type { Router } from 'express';

type APIfunc = (...args: unknown[]) => unknown;
export type APIdef = APIfunc | { [key in string]: APIdef };

export function registerAPIs(router: Router, path: string, apiDef: APIdef) {
  if (typeof apiDef === 'function') {
    console.log('registerAPI', path);
    router.post(path, async (req, res) => {
      try {
        const ret = await apiDef(...req.body);
        res.json({ result: ret });
      } catch (err) {
        if (err instanceof Error) {
          res.status(500).json({ error: err.message });
        } else {
          res.status(500).json({ error: 'Unknown error' });
        }
      }
    });
  } else {
    for (const [name, def] of Object.entries(apiDef)) {
      registerAPIs(router, `${path}/${name}`, def);
    }
  }
}
