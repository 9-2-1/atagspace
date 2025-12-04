import * as file_tag from '../db/file_tag';
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const fileTagZ = z.object({ fileId: z.number(), tagId: z.number() });

export default router({
  add: publicProcedure.input(fileTagZ).mutation(opts => file_tag.add(opts.input)),
  delete: publicProcedure.input(fileTagZ).mutation(opts => file_tag.delete(opts.input)),
  clear: publicProcedure.input(z.number()).mutation(opts => file_tag.clear(opts.input)),
});
