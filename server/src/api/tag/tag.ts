import * as dbfunc from '../../db';

export function add(name: string, categoryId: bigint) {
  dbfunc.tag.create({ name, categoryId, background: null, foreground: null, description: null });
}
function adds_(names: string[], categoryId: bigint) {
  names.forEach(name => add(name, categoryId));
}
export const adds = dbfunc.transaction(adds_);
export function rename(tagId: bigint, name: string) {
  dbfunc.tag.rename(tagId, name);
}
export function move(tagId: bigint, categoryId: bigint) {
  dbfunc.tag.move(tagId, categoryId);
}
export function moves_(tagIds: bigint[], categoryId: bigint) {
  tagIds.forEach(tagId => move(tagId, categoryId));
}
export const moves = dbfunc.transaction(moves_);
function delete_(tagId: bigint) {
  dbfunc.tag.delete(tagId);
}
export { delete_ as delete };
export function deletes_(tagIds: bigint[]) {
  tagIds.forEach(tagId => delete_(tagId));
}
export const deletes = dbfunc.transaction(deletes_);
export function list(categoryId: bigint): dbfunc.tag.Tag[] {
  return dbfunc.tag.list(categoryId);
}
export function color(tagId: bigint, foreground: string | null, background: string | null) {
  dbfunc.tag.color(tagId, foreground, background);
}
function colors_(tagIds: bigint[], foreground: string | null, background: string | null) {
  tagIds.forEach(tagId => color(tagId, foreground, background));
}
export const colors = dbfunc.transaction(colors_);
export function describe(tagId: bigint, description: string | null) {
  dbfunc.tag.describe(tagId, description);
}
