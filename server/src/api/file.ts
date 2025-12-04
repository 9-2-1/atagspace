import * as file from '../db/file';
import * as z from 'zod';
import { fn, tree } from '../utils/apitype';

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

const apidef = tree({
  list: fn(z.number().nullable(), file.list),
  list_recursive: fn(z.number().nullable(), file.list_recursive),
  get: fn(z.number(), file.get),
  delete: fn(z.number(), file.delete),
  delete_recursive: fn(z.number(), file.delete_recursive),
  create: fn(FileCreateZ, file.create),
  move_rename: fn(FileMoveRenameZ, file.move_rename),
});

export default apidef;
