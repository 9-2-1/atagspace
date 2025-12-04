import { getDb } from '../index';

export interface Source {
  id: number;
  name: string;
  path: string;
}

export const SourceModel = {
  list: (): Source[] => {
    const db = getDb();
    return db.prepare('SELECT * FROM source').all() as Source[];
  },

  add: (name: string, path: string): void => {
    const db = getDb();
    db.prepare('INSERT INTO source (name, path) VALUES (?, ?)').run(name, path);
  },

  get: (name: string): string => {
    const db = getDb();
    return db.prepare('SELECT path FROM source WHERE name = ?').get(name) as string;
  },

  clear: (): void => {
    const db = getDb();
    db.prepare('DELETE FROM source').run();
  },

  update: (id: number, name: string, path: string): void => {
    const db = getDb();
    db.prepare('UPDATE source SET name = ?, path = ? WHERE id = ?').run(name, path, id);
  },

  delete: (id: number): void => {
    const db = getDb();
    db.prepare('DELETE FROM source WHERE id = ?').run(id);
  },
};
