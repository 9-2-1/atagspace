import { db } from './db/_db';
import * as dbfunc from './db';
import cliprogress from './utils/progress/cliprogress';
import { getDirIdByPath } from './utils/file/path';

// 定义旧文件类型
interface OldFile {
  id: number;
  path: string;
  name: string;
  tags: string;
}

async function main() {
  console.log('开始从旧版数据库导入tags到description...');

  try {
    // 附加旧数据库
    db.exec("attach database 'D:\\Documents\\常用\\atagspace\\atagspace.db' as old");
    console.log('成功附加旧数据库');

    // 查询旧数据库数据
    const oldFiles = db.prepare<[], OldFile>('SELECT id, path, name, tags FROM old.file').all();
    console.log(`找到 ${oldFiles.length} 条记录需要处理`);

    // 使用进度条处理数据
    const result = await cliprogress(
      { processed: 0, total: oldFiles.length, success: 0, failed: 0 },
      100,
      async update => {
        let state = { processed: 0, total: oldFiles.length, success: 0, failed: 0 };

        for (const oldFile of oldFiles) {
          try {
            // 处理tags字段
            let tags = oldFile.tags || '';
            tags = tags.replace(/[◆●]/g, '').trim();

            if (tags) {
              // 构建虚拟路径并查找对应文件
              // 旧数据库的path格式可能是类似 '/virtual/path'，需要处理
              let virtualPath = oldFile.path || '';
              // 确保路径格式正确，去除首尾斜杠并标准化
              virtualPath = virtualPath.replace(/^\/|\/$/g, '');

              let parentId: bigint | null = null;
              if (virtualPath) {
                // 获取目录ID
                parentId = getDirIdByPath(virtualPath);
              }

              // 查找文件
              const file = dbfunc.file.getByName(parentId, oldFile.name);
              if (file) {
                // 更新文件描述
                dbfunc.file.describe(file.id, tags);
                state.success++;
              } else {
                console.log(`\n未找到文件: ${virtualPath}/${oldFile.name}`);
                state.failed++;
              }
            }
          } catch (error) {
            console.log(
              `\n处理文件 ${oldFile.path}/${oldFile.name} 时出错: ${(error as Error).message}`
            );
            state.failed++;
          }

          state.processed++;
          update(state);
        }

        return state;
      },
      state =>
        `处理进度: ${state.processed}/${state.total} (成功: ${state.success}, 失败: ${state.failed})`
    );

    // 输出结果总结
    console.log('\n=== 导入完成 ===');
    console.log(`总记录数: ${result.total}`);
    console.log(`成功处理: ${result.success}`);
    console.log(`处理失败: ${result.failed}`);
    console.log(`成功率: ${((result.success / result.total) * 100).toFixed(2)}%`);
  } catch (error) {
    console.error('导入过程中发生错误:', (error as Error).message);
    process.exit(1);
  } finally {
    // 断开旧数据库连接
    db.exec('detach database old');
    console.log('已断开旧数据库连接');
    // 关闭数据库
    db.close();
  }
}

main();
