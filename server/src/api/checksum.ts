import * as checksum from '../db/checksum';
import { Router } from 'express';
import * as z from 'zod';
import fastPostApi from '../utils/fastPostApi';

const router = Router();
export default router;

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

fastPostApi(router, '/set', FileCheckSumZ, checksum.set);
fastPostApi(router, '/touch_time', z.number(), checksum.touch_time);
fastPostApi(router, '/get', FileQueryZ, checksum.get);
