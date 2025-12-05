import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
// import { createExpressMiddleware } from '@trpc/server/adapters/express';
// import appRouter from './api';

import { syncDir, getOrCreateDir } from './api/file/scan';
import type { Callbacks } from './api/file/scan';
import cliprogress from './utils/cliprogress';

async function test() {
  // 同步目录
  const state = { list: 0, stat: 0, add: 0, change: 0, delete: 0 };
  await cliprogress(
    state,
    100,
    async update => {
      const callbacks: Callbacks = {
        onFile: (file, mode) => {
          state.list++;
          if (mode === 'add') {
            state.add++;
          } else if (mode === 'change') {
            state.change++;
          } else if (mode === 'delete') {
            state.delete++;
          }
          update(state);
        },
        onStat: () => {
          state.stat++;
          update(state);
        },
      };
      await Promise.all([
        syncDir('D:/Pictures/Screenshots', getOrCreateDir(null, 'Screenshots'), callbacks),
        syncDir('D:/Pictures/Saved Pictures', getOrCreateDir(null, 'Saved Pictures'), callbacks),
        syncDir('D:/Pictures/Camera Roll', getOrCreateDir(null, 'Camera Roll'), callbacks),
        syncDir('D:/OneDrive', getOrCreateDir(null, 'OneDrive'), callbacks),
        syncDir('D:/Downloads', getOrCreateDir(null, 'Downloads'), callbacks),
        syncDir('F:/分类/139', getOrCreateDir(null, '139'), callbacks),
        syncDir('F:/分类/aliyun', getOrCreateDir(null, 'aliyun'), callbacks),
        syncDir('F:/分类/baidu', getOrCreateDir(null, 'baidu'), callbacks),
        syncDir('F:/分类/qbit', getOrCreateDir(null, 'qbit'), callbacks),
        syncDir('F:/分类/quark', getOrCreateDir(null, 'quark'), callbacks),
        syncDir('F:/分类/xunlei', getOrCreateDir(null, 'xunlei'), callbacks),
        syncDir('F:/分类/下载', getOrCreateDir(null, '下载'), callbacks),
        syncDir('F:/分类/有损压缩', getOrCreateDir(null, '有损压缩'), callbacks),
      ]);
    },
    state => {
      return `list: ${state.list}, stat: ${state.stat}, add: ${state.add}, change: ${state.change}, delete: ${state.delete}`;
    }
  );
}

test();

export async function real() {
  const app = express();
  const port = 4590;

  app.use(morgan('combined'));
  app.use(express.json());
  app.use(cors());

  // 初始化数据库

  // 注册TRPC API路由
  // app.use('/api', createExpressMiddleware({ router: appRouter, createContext: () => ({}) }));

  // Serve static files from the frontend dist directory
  app.use(express.static(path.join(__dirname, '../../dist')));

  // Handle SPA routing - serve index.html for any non-API routes
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
//export type AppRouter = typeof appRouter;
