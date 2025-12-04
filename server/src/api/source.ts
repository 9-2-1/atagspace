import * as source from '../db/source';
import * as z from 'zod';
import { fn, tree } from '../utils/apitype';

const SourceZ = z.object({ name: z.string(), path: z.string() });

const apidef = tree({
  list: fn(z.void(), source.list),
  add: fn(SourceZ, source.add),
  delete: fn(z.string(), source.delete),
});

export default apidef;
