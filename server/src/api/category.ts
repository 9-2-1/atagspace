import * as category from '../db/category';
import * as z from 'zod';
import { fn, tree } from '../utils/apitype';

const CategoryColorZ = z.object({
  categoryId: z.number(),
  forecolor: z.string().nullable().optional(),
  backcolor: z.string().nullable().optional(),
});

const apidef = tree({
  get: fn(z.number(), category.get),
  named: fn(z.string(), category.named),
  remove: fn(z.number(), category.remove),
  color: fn(CategoryColorZ, category.color),
});

export default apidef;
