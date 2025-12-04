import { getDb, DEFAULT_COLOR } from '../index';

export interface Category {
  id: number;
  name: string;
  color: string | null;
}

export interface Tag {
  id: number;
  cate_id: number;
  name: string;
  color: string | null;
}

export const CategoryModel = {
  list: (): Category[] => {
    const db = getDb();
    return db.prepare('SELECT * FROM category ORDER BY name').all() as Category[];
  },

  set: (name: string, color: string | null): void => {
    const db = getDb();
    db.prepare(
      'INSERT INTO category (name, color) VALUES (?1, ?2) ON CONFLICT(name) DO UPDATE SET color = ?2'
    ).run(name, color);
  },

  rename: (name: string, newName: string): void => {
    const db = getDb();
    db.prepare('UPDATE category SET name = ? WHERE name = ?').run(newName, name);
  },

  getId: (name: string): number => {
    const db = getDb();
    return db.prepare('SELECT id FROM category WHERE name = ?').get(name) as number;
  },

  remove: (name: string): void => {
    const db = getDb();
    const cateId = CategoryModel.getId(name);
    db.prepare('DELETE FROM tag WHERE cate_id = ?').run(cateId);
    db.prepare('DELETE FROM category WHERE id = ?').run(cateId);
  },

  getColorById: (id: number): string => {
    const db = getDb();
    const result = db.prepare('SELECT color FROM category WHERE id = ?').get(id) as {
      color: string | null;
    };
    if (result === undefined) {
      return DEFAULT_COLOR;
    }
    return result.color || DEFAULT_COLOR;
  },
};

export const TagModel = {
  list: (cate: string | null = null): Tag[] => {
    const db = getDb();
    if (cate === null) {
      return db.prepare('SELECT * FROM tag ORDER BY name').all() as Tag[];
    }
    const cateId = CategoryModel.getId(cate);
    return db.prepare('SELECT * FROM tag WHERE cate_id = ? ORDER BY name').all(cateId) as Tag[];
  },

  set: (name: string, cate: string): void => {
    const db = getDb();
    const cateId = CategoryModel.getId(cate);
    db.prepare(
      'INSERT INTO tag (name, cate_id) VALUES (?1, ?2) ON CONFLICT(name) DO UPDATE SET cate_id = ?2'
    ).run(name, cateId);
  },

  setColor: (name: string, color: string | null): void => {
    const db = getDb();
    db.prepare('UPDATE tag SET color = ? WHERE name = ?').run(color, name);
  },

  remove: (name: string): void => {
    const db = getDb();
    db.prepare('DELETE FROM tag WHERE name = ?').run(name);
  },

  getCategoryName: (name: string): string | null => {
    const db = getDb();
    const result = db
      .prepare(
        'SELECT c.name FROM tag AS t JOIN category AS c ON t.cate_id = c.id WHERE t.name = ?'
      )
      .get(name) as { name: string } | undefined;
    return result?.name || null;
  },

  getColor: (name: string): string => {
    const db = getDb();
    const result = db.prepare('SELECT cate_id, color FROM tag WHERE name = ?').get(name) as
      | { cate_id: number; color: string | null }
      | undefined;
    if (result === undefined) {
      return CategoryModel.getColorById(CategoryModel.getId(''));
    }
    if (result.color !== null) {
      return result.color;
    }
    return CategoryModel.getColorById(result.cate_id);
  },
};
