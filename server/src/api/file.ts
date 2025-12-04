import { Router } from 'express';

const router = Router();
export default router;

router.post('/', async (req, res) => {
  const body = req.body;
  if (body === null) {
    res.status(400).send('Bad Request');
    return;
  }
});
