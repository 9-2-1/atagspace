import { db } from './db';

import * as file_deleted from './file_deleted';
export { file_deleted as deleted };
import * as file_tag from './file_tag';
export { file_tag as tag };

export function init() {
  db.exec(`\
CREATE TABLE IF NOT EXISTS file (
 id INTEGER PRIMARY KEY NOT NULL,
 parentId INTEGER, -- NULL: 根目录
 name TEXT NOT NULL,
 description TEXT, -- 说明
 isDir INTEGER, -- 0: 文件, 1: 目录
 FOREIGN KEY (parentId) REFERENCES file(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS file_parent_name ON file(parentId, name);
`);
}

export interface File {
  id: number;
  parentId: number | null;
  name: string;
  description: string | null;
  isDir: number;
}

export function list(parentId: number | null) {
  return db.prepare<[number | null], File>('SELECT * FROM file WHERE parentId IS ?').all(parentId);
}

export function list_recursive(parentId: number | null) {
  return db
    .prepare<[number | null], File>(
      `\
WITH RECURSIVE file_recursive AS (
 SELECT * FROM file
 WHERE parentId IS ?
 UNION ALL
 SELECT * FROM file
 JOIN file_recursive ON file.parentId IS file_recursive.id
)
SELECT * FROM file_recursive`
    )
    .all(parentId);
}

export function create({
  parentId,
  name,
  isDir,
}: {
  parentId: number | null;
  name: string;
  isDir: number;
}) {
  return db
    .prepare<
      [number | null, string, number],
      number
    >('INSERT INTO file (parentId, name, isDir) VALUES (?, ?, ?) RETURNING id')
    .run(parentId, name, isDir);
}

export function get(id: number) {
  return db.prepare<[number], File>('SELECT * FROM file WHERE id = ?').get(id);
}

export function rename(id: number, name: string) {
  db.prepare<[string, number], void>('UPDATE file SET name = ? WHERE id = ?').run(name, id);
}

export function move(id: number, parentId: number | null) {
  db.prepare<[number | null, number], void>('UPDATE file SET parentId IS ? WHERE id = ?').run(
    parentId,
    id
  );
}

export function move_rename({
  id,
  parentId,
  name,
}: {
  id: number;
  parentId: number | null;
  name: string;
}) {
  db.prepare<[number | null, string, number], void>(
    'UPDATE file SET parentId IS ?, name = ? WHERE id = ?'
  ).run(parentId, name, id);
}

export function set_description(id: number, description: string | null) {
  db.prepare<[string | null, number], void>('UPDATE file SET description = ? WHERE id = ?').run(
    description,
    id
  );
}

// avoid keyword
function delete_(id: number) {
  db.prepare<[number], void>('DELETE FROM file WHERE id = ?').run(id);
}

export { delete_ as delete };

// Won't use in real world as here are TAGS to process and delete
export function delete_recursive(id: number) {
  db.prepare<[number], void>(
    `\
WITH RECURSIVE file_recursive AS (
 SELECT id FROM file
 WHERE parentId IS ?
 UNION ALL
 SELECT id FROM file
 JOIN file_recursive ON file.parentId IS file_recursive.id
)
DELETE FROM file_recursive WHERE id IN (SELECT id FROM file_recursive)`
  ).run(id);
}
