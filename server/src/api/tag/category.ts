import * as dbfunc from '../../db';

export function add(name: string) {
  dbfunc.tag.category.create({ name, background: null, foreground: null, description: null });
}
export function rename(categoryId: bigint, name: string) {
  dbfunc.tag.category.rename(categoryId, name);
}
function delete_(categoryId: bigint) {
  dbfunc.tag.category.delete(categoryId);
}
export { delete_ as delete };
export type CategoryTag = dbfunc.tag.category.Category & { tags: dbfunc.tag.Tag[] };
export function list(): CategoryTag[] {
  return dbfunc.tag.category
    .list()
    .map(category => ({ ...category, tags: dbfunc.tag.list(category.id) }));
}
export function color(categoryId: bigint, foreground: string | null, background: string | null) {
  dbfunc.tag.category.color(categoryId, foreground, background);
}
export function describe(categoryId: bigint, description: string | null) {
  dbfunc.tag.category.describe(categoryId, description);
}
