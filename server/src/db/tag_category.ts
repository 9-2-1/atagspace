import { db } from './_db';

db.exec(
  [
    'CREATE TABLE IF NOT EXISTS category (',
    ' id INTEGER NOT NULL PRIMARY KEY,',
    ' name TEXT NOT NULL,',
    ' background TEXT, ', // background color (nullable)
    ' foreground TEXT, ', // foreground color (nullable)
    ' description TEXT ', // tag description
    ');',
    'CREATE UNIQUE INDEX IF NOT EXISTS category_name ON category (name);',
  ].join('\n')
);

export type Category = {
  id: bigint;
  name: string;
  background: string | null; // background color (nullable)
  foreground: string | null; // foreground color (nullable)
  description: string | null; // tag description
};

export type CategoryCreate = Omit<Category, 'id'>;
const createStatement = db
  .prepare<CategoryCreate, bigint>(
    [
      'INSERT INTO category', // format expand
      ' (name, background, foreground, description)',
      ' VALUES',
      ` (:name, :background, :foreground, :description)`,
      ' RETURNING id',
    ].join('\n')
  )
  .pluck();
export function create(category: CategoryCreate): bigint {
  return createStatement.get(category)!;
}

export type CategoryUpdate = Category;
const updateStatement = db.prepare<CategoryUpdate, void>(
  [
    'UPDATE category SET', // format expand
    ' name = :name,',
    ' background = :background,',
    ' foreground = :foreground,',
    ' description = :description,',
    ' WHERE id = :id',
  ].join('\n')
);
export function update(category: CategoryUpdate): void {
  updateStatement.run(category);
}

const getStatement = db.prepare<Pick<Category, 'id'>, Category>(
  'SELECT * FROM category WHERE id = :id'
);
export function get(id: bigint): Category | null {
  return getStatement.get({ id }) ?? null;
}

const getByNameStatement = db.prepare<Pick<Category, 'name'>, Category>(
  'SELECT * FROM category WHERE name = :name'
);
export function getByName(name: string): Category | null {
  return getByNameStatement.get({ name }) ?? null;
}

const renameStatement = db.prepare<Pick<Category, 'id' | 'name'>, void>(
  'UPDATE category SET name = :name WHERE id = :id'
);
export function rename(id: bigint, name: string): void {
  renameStatement.run({ id, name });
}

const descStatement = db.prepare<Pick<Category, 'id' | 'description'>, void>(
  'UPDATE category SET description = :description WHERE id = :id'
);
export function describe(id: bigint, description: string | null): void {
  descStatement.run({ id, description });
}

const colorStatement = db.prepare<Pick<Category, 'id' | 'background' | 'foreground'>, void>(
  'UPDATE category SET background = :background, foreground = :foreground WHERE id = :id'
);
export function color(id: bigint, background: string | null, foreground: string | null): void {
  colorStatement.run({ id, background, foreground });
}

const deleteStatement = db.prepare<Pick<Category, 'id'>, void>(
  'DELETE FROM category WHERE id = :id'
);
function delete_(id: bigint): void {
  deleteStatement.run({ id });
}
export { delete_ as delete };

const listStatement = db.prepare<[], Category>('SELECT * FROM category');
export function list(): Category[] {
  return listStatement.all();
}
