import * as tag from '../db/tag';
import * as z from 'zod';
import { fn, tree } from '../utils/apitype';

const TagColorZ = z.object({
  tagId: z.number(),
  forecolor: z.string().nullable().optional(),
  backcolor: z.string().nullable().optional(),
});

const apidef = tree({
  get: fn(z.number(), tag.get),
  named: fn(z.string(), tag.named),
  remove: fn(z.number(), tag.remove),
  color: fn(TagColorZ, tag.color),
});

export default apidef;
