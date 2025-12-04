import { Router } from 'express';
import * as z from 'zod';

export default function fastPostApi<Output, Input extends z.ZodType>(
  router: Router,
  path: string,
  schema: Input,
  fn: (req: z.output<Input>) => Output | Promise<Output>
) {
  router.post(path, async (req, res) => {
    try {
      const input: z.output<Input> = schema.parse(req.body);
      const output = await fn(input);
      res.json(output);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).send('Bad Request');
      }
    }
  });
}
