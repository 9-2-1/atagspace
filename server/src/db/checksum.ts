import { db } from './db';

export function init() {
  db.exec(`\
CREATE TABLE IF NOT EXISTS checksum_cache (
 id INTEGER PRIMARY KEY NOT NULL, -- 主键
 path TEXT, -- 路径
 dev INTEGER, -- 设备号
 ino INTEGER, -- 文件号
 size INTEGER, -- 大小
 mtime INTEGER, -- 修改时间 单位: 毫秒时间戳
 checksum TEXT, -- 校验和
 time REAL -- 缓存命中时间，用于清理长时间未命中项
);
CREATE INDEX IF NOT EXISTS checksum_time ON checksum_cache(time);
CREATE INDEX IF NOT EXISTS checksum_size_mtime ON checksum_cache(size, mtime);
`);
}

export interface ChecksumCache {
  id: number;
  path: string;
  dev: number;
  ino: number;
  size: number;
  mtime: number;
  checksum: string;
  time: number;
}

export type FileCheckSum = Omit<ChecksumCache, 'id' | 'time'>;

export type FileQuery = Omit<FileCheckSum, 'checksum'>;

export function set({ path, dev, ino, size, mtime, checksum }: FileQuery & FileCheckSum) {
  db.prepare<[string, number, number, number, number, string, number], void>(
    `\
INSERT INTO checksum_cache (path, dev, ino, size, mtime, checksum, time)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(path, dev, ino, size, mtime, checksum, new Date().getTime());
}

export function touch_time(id: number) {
  db.prepare<[number, number], void>(`UPDATE checksum_cache SET time = ? WHERE id = ?`).run(
    new Date().getTime(),
    id
  );
}

export function get({ path, dev, ino, size, mtime }: FileQuery) {
  const cache = db
    .prepare<[number, number, string, number, number], ChecksumCache>(
      `\
SELECT * FROM checksum_cache
 WHERE size = ? AND mtime = ?
 AND (path = ? OR (dev = ? AND ino = ?))`
    )
    .get(size, mtime, path, dev, ino);
  if (cache) {
    touch_time(cache.id);
    return cache.checksum;
  }
  return undefined;
}
