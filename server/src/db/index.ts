import * as file from './file';
import * as checksum from './checksum';
import * as tag from './tag';
import * as category from './category';

export function init() {
  file.init();
  file.tag.init();
  file.deleted.init();
  checksum.init();
  tag.init();
  category.init();
}

export { file, checksum, tag, category };
