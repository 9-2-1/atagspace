import * as tag from '../db/tag';
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const TagColorZ = z.object({
  tagId: z.number(),
  forecolor: z.string().nullable().optional(),
  backcolor: z.string().nullable().optional(),
});

export default router({
  get: publicProcedure.input(z.number()).query(opts => tag.get(opts.input)),
  named: publicProcedure.input(z.string()).query(opts => tag.named(opts.input)),
  remove: publicProcedure.input(z.number()).mutation(opts => tag.remove(opts.input)),
  color: publicProcedure.input(TagColorZ).mutation(opts => tag.color(opts.input)),
});
