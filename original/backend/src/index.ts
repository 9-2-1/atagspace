import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/router';
import { initDatabase } from './db';

const app = express();
const PORT = 3000;

// 初始化数据库
initDatabase();

// 配置tRPC中间件
app.use('/api', createExpressMiddleware({ router: appRouter, createContext: () => ({}) }));

// 静态文件服务（用于前端构建后的文件）
app.use(express.static('../frontend/dist'));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
