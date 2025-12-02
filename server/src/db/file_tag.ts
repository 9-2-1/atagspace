import { db } from './db';
import * as file from './file';
import * as tag from './tag';

export function init() {
  tag.init();
  file.init();
  db.exec(`\
CREATE TABLE IF NOT EXISTS file_tag (
 id INTEGER PRIMARY KEY NOT NULL,
 fileId INTEGER NOT NULL, -- 文件 id
 tagId INTEGER NOT NULL, -- 标签 id
 FOREIGN KEY (fileId) REFERENCES file(id),
 FOREIGN KEY (tagId) REFERENCES tag(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS file_tag_fileId_tagId ON file_tag(fileId, tagId);
CREATE INDEX IF NOT EXISTS file_tag_tagId ON file_tag(tagId);
`);
}

export interface TagFile {
  id: number;
  fileId: number;
  tagId: number;
}

export function add(fileId: number, tagId: number) {
  db.prepare<[number, number], void>(`INSERT INTO file_tag (fileId, tagId) VALUES (?, ?)`).run(
    fileId,
    tagId
  );
}

export function remove(fileId: number, tagId: number) {
  db.prepare<[number, number], void>(`DELETE FROM file_tag WHERE fileId = ? AND tagId = ?`).run(
    fileId,
    tagId
  );
}

export function clear(fileId: number) {
  db.prepare<[number], void>(`DELETE FROM file_tag WHERE fileId = ?`).run(fileId);
}
