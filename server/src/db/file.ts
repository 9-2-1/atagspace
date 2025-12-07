import { db } from './_db';
const SQLNow = "unixepoch('now', 'subsecond')";

db.exec(
  [
    'CREATE TABLE IF NOT EXISTS file (',
    ' id INTEGER NOT NULL PRIMARY KEY,',
    ' parentId INTEGER,', // NULL = root
    ' name TEXT NOT NULL,',
    ' isDir INTEGER NOT NULL DEFAULT 0,', // 0 = file, 1 = dir
    ' dev INTEGER,', // device
    ' ino INTEGER,', // inode % (2**32)
    ' size INTEGER,', // directory: total
    ' mtime REAL,', // ms
    ' description TEXT, ', // file description
    ' ctime REAL NOT NULL,', // last updated time
    ' FOREIGN KEY (parentId) REFERENCES file(id) ON DELETE CASCADE',
    ');',
    'CREATE UNIQUE INDEX IF NOT EXISTS file_parentId_name ON file (parentId, name);',
    'CREATE INDEX IF NOT EXISTS file_dev_ino_ctime ON file (dev, ino, ctime);',
    'CREATE INDEX IF NOT EXISTS file_name_size_mtime_ctime ON file (name, size, mtime, ctime);',
  ].join('\n')
);

export * as tag from './file_tag';

export type File = {
  id: bigint;
  parentId: bigint | null;
  name: string;
  isDir: bigint; // 0 = file, 1 = dir
  dev: bigint | null;
  ino: bigint | null;
  size: bigint | null;
  mtime: number | null; // mtime
  description: string | null; // file description
  ctime: number; // Last update time (second timestamp)
};

export type FileCreate = Omit<File, 'id' | 'ctime'>;
const createStatement = db
  .prepare<FileCreate, bigint>(
    [
      'INSERT INTO file', // format expand
      ' (parentId, name, isDir, dev, ino, size, mtime, description, ctime)',
      ' VALUES',
      ` (:parentId, :name, :isDir, :dev, :ino, :size, :mtime, :description, ${SQLNow})`,
      ' RETURNING id',
    ].join('\n')
  )
  .pluck();
export function create(file: FileCreate): bigint {
  return createStatement.get(file)!;
}

export type FileUpdate = Pick<File, 'id' | 'isDir' | 'dev' | 'ino' | 'size' | 'mtime'>;
const updateMetaStatement = db.prepare<FileUpdate, void>(
  [
    'UPDATE file SET', // format expand
    ' dev = :dev,',
    ' isDir = :isDir,',
    ' ino = :ino,',
    ' size = :size,',
    ' mtime = :mtime,',
    ` ctime = ${SQLNow}`,
    ' WHERE id = :id',
  ].join('\n')
);
export function updateMeta(file: FileUpdate): void {
  updateMetaStatement.run(file);
}

const getStatement = db.prepare<Pick<File, 'id'>, File>('SELECT * FROM file WHERE id = :id');
export function get(id: bigint): File | null {
  return getStatement.get({ id }) ?? null;
}

const getByNameStatement = db.prepare<Pick<File, 'parentId' | 'name'>, File>(
  'SELECT * FROM file WHERE parentId IS :parentId AND name = :name'
);
export function getByName(parentId: bigint | null, name: string): File | null {
  return getByNameStatement.get({ parentId, name }) ?? null;
}

const moveStatement = db.prepare<Pick<File, 'id' | 'parentId'>, void>(
  'UPDATE file SET parentId = :parentId WHERE id = :id'
);
export function move(id: bigint, parentId: bigint | null): void {
  moveStatement.run({ id, parentId });
}

const renameStatement = db.prepare<Pick<File, 'id' | 'name'>, void>(
  'UPDATE file SET name = :name WHERE id = :id'
);
export function rename(id: bigint, name: string): void {
  renameStatement.run({ id, name });
}

const moveRenameStatement = db.prepare<Pick<File, 'id' | 'parentId' | 'name'>, void>(
  'UPDATE file SET parentId = :parentId, name = :name WHERE id = :id'
);
export function moveRename(id: bigint, parentId: bigint, name: string): void {
  moveRenameStatement.run({ id, parentId, name });
}

const deleteStatement = db.prepare<Pick<File, 'id'>, void>('DELETE FROM file WHERE id = :id');
// be careful! this will delete all children
function delete_(id: bigint): void {
  deleteStatement.run({ id });
}
export { delete_ as delete };

const listStatement = db.prepare<Pick<File, 'parentId'>, File>(
  'SELECT * FROM file WHERE parentId IS :parentId'
);
export function list(parentId: bigint | null): File[] {
  return listStatement.all({ parentId });
}

const describeStatement = db.prepare<Pick<File, 'id' | 'description'>, void>(
  `UPDATE file SET description = :description, ctime = ${SQLNow} WHERE id = :id`
);
export function describe(id: bigint, description: string | null): void {
  describeStatement.run({ id, description });
}

const touchCtimeStatement = db.prepare<Pick<File, 'id'>, void>(
  `UPDATE file SET ctime = ${SQLNow} WHERE id = :id`
);
export function touchCtime(id: bigint): void {
  touchCtimeStatement.run({ id });
}

const getMaxNameStatement = db
  .prepare<Pick<File, 'parentId'>, string>('SELECT MAX(name) FROM file WHERE parentId IS :parentId')
  .pluck();
export function getMaxName(parentId: bigint): string | null {
  return getMaxNameStatement.get({ parentId }) ?? null;
}

// 获取最近更改的，相同 dev, ino 的文件，用于恢复标签，说明等
const matchDevInoStatement = db.prepare<Pick<File, 'dev' | 'ino'>, File>(
  'SELECT * FROM file WHERE dev = :dev AND ino = :ino ORDER BY ctime DESC LIMIT 1'
);
export function matchDevIno(dev: bigint, ino: bigint): File | null {
  return matchDevInoStatement.get({ dev, ino }) ?? null;
}

// 获取最近更改的，相同 name, size, mtime 的文件，用于恢复标签，说明等
const matchNameSizeMtimeStatement = db.prepare<Pick<File, 'name' | 'size' | 'mtime'>, File>(
  'SELECT * FROM file WHERE name = :name AND size = :size AND mtime = :mtime ORDER BY ctime DESC LIMIT 1'
);
export function matchNameSizeMtime(name: string, size: bigint, mtime: number): File | null {
  return matchNameSizeMtimeStatement.get({ name, size, mtime }) ?? null;
}
