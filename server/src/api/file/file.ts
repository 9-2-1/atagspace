import * as dbfunc from '../../db';

export function list(parentId: bigint | null): dbfunc.file.File[] {
  return dbfunc.file.list(parentId);
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
