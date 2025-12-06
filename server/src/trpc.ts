import * as api from './api';
import z from 'zod';

import { initTRPC } from '@trpc/server';

// 初始化 TRPC
export const t = initTRPC.create();

// 创建路由和过程
export const router = t.router;
export const publicProcedure = t.procedure;

// 创建文件路由
export const fileRouter = router({
  file: {
    list: publicProcedure
      .input(z.object({ parentId: z.bigint().nullable() }))
      .query(({ input: { parentId } }) => api.file.list(parentId)),
    describe: publicProcedure
      .input(z.object({ fileId: z.bigint(), description: z.string().nullable() }))
      .mutation(({ input: { fileId, description } }) => api.file.describe(fileId, description)),
    tag: {
      add: publicProcedure
        .input(z.object({ fileId: z.bigint(), tagIds: z.array(z.bigint()) }))
        .mutation(({ input: { fileId, tagIds } }) => api.file.tag.add(fileId, tagIds)),
      remove: publicProcedure
        .input(z.object({ fileId: z.bigint(), tagIds: z.array(z.bigint()) }))
        .mutation(({ input: { fileId, tagIds } }) => api.file.tag.delete(fileId, tagIds)),
      set: publicProcedure
        .input(z.object({ fileId: z.bigint(), tagIds: z.array(z.bigint()) }))
        .mutation(({ input: { fileId, tagIds } }) => api.file.tag.set(fileId, tagIds)),
      clear: publicProcedure
        .input(z.object({ fileId: z.bigint() }))
        .mutation(({ input: { fileId } }) => api.file.tag.clear(fileId)),
      list: publicProcedure
        .input(z.object({ fileId: z.bigint() }))
        .query(({ input: { fileId } }) => api.file.tag.list(fileId)),
    },
  },
  tag: {
    add: publicProcedure
      .input(z.object({ name: z.string(), categoryId: z.bigint() }))
      .mutation(({ input: { name, categoryId } }) => api.tag.add(name, categoryId)),
    rename: publicProcedure
      .input(z.object({ tagId: z.bigint(), name: z.string() }))
      .mutation(({ input: { tagId, name } }) => api.tag.rename(tagId, name)),
    move: publicProcedure
      .input(z.object({ tagId: z.bigint(), categoryId: z.bigint().nullable() }))
      .mutation(({ input: { tagId, categoryId } }) => api.tag.move(tagId, categoryId)),
    delete: publicProcedure
      .input(z.object({ tagId: z.bigint() }))
      .mutation(({ input: { tagId } }) => api.tag.delete(tagId)),
    color: publicProcedure
      .input(
        z.object({
          tagId: z.bigint(),
          foreground: z.string().nullable(),
          background: z.string().nullable(),
        })
      )
      .mutation(({ input: { tagId, foreground, background } }) =>
        api.tag.color(tagId, foreground, background)
      ),
    describe: publicProcedure
      .input(z.object({ tagId: z.bigint(), description: z.string().nullable() }))
      .mutation(({ input: { tagId, description } }) => api.tag.describe(tagId, description)),
    category: {
      add: publicProcedure
        .input(z.object({ name: z.string() }))
        .mutation(({ input: { name } }) => api.tag.category.add(name)),
      rename: publicProcedure
        .input(z.object({ categoryId: z.bigint(), name: z.string() }))
        .mutation(({ input: { categoryId, name } }) => api.tag.category.rename(categoryId, name)),
      delete: publicProcedure
        .input(z.object({ categoryId: z.bigint() }))
        .mutation(({ input: { categoryId } }) => api.tag.category.delete(categoryId)),
      color: publicProcedure
        .input(
          z.object({
            categoryId: z.bigint(),
            foreground: z.string().nullable(),
            background: z.string().nullable(),
          })
        )
        .mutation(({ input: { categoryId, foreground, background } }) =>
          api.tag.category.color(categoryId, foreground, background)
        ),
      describe: publicProcedure
        .input(z.object({ categoryId: z.bigint(), description: z.string().nullable() }))
        .mutation(({ input: { categoryId, description } }) =>
          api.tag.category.describe(categoryId, description)
        ),
    },
  },
  // source
  // rule
});
