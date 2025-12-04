import * as checksum from '../db/checksum';
import * as z from 'zod';
import { fn, tree } from '../utils/apitype';

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

const apidef = tree({
  set: fn(FileCheckSumZ, checksum.set),
  touch_time: fn(z.number(), checksum.touch_time),
  get: fn(FileQueryZ, checksum.get),
});

export default apidef;
