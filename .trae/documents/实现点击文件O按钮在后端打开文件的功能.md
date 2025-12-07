1. 创建配置文件 `server/src/config.ts`，将同步目录的映射规则移到配置中
2. 实现获取文件完整路径的函数，通过parentId遍历获取完整路径
3. 在API中添加打开文件的端点
4. 在前端App.svelte中修改O按钮的点击事件，调用新的API
5. 使用open库（已经使用pnpm安装）用于在后端打开文件

配置文件结构：

```typescript
export interface SyncConfig {
  realPath: string;
  virtualName: string;
}

export const syncConfigs: SyncConfig[] = [
  { realPath: 'D:/Pictures/Screenshots', virtualName: 'Screenshots' },
  // 其他映射规则...
];
```

API端点设计：

```typescript
export function open(fileId: bigint): void {
  // 实现获取完整路径并打开文件
}
```

获取完整路径的函数：

```typescript
function getFullPath(fileId: bigint): string {
  // 通过parentId遍历获取完整路径
}
```
