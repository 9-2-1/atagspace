# 实现计划

## 功能需求

从旧版atagspace数据库的file表中读取tags字段，去除特定符号后添加到对应文件的description中。

## 实现步骤

1. **创建导入脚本**
   - 在server/src目录下创建`import-tags.ts`脚本文件
   - 引入必要的依赖：数据库连接、进度条函数、路径处理函数

2. **附加旧数据库**
   - 使用`db.exec()`执行`attach database`命令
   - 连接到旧版数据库：`D:\Documents\常用\atagspace\atagspace.db`

3. **查询旧数据库数据**
   - 从旧数据库的file表中查询所有记录
   - 获取字段：id, path, name, tags

4. **处理tags字段**
   - 对每个tags值执行：`tags.replace(/[◆●]/g, '').trim()`
   - 只保留处理后非空的tags

5. **匹配对应文件**
   - 根据旧数据库的path和name构建虚拟路径
   - 使用`getDirIdByPath`获取目录ID
   - 结合文件名找到对应文件的完整路径
   - 使用`dbfunc.file.getByName`获取文件ID

6. **更新文件描述**
   - 对匹配到的文件，调用`dbfunc.file.describe`更新description
   - 将处理后的tags作为description内容

7. **显示导入进度**
   - 使用`cliprogress`函数显示导入进度
   - 实时更新处理的文件数量和成功率

## 关键代码实现

```typescript
// 附加旧数据库
db.exec("attach database 'D:\\Documents\\常用\\atagspace\\atagspace.db' as old");

// 查询旧数据库数据
const oldFiles = db.prepare('SELECT id, path, name, tags FROM old.file').all();

// 使用进度条处理数据
await cliprogress(
  { processed: 0, total: oldFiles.length, success: 0 },
  100,
  async update => {
    for (const oldFile of oldFiles) {
      // 处理tags字段
      let tags = oldFile.tags || '';
      tags = tags.replace(/[◆●]/g, '').trim();

      if (tags) {
        // 构建虚拟路径并查找对应文件
        const virtualPath = `${oldFile.path}`;
        const parentId = getDirIdByPath(virtualPath);
        if (parentId) {
          const file = dbfunc.file.getByName(parentId, oldFile.name);
          if (file) {
            // 更新文件描述
            dbfunc.file.describe(file.id, tags);
            state.success++;
          }
        }
      }

      state.processed++;
      update(state);
    }
    return state;
  },
  state => `处理进度: ${state.processed}/${state.total} (成功: ${state.success})`
);
```

## 执行方式

1. 确保项目已编译：`npm run build`
2. 执行脚本：`node dist/import-tags.js`

## 预期结果

- 成功处理旧数据库中的所有文件记录
- 处理后的tags被添加到对应文件的description中
- 实时显示导入进度和成功率
- 导入完成后输出总结信息
