import * as file_deleted from '../db/file_deleted';
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const DeletedFileChecksumCreateZ = z.object({
  size: z.number(),
  checksum: z.string(),
  deleteTime: z.number(),
});

export default router({
  add: publicProcedure
    .input(DeletedFileChecksumCreateZ)
    .mutation(opts => file_deleted.add(opts.input)),
  find: publicProcedure.input(z.string()).query(opts => file_deleted.find(opts.input)),
  delete: publicProcedure.input(z.number()).mutation(opts => file_deleted.delete(opts.input)),
});
