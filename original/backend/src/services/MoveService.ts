import { MoveRuleModel } from '../db/models/MoveRule';
import { FileModel } from '../db/models/File';

// 移动状态类型
export interface MoveStatus {
  running: boolean;
  progress: number;
  totalFiles: number;
  movedFiles: number;
  currentFile: string;
  startTime: number;
  endTime: number | null;
}

// 移动服务类
export class MoveService {
  private static instance: MoveService;
  private status: MoveStatus = {
    running: false,
    progress: 0,
    totalFiles: 0,
    movedFiles: 0,
    currentFile: '',
    startTime: 0,
    endTime: null,
  };

  private constructor() {}

  // 单例模式
  static getInstance(): MoveService {
    if (!MoveService.instance) {
      MoveService.instance = new MoveService();
    }
    return MoveService.instance;
  }

  // 获取移动状态
  getStatus(): MoveStatus {
    return this.status;
  }

  // 开始移动
  startMove(): void {
    if (this.status.running) {
      return;
    }

    // 重置状态
    this.status = {
      running: true,
      progress: 0,
      totalFiles: 0,
      movedFiles: 0,
      currentFile: '',
      startTime: Date.now(),
      endTime: null,
    };

    // 异步执行移动
    this.move();
  }

  // 停止移动
  stopMove(): void {
    this.status.running = false;
    this.status.endTime = Date.now();
  }

  // 移动核心逻辑
  private async move(): Promise<void> {
    try {
      // 获取所有启用的移动规则
      const rules = MoveRuleModel.list().filter(rule => rule.enabled);

      // 获取所有文件
      const allFiles = FileModel.listRecurse('/');
      this.status.totalFiles = allFiles.length;

      // 处理每个文件
      for (let i = 0; i < allFiles.length; i++) {
        if (!this.status.running) {
          break;
        }

        const file = allFiles[i];
        this.status.currentFile = file.path + file.name;
        this.status.progress = Math.round(((i + 1) / allFiles.length) * 100);

        try {
          // 检查文件是否匹配任何规则
          for (const rule of rules) {
            if (this.matchesRule(file, rule.conditions)) {
              // TODO: 实现文件移动逻辑
              this.status.movedFiles++;
              break;
            }
          }
        } catch (error) {
          console.error(`Error processing file ${file.path + file.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Move error:', error);
    } finally {
      this.status.running = false;
      this.status.endTime = Date.now();
    }
  }

  // 检查文件是否匹配规则
  private matchesRule(file: any, conditions: string): boolean {
    // TODO: 实现规则匹配逻辑
    // 简化实现：检查文件标签是否包含规则中的所有标签
    const fileTags = file.tags.split(' ').filter((tag: string) => tag !== '');
    const ruleTags = conditions
      .split(' ')
      .filter((tag: string) => tag.startsWith('+'))
      .map((tag: string) => tag.substring(1));

    // 检查文件是否包含所有规则标签
    return ruleTags.every(tag => fileTags.includes(tag));
  }
}
