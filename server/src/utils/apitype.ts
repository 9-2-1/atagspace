import { Router } from 'express';
import * as z from 'zod';

export type APIfn<InputZ extends z.ZodType = z.ZodType, Output = unknown> = Readonly<{
  type: 'fn';
  fn: (input: z.infer<InputZ>) => Output | Promise<Output>;
  input: InputZ;
}>;
export function fn<InputZ extends z.ZodType = z.ZodType, Output = unknown>(
  input: InputZ,
  fn: (input: z.infer<InputZ>) => Output | Promise<Output>
): APIfn<InputZ, Output> {
  return { type: 'fn', input, fn };
}

export type APIfnTreeA<T> = Readonly<{ type: 'tree'; items: T }>;
export function tree<T>(items: T): APIfnTreeA<T> {
  return { type: 'tree', items };
}

export type InferAPI<Fns> =
  Fns extends APIfn<infer InputZ, infer Output>
    ? (input: z.infer<InputZ>) => Promise<Output>
    : Fns extends APIfnTreeA<infer T>
      ? { [K in keyof T]: InferAPI<T[K]> }
      : never;

export function register(
  router: Router,
  // 这里使用any是因为APIfnTreeA的类型参数是递归的，无法在编译时确定
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api: any,
  path: string = ''
) {
  if (api.type === 'fn') {
    router.post(path, async (req, res) => {
      const input = api.input.parse(req.body);
      const output = await api.fn(input);
      res.json(output);
    });
  } else if (api.type === 'tree') {
    for (const [key, item] of Object.entries(api.items)) {
      register(router, item, path + '/' + key);
    }
  }
}
