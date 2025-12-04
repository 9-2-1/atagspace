import * as file_deleted from '../db/file_deleted';
import * as z from 'zod';
import { fn, tree } from '../utils/apitype';

const DeletedFileChecksumCreateZ = z.object({
  size: z.number(),
  checksum: z.string(),
  deleteTime: z.number(),
});

const apidef = tree({
  add: fn(DeletedFileChecksumCreateZ, file_deleted.add),
  find: fn(z.string(), file_deleted.find),
  delete: fn(z.number(), file_deleted.delete),
});

export default apidef;
