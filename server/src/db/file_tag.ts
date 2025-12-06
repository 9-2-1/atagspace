import { db } from './_db';

db.exec(
  [
    'CREATE TABLE IF NOT EXISTS file_tag (',
    ' fileId INTEGER NOT NULL,',
    ' tagId INTEGER NOT NULL,',
    ' FOREIGN KEY (fileId) REFERENCES file(id) ON DELETE CASCADE,',
    ' FOREIGN KEY (tagId) REFERENCES tag(id) ON DELETE NO ACTION,',
    ' PRIMARY KEY (fileId, tagId)',
    ') WITHOUT ROWID;',
  ].join('\n')
);

const addStatement = db.prepare<{ fileId: bigint; tagId: bigint }, void>(
  [
    'INSERT OR IGNORE INTO file_tag', // format expand
    ' (fileId, tagId)',
    ' VALUES',
    ` (:fileId, :tagId)`,
  ].join('\n')
);
export function add(fileId: bigint, tagId: bigint): void {
  addStatement.run({ fileId, tagId });
}

const deleteStatement = db.prepare<{ fileId: bigint; tagId: bigint }, void>(
  'DELETE FROM file_tag WHERE fileId = :fileId AND tagId = :tagId'
);
function delete_(fileId: bigint, tagId: bigint): void {
  deleteStatement.run({ fileId, tagId });
}
export { delete_ as delete };

const deleteAllStatement = db.prepare<bigint, void>('DELETE FROM file_tag WHERE fileId = ?');
export function deleteAll(fileId: bigint): void {
  deleteAllStatement.run(fileId);
}

const listStatement = db.prepare<bigint, bigint>('SELECT tagId FROM file_tag WHERE fileId = ?');
export function list(fileId: bigint): bigint[] {
  return listStatement.all(fileId);
}

const copyStatement = db.prepare<{ srcId: bigint; dstId: bigint }, void>(
  [
    'INSERT OR IGNORE INTO file_tag', // format expand
    'SELECT :dstId, tagId FROM file_tag WHERE fileId = :srcId',
  ].join('\n')
);
export function copy(srcId: bigint, dstId: bigint): void {
  copyStatement.run({ srcId, dstId });
}
