import * as file_deleted from '../db/file_deleted';
import { Router } from 'express';
import * as z from 'zod';
import fastPostApi from '../utils/fastPostApi';

const router = Router();
export default router;

const DeletedFileChecksumCreateZ = z.object({
  size: z.number(),
  checksum: z.string(),
  deleteTime: z.number(),
});

fastPostApi(router, '/add', DeletedFileChecksumCreateZ, file_deleted.add);
fastPostApi(router, '/find', z.string(), file_deleted.find);
fastPostApi(router, '/delete', z.number(), file_deleted.delete);
