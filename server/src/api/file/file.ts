import * as dbfunc from '../../db';

export type FileTag = dbfunc.file.File & { tags: dbfunc.tag.Tag[] };

export function list(parentId: bigint | null): FileTag[] {
  return dbfunc.file.list(parentId).map((file) => ({
    ...file,
    tags: dbfunc.file.tag.list(file.id).map((tagId) => dbfunc.tag.get(tagId)!),
  }));
}

export function describe(fileId: bigint, description: string | null) {
  dbfunc.file.describe(fileId, description);
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
