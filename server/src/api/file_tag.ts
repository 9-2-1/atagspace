import * as file_tag from '../db/file_tag';
import * as z from 'zod';
import { fn, tree } from '../utils/apitype';

const fileTagZ = z.object({ fileId: z.number(), tagId: z.number() });
const apidef = tree({
  add: fn(fileTagZ, file_tag.add),
  delete: fn(fileTagZ, file_tag.delete),
  clear: fn(z.number(), file_tag.clear),
});

export default apidef;
