import { db } from './db';

export function init() {
  db.exec(`\
CREATE TABLE IF NOT EXISTS category (
 id INTEGER PRIMARY KEY NOT NULL,
 name TEXT NOT NULL,
 forecolor TEXT, -- 前景颜色
 backcolor TEXT -- 背景颜色
);
CREATE UNIQUE INDEX IF NOT EXISTS category_name ON category(name);
`);
}

export interface Category {
  id: number;
  name: string;
  forecolor: string | null;
  backcolor: string | null;
}

export function get(categoryId: number) {
  return db.prepare<[number], Category>(`SELECT * FROM category WHERE id = ?`).get(categoryId);
}

export function named(name: string) {
  return db.prepare<[string], Category>(`SELECT * FROM category WHERE name = ?`).get(name);
}

export function color(
  categoryId: number,
  forecolor: string | null = null,
  backcolor: string | null = null
) {
  db.prepare<[number, string | null, string | null], void>(
    `UPDATE category SET forecolor = ?2, backcolor = ?3 WHERE id = ?1`
  ).run(categoryId, forecolor, backcolor);
}

export function remove(categoryId: number) {
  db.transaction(() => {
    db.prepare<[number], void>(
      `DELETE FROM tag_file WHERE tagId IN (SELECT id FROM tag WHERE categoryId = ?)`
    ).run(categoryId);
    db.prepare<[number], void>(`DELETE FROM tag WHERE categoryId = ?`).run(categoryId);
    db.prepare<[number], void>(`DELETE FROM category WHERE id = ?`).run(categoryId);
  });
}

export function rename(categoryId: number, name: string) {
  db.prepare<[number, string], void>(`UPDATE category SET name = ?2 WHERE id = ?1`).run(
    categoryId,
    name
  );
  // TODO: name conflict throw
}
