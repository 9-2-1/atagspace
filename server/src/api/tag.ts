import * as tag from '../db/tag';
import { Router } from 'express';
import * as z from 'zod';
import fastPostApi from '../utils/fastPostApi';

const router = Router();
export default router;

const TagColorZ = z.object({
  tagId: z.number(),
  forecolor: z.string().nullable().optional(),
  backcolor: z.string().nullable().optional(),
});

fastPostApi(router, '/get', z.number(), tag.get);
fastPostApi(router, '/named', z.string(), tag.named);
fastPostApi(router, '/remove', z.number(), tag.remove);
fastPostApi(router, '/color', TagColorZ, tag.color);
