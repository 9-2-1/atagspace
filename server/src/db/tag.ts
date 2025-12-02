import { db } from './db';
import * as category from './category';

export function init() {
  category.init();
  db.exec(`\
CREATE TABLE IF NOT EXISTS tag (
 id INTEGER PRIMARY KEY NOT NULL,
 categoryId INTEGER, -- 类别 id, NULL 未分类
 name TEXT NOT NULL,
 forecolor TEXT, -- 前景颜色
 backcolor TEXT, -- 背景颜色
 FOREIGN KEY (categoryId) REFERENCES category(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS tag_name ON tag(name);
CREATE INDEX IF NOT EXISTS tag_categoryId ON tag(categoryId);
`);
}

export interface Tag {
  id: number;
  categoryId: number;
  name: string;
  forecolor: string | null;
  backcolor: string | null;
}

export function add(categoryId: number, name: string) {
  return db
    .prepare<
      [number, string],
      number
    >(`INSERT INTO tag (categoryId, name) VALUES (?, ?) RETURNING id`)
    .pluck()
    .get(categoryId, name);
}

export function get(tagId: number) {
  return db.prepare<[number], Tag>(`SELECT * FROM tag WHERE id = ?`).get(tagId);
}

export function named(name: string) {
  return db.prepare<[string], Tag>(`SELECT * FROM tag WHERE name = ?`).get(name);
}

export function color(
  tagId: number,
  forecolor: string | null = null,
  backcolor: string | null = null
) {
  db.prepare<[number, string | null, string | null], void>(
    `UPDATE tag SET forecolor = ?2, backcolor = ?3 WHERE id = ?1`
  ).run(tagId, forecolor, backcolor);
}

export function remove(tagId: number) {
  db.transaction(() => {
    db.prepare<[number], void>(`DELETE FROM tag_file WHERE tagId = ?`).run(tagId);
    db.prepare<[number], void>(`DELETE FROM tag WHERE id = ?`).run(tagId);
  });
}

export function move_category(tagId: number, categoryId: number) {
  db.prepare<[number, number], void>(`UPDATE tag SET categoryId = ?2 WHERE id = ?1`).run(
    tagId,
    categoryId
  );
}

export function rename(tagId: number, name: string) {
  db.prepare<[number, string], void>(`UPDATE tag SET name = ?2 WHERE id = ?1`).run(tagId, name);
  // TODO: name conflict throw
}
