import * as checksum from '../db/checksum';
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const FileQueryZ = z.object({
  path: z.string(),
  dev: z.number(),
  ino: z.number(),
  size: z.number(),
  mtime: z.number(),
});

const FileCheckSumZ = z.object({
  path: z.string(),
  dev: z.number(),
  ino: z.number(),
  size: z.number(),
  mtime: z.number(),
  checksum: z.string(),
});

export default router({
  set: publicProcedure.input(FileCheckSumZ).mutation(opts => checksum.set(opts.input)),
  touch_time: publicProcedure.input(z.number()).mutation(opts => checksum.touch_time(opts.input)),
  get: publicProcedure.input(FileQueryZ).query(opts => checksum.get(opts.input)),
});
