import * as dbfunc from '../../db';
import * as file_tag from './tag';
import type { TagCategory } from './tag';

export type FileTag = dbfunc.file.File & { tags: TagCategory[] };

export function list(parentId: bigint | null): FileTag[] {
  return dbfunc.file.list(parentId).map(file => ({ ...file, tags: file_tag.list(file.id) }));
}

export function describe(fileId: bigint, description: string | null) {
  dbfunc.file.describe(fileId, description);
}

import open from 'open';
import { getRealPath } from '../../utils/file/path';

export async function openFile(fileId: bigint) {
  const realPath = getRealPath(fileId);
  await open(realPath);
}

/// search
/// NOT

export type Condition = string;
// Glob
// PathGlob
// Tag
// Cate
// Not(.)
// And(...)
// Or(...)
// NameIn
// DescIn
// TagIn
// AnyIn

/*
export function search(condition: Condition, parentId: bigint | null): dbfunc.file.File[] {
  return [];
  // return dbfunc.file.search(condition);
}
*/
