import { Router } from 'express';
import type { Json } from '../types';

const router = Router();
export default router;

router.post('/list', async (req, res) => {
  const body = req.body as Json;
  if (body === null) {
    res.status(400).send('Bad Request');
    return;
  }
});
