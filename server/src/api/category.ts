import * as category from '../db/category';
import { Router } from 'express';
import * as z from 'zod';
import fastPostApi from '../utils/fastPostApi';

const router = Router();
export default router;

const CategoryColorZ = z.object({
  categoryId: z.number(),
  forecolor: z.string().nullable().optional(),
  backcolor: z.string().nullable().optional(),
});

fastPostApi(router, '/get', z.number(), category.get);
fastPostApi(router, '/named', z.string(), category.named);
fastPostApi(router, '/remove', z.number(), category.remove);
fastPostApi(router, '/color', CategoryColorZ, category.color);
