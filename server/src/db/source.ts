import { db } from './db';

export function init() {
  db.exec(`\
CREATE TABLE IF NOT EXISTS source (
 name TEXT PRIMARY KEY NOT NULL,
 path TEXT NOT NULL
) WITHOUT ROWID;`);
}

export interface Source {
  name: string;
  path: string;
}

export function add({ name, path }: Source) {
  db.prepare<[string, string], void>(
    'INSERT INTO source (name, path) VALUES (?1, ?2) ON CONFLICT(name) DO UPDATE SET path = ?2'
  ).run(name, path);
}

function delete_(name: string) {
  db.prepare<[string], void>('DELETE FROM source WHERE name = ?').run(name);
}

export { delete_ as delete };

export function list() {
  return db.prepare<[], Source>('SELECT * FROM source').all();
}
