import * as source from '../db/source';
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const SourceZ = z.object({ name: z.string(), path: z.string() });

export default router({
  list: publicProcedure.input(z.void()).query(() => source.list()),
  add: publicProcedure.input(SourceZ).mutation(opts => source.add(opts.input)),
  delete: publicProcedure.input(z.string()).mutation(opts => source.delete(opts.input)),
});
