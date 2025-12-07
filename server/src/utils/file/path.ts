import * as dbfunc from '../../db';
import { syncConfigs } from '../../config';

/**
 * 获取文件的完整虚拟路径
 * @param fileId 文件ID
 * @returns 文件的完整虚拟路径
 */
export function getVirtualPath(fileId: bigint): string {
  const pathParts: string[] = [];
  let currentId: bigint | null = fileId;

  while (currentId !== null) {
    const file = dbfunc.file.get(currentId);
    if (!file) {
      throw new Error(`File not found: ${currentId}`);
    }
    pathParts.unshift(file.name);
    currentId = file.parentId;
  }

  return pathParts.join('/');
}

/**
 * 获取文件的真实路径
 * @param fileId 文件ID
 * @returns 文件的真实路径
 */
export function getRealPath(fileId: bigint): string {
  const virtualPath = getVirtualPath(fileId);

  // 查找匹配的配置项
  for (const config of syncConfigs) {
    const expectedVirtualPath = `${config.virtualName}/`;
    if (virtualPath.startsWith(expectedVirtualPath)) {
      const relativePath = virtualPath.substring(expectedVirtualPath.length);
      return `${config.realPath}/${relativePath}`;
    } else if (virtualPath === config.virtualName) {
      return config.realPath;
    }
  }

  throw new Error(`No matching sync config found for path: ${virtualPath}`);
}

/**
 * 获取目录的真实路径映射
 * @returns 真实路径到虚拟路径的映射
 */
export function getRealPathMap(): Map<string, string> {
  const map = new Map<string, string>();

  for (const config of syncConfigs) {
    map.set(config.virtualName, config.realPath);
  }

  return map;
}

/**
 * 通过虚拟路径获得目录Id
 * @param virtualPath 虚拟路径
 * @returns 目录项的Id
 */
export function getDirIdByPath(virtualPath: string): bigint | null {
  let dirId: bigint | null = null;
  const parts = virtualPath.split('/').filter(part => part !== '');
  for (const part of parts) {
    const file = dbfunc.file.getByName(dirId, part);
    if (!file) {
      throw new Error(`No matching file found for path: ${part}`);
    }
    dirId = file.id;
  }
  return dirId;
}
