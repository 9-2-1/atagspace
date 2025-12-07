import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import * as api from './api';

import { syncDir } from './service/scan';
import { getOrCreateDir } from './utils/file/dir';
import type { Callbacks } from './service/scan';
import cliprogress from './utils/progress/cliprogress';
import { syncConfigs } from './config';

import { registerAPIs } from './utils/apiproxy/server';
import type { APIdef, BeAwait } from './utils/apiproxy/server';

async function test() {
  // 同步目录
  const state = { list: 0, stat: 0, add: 0, change: 0, delete: 0, recover: 0, current: '' };
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
        onStat: (file, stat, path) => {
          state.current = path;
          state.stat++;
          update(state);
        },
        onRecover: (file, path) => {
          console.log(`${path}: recover tags from ${file?.name}`);
          state.recover++;
          update(state);
        },
      };
      await Promise.all(
        syncConfigs.map(config =>
          syncDir(config.realPath, getOrCreateDir(null, config.virtualName), callbacks)
        )
      );
    },
    state => {
      return `${state.stat} +${state.add} -${state.delete} ~${state.recover} ${state.current}`;
    }
  );
}

if (process.argv.includes('--test')) {
  test();
} else {
  main();
}

export type APIType = BeAwait<typeof api>;

export async function main() {
  const app = express();
  const port = 4590;

  app.use(morgan('combined'));
  app.use(express.json());
  app.use(cors());

  // 初始化数据库
  // db.init()

  const router = express.Router();
  registerAPIs(router, '', api as unknown as APIdef);
  app.use('/api', router);

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
