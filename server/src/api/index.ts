import category from './category';
import checksum from './checksum';
import file_deleted from './file_deleted';
import file_tag from './file_tag';
import file from './file';
import progress from './progress';
import source from './source';
import tag from './tag';

import { tree } from '../utils/apitype';

const apidef = tree({
  category,
  checksum,
  file: tree({ ...file.items, deleted: file_deleted, tag: file_tag }),
  progress,
  source,
  tag,
});

export default apidef;
