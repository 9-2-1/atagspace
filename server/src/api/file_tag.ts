import * as file_tag from '../db/file_tag';
import { Router } from 'express';
import * as z from 'zod';
import fastPostApi from '../utils/fastPostApi';

const router = Router();
export default router;

fastPostApi(router, '/clear', z.number(), file_tag.clear);
