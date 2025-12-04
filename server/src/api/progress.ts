import { Router } from 'express';
import { webprogress } from '../utils/webprogress';

const router = Router();
export default router;

// 获取进度
router.get('/test', async (req, res) => {
  await webprogress({}, 16, res, async update => {
    try {
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log(`Progress updated ${i}`);
        update({ progress: i / 9, message: `Progress updated ${i}` });
      }
      console.log(`fin`);
      return { message: 'Progress completed' };
    } catch (error) {
      console.error('Error in progress test:', error);
      return { message: 'Error in progress test' };
    }
  });
});
