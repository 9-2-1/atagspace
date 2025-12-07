import * as dbfunc from '../../db';

export function sets(fileId: bigint, tagIds: bigint[]) {
  clear(fileId);
  adds(fileId, tagIds);
}
export function clear(fileId: bigint) {
  dbfunc.file.tag.deleteAll(fileId);
}
export function adds(fileId: bigint, tagIds: bigint[]) {
  tagIds.forEach(tagId => dbfunc.file.tag.add(fileId, tagId));
}
function delete_(fileId: bigint, tagIds: bigint[]) {
  tagIds.forEach(tagId => dbfunc.file.tag.delete(fileId, tagId));
}
export { delete_ as deletes };
export type TagCategory = dbfunc.tag.Tag & { category: dbfunc.tag.category.Category };
export function list(fileId: bigint): TagCategory[] {
  // TODO sql join
  return dbfunc.file.tag.list(fileId).map(tagId => {
    const tag = dbfunc.tag.get(tagId)!;
    return { ...tag, category: dbfunc.tag.category.get(tag.categoryId)! };
  });
}
