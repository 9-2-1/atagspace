import { router } from '../trpc';
import category from './category';
import checksum from './checksum';
import file_deleted from './file_deleted';
import file_tag from './file_tag';
import file from './file';
import source from './source';
import tag from './tag';

const appRouter = router({
  category,
  checksum,
  file: router({ ...file._def.procedures, deleted: file_deleted, tag: file_tag }),
  source,
  tag,
});

export type AppRouter = typeof appRouter;
export default appRouter;
