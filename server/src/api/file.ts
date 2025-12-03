import { Router } from 'express';
import type { Json } from '../types';
import { file as db_file } from '../db';

const router = Router();
export default router;

router.post('/list', async (req, res) => {
  const body = req.body as Json;
  if (body === null || typeof body !== 'object' || !('parentId' in body)) {
    res.status(400).send('Bad Request');
    return;
  }
  
  const parentId = body.parentId as number;
  try {
    const files = db_file.list(parentId);
    res.json({ success: true, data: files });
  } catch (error) {
    console.error('Error in file/list:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 获取文件详情
router.post('/get', async (req, res) => {
  const body = req.body as Json;
  if (body === null || typeof body !== 'object' || !('id' in body)) {
    res.status(400).send('Bad Request');
    return;
  }
  
  const id = body.id as number;
  try {
    const file = db_file.get(id);
    if (file) {
      res.json({ success: true, data: file });
    } else {
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('Error in file/get:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 创建文件或目录
router.post('/create', async (req, res) => {
  const body = req.body as Json;
  if (body === null || typeof body !== 'object' || !('parentId' in body) || !('name' in body) || !('isDir' in body)) {
    res.status(400).send('Bad Request');
    return;
  }
  
  const parentId = body.parentId as number;
  const name = body.name as string;
  const isDir = body.isDir as number;
  
  try {
    const result = db_file.create(parentId, name, isDir);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    console.error('Error in file/create:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 重命名文件
router.post('/rename', async (req, res) => {
  const body = req.body as Json;
  if (body === null || typeof body !== 'object' || !('id' in body) || !('name' in body)) {
    res.status(400).send('Bad Request');
    return;
  }
  
  const id = body.id as number;
  const name = body.name as string;
  
  try {
    db_file.rename(id, name);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in file/rename:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 移动文件
router.post('/move', async (req, res) => {
  const body = req.body as Json;
  if (body === null || typeof body !== 'object' || !('id' in body) || !('parentId' in body)) {
    res.status(400).send('Bad Request');
    return;
  }
  
  const id = body.id as number;
  const parentId = body.parentId as number;
  
  try {
    db_file.move(id, parentId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in file/move:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 设置文件描述
router.post('/set_description', async (req, res) => {
  const body = req.body as Json;
  if (body === null || typeof body !== 'object' || !('id' in body)) {
    res.status(400).send('Bad Request');
    return;
  }
  
  const id = body.id as number;
  const description = body.description as string | null;
  
  try {
    db_file.set_description(id, description);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in file/set_description:', error);
    res.status(500).send('Internal Server Error');
  }
});
