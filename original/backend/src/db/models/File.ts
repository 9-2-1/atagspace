import { getDb } from '../index';

export interface File {
  id: number;
  path: string;
  name: string;
  size: number;
  mtime: number;
  dev: number;
  ino: number;
  checksum: string | null;
  is_dir: boolean;
  tags: string;
  deltime: number | null;
}

export const FileModel = {
  setTags: (id: number, tags: string): void => {
    const db = getDb();
    db.prepare('UPDATE file SET tags = ? WHERE id = ?')
      .run(tags, id);
  },

  getTags: (id: number): string => {
    const db = getDb();
    return db.prepare('SELECT tags FROM file WHERE id = ?')
      .get(id) as string;
  },

  list: (path: string): File[] => {
    const db = getDb();
    if (path.slice(-1) !== '/') {
      path += '/';
    }
    return db.prepare('SELECT * FROM file WHERE path = ? AND deltime IS NULL ORDER BY name')
      .all(path) as File[];
  },

  listRecurse: (path: string): File[] => {
    const db = getDb();
    if (path.slice(-1) === '/') {
      path = path.slice(0, -1);
    }
    if (path === '/') {
      return db.prepare('SELECT * FROM file WHERE deltime IS NULL ORDER BY path, name')
        .all() as File[];
    }
    const slash = '/';
    const slashPlus1 = String.fromCharCode(slash.charCodeAt(0) + 1);
    return db.prepare(
      'SELECT * FROM file WHERE path >= ? AND path < ? AND deltime IS NULL ORDER BY path, name'
    ).all(path + slash, path + slashPlus1) as File[];
  },

  markAllDelete: (): void => {
    const db = getDb();
    db.prepare('UPDATE file SET deltime = ? WHERE deltime IS NULL')
      .run(Date.now());
  },

  add: (
    path: string,
    name: string,
    size: number,
    mtime: number,
    dev: number,
    ino: number,
    checksum: string | null,
    is_dir: boolean,
    tags: string
  ): void => {
    const db = getDb();
    db.prepare(
      'INSERT INTO file (path, name, size, mtime, dev, ino, checksum, is_dir, tags, deltime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(path, name, size, mtime, dev, ino, checksum, is_dir ? 1 : 0, tags, null);
  },

  exists: (path: string, name: string): boolean => {
    const db = getDb();
    const result = db.prepare('SELECT 1 FROM file WHERE path = ? AND name = ?')
      .get(path, name);
    return result !== undefined;
  },

  getPathName: (path: string, name: string): File | null => {
    const db = getDb();
    const result = db.prepare('SELECT * FROM file WHERE path = ? AND name = ?')
      .get(path, name);
    return result as File | null;
  },

  getDevIno: (dev: number, ino: number): File | null => {
    const db = getDb();
    if (ino === 0 || dev === 0) {
      return null;
    }
    const result = db.prepare('SELECT * FROM file WHERE dev = ? AND ino = ?')
      .get(dev, ino);
    return result as File | null;
  },

  updatePathName: (id: number, newPath: string | null, newName: string | null): void => {
    const db = getDb();
    const oldFile = db.prepare('SELECT path, name FROM file WHERE id = ?')
      .get(id) as { path: string; name: string };
    
    const finalPath = newPath || oldFile.path;
    const finalName = newName || oldFile.name;
    const newPathName = finalPath + finalName;
    const oldPathName = oldFile.path + oldFile.name;
    
    db.prepare('UPDATE file SET name = ?, path = ? WHERE id = ?')
      .run(finalName, finalPath, id);
    
    const oldPathLowerBound = oldPathName + '/';
    const oldPathUpperBound = oldPathName + String.fromCharCode('/'.charCodeAt(0) + 1);
    
    db.prepare(
      'UPDATE file SET path = concat(?, SUBSTR(path, ? + 1)) WHERE path >= ? AND path < ?'
    ).run(newPathName + '/', oldPathLowerBound.length, oldPathLowerBound, oldPathUpperBound);
  },

  purgeDeleted: (time: number): void => {
    const db = getDb();
    db.prepare('DELETE FROM file WHERE deltime IS NOT NULL AND deltime < ?')
      .run(time);
  }
};
