import * as file from '../db/file';
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const FileCreateZ = z.object({
  parentId: z.number().nullable(),
  name: z.string(),
  isDir: z.number(),
});

const FileMoveRenameZ = z.object({
  id: z.number(),
  parentId: z.number().nullable(),
  name: z.string(),
});

export default router({
  list: publicProcedure.input(z.number().nullable()).query(opts => file.list(opts.input)),
  list_recursive: publicProcedure
    .input(z.number().nullable())
    .query(opts => file.list_recursive(opts.input)),
  get: publicProcedure.input(z.number()).query(opts => file.get(opts.input)),
  delete: publicProcedure.input(z.number()).mutation(opts => file.delete(opts.input)),
  delete_recursive: publicProcedure
    .input(z.number())
    .mutation(opts => file.delete_recursive(opts.input)),
  create: publicProcedure.input(FileCreateZ).mutation(opts => file.create(opts.input)),
  move_rename: publicProcedure
    .input(FileMoveRenameZ)
    .mutation(opts => file.move_rename(opts.input)),
});
