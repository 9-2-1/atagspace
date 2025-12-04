import * as file from '../db/file';
import { Router } from 'express';
import * as z from 'zod';
import fastPostApi from '../utils/fastPostApi';

const router = Router();
export default router;

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

fastPostApi(router, '/list', z.number().nullable(), file.list);
fastPostApi(router, '/list_recursive', z.number().nullable(), file.list_recursive);
fastPostApi(router, '/get', z.number(), file.get);
fastPostApi(router, '/delete', z.number(), file.delete);
fastPostApi(router, '/delete_recursive', z.number(), file.delete_recursive);
fastPostApi(router, '/create', FileCreateZ, file.create);
fastPostApi(router, '/move_rename', FileMoveRenameZ, file.move_rename);
