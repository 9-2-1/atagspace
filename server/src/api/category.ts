import * as category from '../db/category';
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const CategoryColorZ = z.object({
  categoryId: z.number(),
  forecolor: z.string().nullable().optional(),
  backcolor: z.string().nullable().optional(),
});

export default router({
  get: publicProcedure.input(z.number()).query(opts => category.get(opts.input)),
  named: publicProcedure.input(z.string()).query(opts => category.named(opts.input)),
  remove: publicProcedure.input(z.number()).mutation(opts => category.remove(opts.input)),
  color: publicProcedure.input(CategoryColorZ).mutation(opts => category.color(opts.input)),
});
