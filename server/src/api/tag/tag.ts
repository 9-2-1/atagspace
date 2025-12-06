import * as dbfunc from '../../db';

export function add(name: string, categoryId: bigint) {
  dbfunc.tag.create({ name, categoryId, background: null, foreground: null, description: null });
}
export function rename(tagId: bigint, name: string) {
  dbfunc.tag.rename(tagId, name);
}
export function move(tagId: bigint, categoryId: bigint | null) {
  dbfunc.tag.move(tagId, categoryId);
}
function delete_(tagId: bigint) {
  dbfunc.tag.delete(tagId);
}
export { delete_ as delete };
export function list(categoryId: bigint | null): dbfunc.tag.Tag[] {
  return dbfunc.tag.list(categoryId);
}
export function color(tagId: bigint, foreground: string | null, background: string | null) {
  dbfunc.tag.color(tagId, foreground, background);
}
export function describe(tagId: bigint, description: string | null) {
  dbfunc.tag.describe(tagId, description);
}
