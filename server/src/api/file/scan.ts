import * as dbfunc from '../../db';
import fs from 'fs';
import fsP from 'fs/promises';

const nameGroup = 6;
// aaaaaa
// aaaaab
// aaaaac ...
// zzzzzz
// zzzzzzaaaaaa
// zzzzzzaaaaab
// ...
function addNameBy1(name: string): string {
  for (let i = name.length - 1; i >= 0; i--) {
    if (name[i] === 'z') continue;
    return (
      name.slice(0, i) + String.fromCharCode(name.charCodeAt(i) + 1) + 'a'.repeat(nameGroup - i - 1)
    );
  }
  return name + 'a'.repeat(nameGroup);
}
function getNextRecycleName(recycleId: bigint): string {
  const maxName = dbfunc.file.getMaxName(recycleId) ?? '';
  const nextName = addNameBy1(maxName);
  return nextName;
}
export function recycle_orig(id: bigint): void {
  const recycleId = getOrCreateDir(null, '<recycle>');
  const newName = getNextRecycleName(recycleId);
  const newId = getOrCreateDir(recycleId, newName);
  dbfunc.file.move(id, newId);
  dbfunc.file.touchCtime(newId);
}
const recycle = dbfunc.transaction(recycle_orig);

export type Callbacks = {
  onFile: (file: dbfunc.file.FileCreate | null, mode: 'add' | 'change' | 'delete') => void;
  onStat: (file: dbfunc.file.FileCreate | null, stat: fs.BigIntStats) => void;
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
  callbacks.onFile(fileCreate, file ? 'change' : 'add');
  let fileId = 0n;
  if (file) {
    fileId = file.id;
    dbfunc.file.update({ id: file.id, ...fileCreate });
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
      dbfunc.file.update({ id: fileId, ...fileCreate });
      callbacks.onStat(fileCreate, stat);
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
      callbacks.onFile(file, 'delete');
      recycle(file.id);
    }
  } catch (err) {
    console.error(`Error readdir ${realPath}: ${err}`);
  }
}

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
