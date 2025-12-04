import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import { init } from './db';
import { register } from './utils/apitype';
import type { InferAPI } from './utils/apitype';

import apidefs from './api';

const app = express();
const port = 4590;

app.use(morgan('combined'));
app.use(express.json());
app.use(cors());

// 初始化数据库
init();

// 注册API路由
const router = express.Router();
register(router, apidefs);
app.use('/api', router);
export type API = InferAPI<typeof apidefs>;

// Serve static files from the frontend dist directory
app.use(express.static(path.join(__dirname, '../../dist')));

// Handle SPA routing - serve index.html for any non-API routes
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
