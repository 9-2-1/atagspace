import * as dbfunc from '../../db';
import { getOrCreateDir } from './dir';

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

function recycleOrig(id: bigint): void {
  const recycleId = getOrCreateDir(null, '<recycle>');
  const newName = getNextRecycleName(recycleId);
  const newId = getOrCreateDir(recycleId, newName);
  dbfunc.file.move(id, newId);
  dbfunc.file.touchCtime(newId);
}
const recycle = dbfunc.transaction(recycleOrig);
export { recycle };
