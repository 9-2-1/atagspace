import { db } from './_db';

db.exec(
  [
    'CREATE TABLE IF NOT EXISTS tag (',
    ' id INTEGER NOT NULL PRIMARY KEY,',
    ' categoryId INTEGER,', // nullable
    ' name TEXT NOT NULL,',
    ' background TEXT, ', // background color (nullable)
    ' foreground TEXT, ', // foreground color (nullable)
    ' description TEXT, ', // tag description
    ' FOREIGN KEY (categoryId) REFERENCES category(id) ON DELETE CASCADE',
    ');',
    'CREATE UNIQUE INDEX IF NOT EXISTS tag_name ON tag (name);',
    'CREATE INDEX IF NOT EXISTS tag_categoryId ON tag (categoryId);',
  ].join('\n')
);

export * as category from './tag_category';

export type Tag = {
  id: bigint;
  categoryId: bigint | null;
  name: string;
  background: string | null; // background color (nullable)
  foreground: string | null; // foreground color (nullable)
  description: string | null; // tag description
};

export type TagCreate = Omit<Tag, 'id'>;
const createStatement = db
  .prepare<TagCreate, bigint>(
    [
      'INSERT INTO tag', // format expand
      ' (categoryId, name, background, foreground, description)',
      ' VALUES',
      ` (:categoryId, :name, :background, :foreground, :description)`,
      ' RETURNING id',
    ].join('\n')
  )
  .pluck();
export function create(tag: TagCreate): bigint {
  return createStatement.get(tag)!;
}

export type TagUpdate = Tag;
const updateStatement = db.prepare<TagUpdate, void>(
  [
    'UPDATE tag SET', // format expand
    ' categoryId = :categoryId,',
    ' name = :name,',
    ' background = :background,',
    ' foreground = :foreground,',
    ' description = :description',
    ' WHERE id = :id',
  ].join('\n')
);
export function update(tag: TagUpdate): void {
  updateStatement.run(tag);
}

const getStatement = db.prepare<Pick<Tag, 'id'>, Tag>('SELECT * FROM tag WHERE id = :id');
export function get(id: bigint): Tag | null {
  return getStatement.get({ id }) ?? null;
}

const getByNameStatement = db.prepare<Pick<Tag, 'name'>, Tag>(
  'SELECT * FROM tag WHERE name = :name'
);
export function getByName(name: string): Tag | null {
  return getByNameStatement.get({ name }) ?? null;
}

const moveStatement = db.prepare<Pick<Tag, 'id' | 'categoryId'>, void>(
  'UPDATE tag SET categoryId = :categoryId WHERE id = :id'
);
export function move(id: bigint, categoryId: bigint | null): void {
  moveStatement.run({ id, categoryId });
}

const renameStatement = db.prepare<Pick<Tag, 'id' | 'name'>, void>(
  'UPDATE tag SET name = :name WHERE id = :id'
);
export function rename(id: bigint, name: string): void {
  renameStatement.run({ id, name });
}

const descStatement = db.prepare<Pick<Tag, 'id' | 'description'>, void>(
  'UPDATE tag SET description = :description WHERE id = :id'
);
export function describe(id: bigint, description: string | null): void {
  descStatement.run({ id, description });
}

const colorStatement = db.prepare<Pick<Tag, 'id' | 'background' | 'foreground'>, void>(
  'UPDATE tag SET background = :background, foreground = :foreground WHERE id = :id'
);
export function color(id: bigint, background: string | null, foreground: string | null): void {
  colorStatement.run({ id, background, foreground });
}

const deleteStatement = db.prepare<Pick<Tag, 'id'>, void>('DELETE FROM tag WHERE id = :id');
function delete_(id: bigint): void {
  deleteStatement.run({ id });
}
export { delete_ as delete };

const listStatement = db.prepare<Pick<Tag, 'categoryId'>, Tag>(
  'SELECT * FROM tag WHERE categoryId IS :categoryId'
);
export function list(categoryId: bigint | null): Tag[] {
  return listStatement.all({ categoryId });
}

const listAllStatement = db.prepare<[], Tag>('SELECT * FROM tag');
export function listAll(): Tag[] {
  return listAllStatement.all();
}
