import * as dbfunc from '../../db';

export function getOrCreateDir(parentId: bigint | null, name: string): bigint {
  let rootId = dbfunc.file.getByName(parentId, name)?.id;
  if (!rootId) {
    rootId = dbfunc.file.create({
      parentId,
      name,
      isDir: 1n,
      dev: null,
      ino: null,
      size: null,
      mtime: null,
      description: null,
    });
  }
  return rootId;
}
