import * as dbfunc from '../../db';

export function set(fileId: bigint, tagIds: bigint[]) {
  clear(fileId);
  add(fileId, tagIds);
}
export function clear(fileId: bigint) {
  dbfunc.file.tag.deleteAll(fileId);
}
export function add(fileId: bigint, tagIds: bigint[]) {
  tagIds.forEach(tagId => dbfunc.file.tag.add(fileId, tagId));
}
function delete_(fileId: bigint, tagIds: bigint[]) {
  tagIds.forEach(tagId => dbfunc.file.tag.delete(fileId, tagId));
}
export { delete_ as delete };
export function list(fileId: bigint): dbfunc.tag.Tag[] {
  // TODO sql join
  return dbfunc.file.tag.list(fileId).map(tagId => dbfunc.tag.get(tagId)!);
}
