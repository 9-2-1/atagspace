import * as source from '../db/source';
import { Router } from 'express';
import * as z from 'zod';
import fastPostApi from '../utils/fastPostApi';

const router = Router();
export default router;

const SourceZ = z.object({ name: z.string(), path: z.string() });
fastPostApi(router, '/list', z.void(), source.list);
fastPostApi(router, '/add', SourceZ, source.add);
fastPostApi(router, '/delete', z.string(), source.delete);
