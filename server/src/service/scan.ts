import * as dbfunc from '../db';
import { recycle } from '../utils/file/recycle';
import fs from 'fs';
import fsP from 'fs/promises';

export type Callbacks = {
  onFile: (
    file: dbfunc.file.FileCreate | null,
    mode: 'add' | 'change' | 'delete',
    path: string
  ) => void;
  onStat: (file: dbfunc.file.FileCreate | null, stat: fs.BigIntStats, path: string) => void;
  onRecover: (file: dbfunc.file.FileCreate | null, path: string) => void;
};
// realPath => parentId.name
export async function syncFile(
  realPath: string,
  parentId: bigint | null,
  name: string,
  isDir: boolean,
  callbacks: Callbacks
): Promise<{ id: bigint; stat: Promise<void> }> {
  // v TODO 先添加项目，返回ID，再运行耗时的stat
  const fileCreate: dbfunc.file.FileCreate = {
    parentId,
    name,
    isDir: isDir ? 1n : 0n,
    dev: null,
    ino: null,
    size: null,
    mtime: null,
    description: null,
  };
  const file = dbfunc.file.getByName(parentId, name);
  const newfile = file === null;
  callbacks.onFile(fileCreate, newfile ? 'add' : 'change', realPath);
  let fileId = 0n;
  if (file) {
    fileId = file.id;
    dbfunc.file.updateMeta({ id: file.id, ...fileCreate });
  } else {
    fileId = dbfunc.file.create(fileCreate);
  }
  async function stat() {
    try {
      const stat = await fsP.stat(realPath, { bigint: true });
      fileCreate.dev = stat.dev;
      fileCreate.ino = stat.ino;
      fileCreate.size = stat.size;
      fileCreate.mtime = Number(stat.mtimeMs) / 1000;
      if (newfile) {
        // Copy tags and description from matched files before updating metadata
        if (fileCreate.dev !== null && fileCreate.ino !== null) {
          const existFile = dbfunc.file.matchDevIno(fileCreate.dev, fileCreate.ino);
          if (existFile) {
            callbacks.onRecover(existFile, realPath);
            fileCreate.description = existFile.description;
            dbfunc.file.tag.copy(existFile.id, fileId);
          }
        }
        if (fileCreate.size !== null && fileCreate.mtime !== null) {
          const existFile = dbfunc.file.matchNameSizeMtime(
            fileCreate.name,
            fileCreate.size,
            fileCreate.mtime
          );
          if (existFile) {
            callbacks.onRecover(existFile, realPath);
            fileCreate.description = existFile.description;
            dbfunc.file.tag.copy(existFile.id, fileId);
          }
        }
      }
      dbfunc.file.updateMeta({ id: fileId, ...fileCreate });
      callbacks.onStat(fileCreate, stat, realPath);
    } catch (err) {
      console.error(`Error stat ${realPath}: ${err}`);
    }
  }
  return { id: fileId, stat: stat() };
}

// realPath.* => fileId.*
export async function syncDir(
  realPath: string,
  fileId: bigint | null,
  callbacks: Callbacks
): Promise<void> {
  try {
    const items = await fsP.readdir(realPath, { withFileTypes: true });
    const items2 = dbfunc.file.list(fileId);
    // Map<name, File>
    const todelete = new Map(items2.map(item => [item.name, item]));
    await Promise.all(
      items.map(async item => {
        todelete.delete(item.name);
        const { id: dirId, stat } = await syncFile(
          `${realPath}/${item.name}`,
          fileId,
          item.name,
          item.isDirectory(),
          callbacks
        );
        if (item.isDirectory()) {
          await syncDir(`${realPath}/${item.name}`, dirId, callbacks);
        }
        await stat;
      })
    );
    // delete items2 not in items
    for (const file of todelete.values()) {
      callbacks.onFile(file, 'delete', `${realPath}/${file.name}`);
      recycle(file.id);
    }
  } catch (err) {
    console.error(`Error readdir ${realPath}: ${err}`);
  }
}
