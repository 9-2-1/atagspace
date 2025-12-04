import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { FileModel } from '../db/models/File';
import { SourceModel } from '../db/models/Source';
import { CategoryModel, TagModel } from '../db/models/CategoryTag';
import { MoveRuleModel } from '../db/models/MoveRule';
import { ScanService } from '../services/ScanService';
import { MoveService } from '../services/MoveService';

const t = initTRPC.create();

// 路由定义
const appRouter = t.router({
  // 文件管理
  listFile: t.procedure
    .input(
      z.object({
        path: z.string(),
        filter: z.string().optional().default(''),
        recurse: z.boolean().optional().default(false),
        limit: z.number().optional().default(1000)
      })
    )
    .query(({ input }) => {
      const { path, recurse } = input;
      if (recurse) {
        return FileModel.listRecurse(path);
      }
      return FileModel.list(path);
    }),

  tagFile: t.procedure
    .input(
      z.object({
        id: z.number(),
        tags: z.array(z.string())
      })
    )
    .mutation(({ input }) => {
      const { id, tags } = input;
      FileModel.setTags(id, tags.join(' '));
    }),

  tagFileChange: t.procedure
    .input(
      z.object({
        id: z.number(),
        adds: z.array(z.string()),
        removes: z.array(z.string())
      })
    )
    .mutation(({ input }) => {
      const { id, adds, removes } = input;
      const currentTags = FileModel.getTags(id);
      const tagList = currentTags.split(' ').filter(tag => tag !== '');
      
      // 添加新标签
      for (const tag of adds) {
        if (!tagList.includes(tag)) {
          tagList.push(tag);
        }
      }
      
      // 移除标签
      const newTags = tagList.filter(tag => !removes.includes(tag)).join(' ');
      FileModel.setTags(id, newTags);
    }),

  // 标签管理
  listCategories: t.procedure
    .query(() => {
      const categories = CategoryModel.list();
      return categories.map(category => {
        const tags = TagModel.list(category.name);
        return {
          ...category,
          tags
        };
      });
    }),

  addCategory: t.procedure
    .input(
      z.object({
        name: z.string(),
        color: z.string().optional().nullable()
      })
    )
    .mutation(({ input }) => {
      CategoryModel.set(input.name, input.color ?? null);
    }),

  updateCategory: t.procedure
    .input(
      z.object({
        name: z.string(),
        color: z.string().optional().nullable()
      })
    )
    .mutation(({ input }) => {
      CategoryModel.set(input.name, input.color ?? null);
    }),

  renameCategory: t.procedure
    .input(
      z.object({
        oldName: z.string(),
        newName: z.string()
      })
    )
    .mutation(({ input }) => {
      CategoryModel.rename(input.oldName, input.newName);
    }),

  deleteCategory: t.procedure
    .input(z.string())
    .mutation(({ input }) => {
      CategoryModel.remove(input);
    }),

  addTag: t.procedure
    .input(
      z.object({
        name: z.string(),
        category: z.string()
      })
    )
    .mutation(({ input }) => {
      TagModel.set(input.name, input.category);
    }),

  updateTagColor: t.procedure
    .input(
      z.object({
        name: z.string(),
        color: z.string().optional().nullable()
      })
    )
    .mutation(({ input }) => {
      TagModel.setColor(input.name, input.color ?? null);
    }),

  deleteTag: t.procedure
    .input(z.string())
    .mutation(({ input }) => {
      TagModel.remove(input);
    }),

  // 源文件夹管理
  listSources: t.procedure
    .query(() => {
      return SourceModel.list();
    }),

  addSource: t.procedure
    .input(
      z.object({
        name: z.string(),
        path: z.string()
      })
    )
    .mutation(({ input }) => {
      SourceModel.add(input.name, input.path);
    }),

  updateSource: t.procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        path: z.string()
      })
    )
    .mutation(({ input }) => {
      SourceModel.update(input.id, input.name, input.path);
    }),

  deleteSource: t.procedure
    .input(z.number())
    .mutation(({ input }) => {
      SourceModel.delete(input);
    }),

  // 移动规则管理
  listMoveRules: t.procedure
    .query(() => {
      return MoveRuleModel.list();
    }),

  addMoveRule: t.procedure
    .input(
      z.object({
        name: z.string(),
        conditions: z.string(),
        targetPath: z.string(),
        enabled: z.boolean().optional().default(true)
      })
    )
    .mutation(({ input }) => {
      MoveRuleModel.add(input.name, input.conditions, input.targetPath, input.enabled);
    }),

  updateMoveRule: t.procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        conditions: z.string(),
        targetPath: z.string(),
        enabled: z.boolean()
      })
    )
    .mutation(({ input }) => {
      MoveRuleModel.update(input.id, input.name, input.conditions, input.targetPath, input.enabled);
    }),

  deleteMoveRule: t.procedure
    .input(z.number())
    .mutation(({ input }) => {
      MoveRuleModel.delete(input);
    }),

  toggleMoveRule: t.procedure
    .input(
      z.object({
        id: z.number(),
        enabled: z.boolean()
      })
    )
    .mutation(({ input }) => {
      MoveRuleModel.enable(input.id, input.enabled);
    }),

  // 文件扫描管理
  startScan: t.procedure
    .input(
      z.object({
        fullScan: z.boolean().optional().default(false)
      })
    )
    .mutation(({ input }) => {
      const scanService = ScanService.getInstance();
      scanService.startScan(input.fullScan);
    }),

  stopScan: t.procedure
    .mutation(() => {
      const scanService = ScanService.getInstance();
      scanService.stopScan();
    }),

  getScanStatus: t.procedure
    .query(() => {
      const scanService = ScanService.getInstance();
      return scanService.getStatus();
    }),

  // 文件移动管理
  startMove: t.procedure
    .mutation(() => {
      const moveService = MoveService.getInstance();
      moveService.startMove();
    }),

  stopMove: t.procedure
    .mutation(() => {
      const moveService = MoveService.getInstance();
      moveService.stopMove();
    }),

  getMoveStatus: t.procedure
    .query(() => {
      const moveService = MoveService.getInstance();
      return moveService.getStatus();
    })
});

export type AppRouter = typeof appRouter;
export { appRouter };
