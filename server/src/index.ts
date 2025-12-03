import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import { init } from './db';

import fileRouter from './api/file';
import progressRouter from './api/progress';

const app = express();
const port = 4590;

app.use(morgan('combined'));
app.use(express.text({ type: () => true }));
app.use(cors());

// 初始化数据库
init();

// 使用文件路由
app.use('/api/file', fileRouter);

// 使用进度路由
app.use('/api/progress', progressRouter);

// Serve static files from the frontend dist directory
app.use(express.static(path.join(__dirname, '../../dist')));

// Handle SPA routing - serve index.html for any non-API routes
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
