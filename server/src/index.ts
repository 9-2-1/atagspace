import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import { init } from './db';

import categoryRouter from './api/category';
import checksumRouter from './api/checksum';
import fileDeletedRouter from './api/file_deleted';
import fileTagRouter from './api/file_tag';
import fileRouter from './api/file';
import progressRouter from './api/progress';
import sourceRouter from './api/source';
import tagRouter from './api/tag';

const app = express();
const port = 4590;

app.use(morgan('combined'));
app.use(express.text({ type: () => true }));
app.use(cors());

// 初始化数据库
init();

app.use('/api/category', categoryRouter);
app.use('/api/checksum', checksumRouter);
app.use('/api/file/deleted', fileDeletedRouter);
app.use('/api/file/tag', fileTagRouter);
app.use('/api/file', fileRouter);
app.use('/api/progress', progressRouter);
app.use('/api/source', sourceRouter);
app.use('/api/tag', tagRouter);

// Serve static files from the frontend dist directory
app.use(express.static(path.join(__dirname, '../../dist')));

// Handle SPA routing - serve index.html for any non-API routes
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
