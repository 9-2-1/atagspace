import { db } from './db';
import * as tag from './tag';
import * as file from './file';

export function init() {
  file.init();
  tag.init();
  db.exec(`\
CREATE TABLE IF NOT EXISTS file_deleted_checksum (
 id INTEGER PRIMARY KEY NOT NULL,
 size INTEGER NOT NULL, -- 文件大小
 checksum TEXT, -- 校验和
 deleteTime INTEGER NOT NULL -- 删除时间
);
CREATE UNIQUE INDEX IF NOT EXISTS file_deleted_checksum_checksum ON file_deleted_checksum(checksum);

CREATE TABLE IF NOT EXISTS file_deleted_checksum_tag (
 entryId INTEGER NOT NULL,
 tagId INTEGER NOT NULL,
 FOREIGN KEY (entryId) REFERENCES file_deleted_checksum(id),
 FOREIGN KEY (tagId) REFERENCES tag(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS file_deleted_checksum_tag_entryId_tagId ON file_deleted_checksum_tag(entryId, tagId);
`);
}

export interface DeletedFileChecksum {
  id: number;
  size: number;
  checksum: string;
  deleteTime: number;
}

export interface DeletedFileChecksumTag {
  entryId: number;
  tagId: number;
}

export function add({ size, checksum, deleteTime }: DeletedFileChecksum) {
  return db
    .prepare<
      [number, string, number],
      number
    >('INSERT INTO file_deleted_checksum (size, checksum, deleteTime) VALUES (?, ?, ?) RETURNING id')
    .run(size, checksum, deleteTime);
}

export function find(checksum: string) {
  return db
    .prepare<
      [string],
      DeletedFileChecksumTag
    >('SELECT entryId, tagId FROM file_deleted_checksum_tag WHERE entryId = ?')
    .all(checksum);
}

// Avoid keyword
function delete_(id: number) {
  db.prepare<[number], void>('DELETE FROM file_deleted_checksum_tag WHERE entryId = ?').run(id);
  db.prepare<[number], void>('DELETE FROM file_deleted_checksum WHERE id = ?').run(id);
}

export { delete_ as delete };

export function import_tags(entryId: number, fileId: number) {
  return db
    .prepare<
      [number, number],
      void
    >('INSERT INTO file_deleted_checksum_tag (entryId, tagId) SELECT ?, tagId FROM tag_file WHERE fileId = ?')
    .run(entryId, fileId);
}

export function export_tags(entryId: number, fileId: number) {
  return db
    .prepare<
      [number, number],
      void
    >('INSERT INTO tag_file (fileId, tagId) SELECT ?, tagId FROM file_deleted_checksum_tag WHERE entryId = ?')
    .run(fileId, entryId);
}
