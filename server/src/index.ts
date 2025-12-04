import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import { init } from './db';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import appRouter from './api';

const app = express();
const port = 4590;

app.use(morgan('combined'));
app.use(express.json());
app.use(cors());

// 初始化数据库
init();

// 注册TRPC API路由
app.use('/api', createExpressMiddleware({ router: appRouter, createContext: () => ({}) }));

// Serve static files from the frontend dist directory
app.use(express.static(path.join(__dirname, '../../dist')));

// Handle SPA routing - serve index.html for any non-API routes
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export type AppRouter = typeof appRouter;
