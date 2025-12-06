import * as dbfunc from '../../db';
import { recycle } from './recycle';

// srcId => dstParentId.name
export function copyFile(src: dbfunc.file.File, dstParentId: bigint, name: string): void {
  const existFile = dbfunc.file.getByName(dstParentId, name);
  if (existFile) {
    recycle(existFile.id);
  }
  const fileId = dbfunc.file.create({ ...src, parentId: dstParentId, name });
  if (src.isDir) {
    copyInDir(src.id, fileId);
  }
}

// src.* => dstId.*
export function copyInDir(srcId: bigint, dstId: bigint): void {
  dbfunc.file.list(srcId).forEach(item => {
    copyFile(item, dstId, item.name);
  });
}
