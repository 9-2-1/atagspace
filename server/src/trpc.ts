import { initTRPC } from '@trpc/server';

// 初始化 TRPC
export const t = initTRPC.create();

// 创建路由和过程
export const router = t.router;
export const publicProcedure = t.procedure;
