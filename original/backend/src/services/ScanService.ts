import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { SourceModel } from '../db/models/Source';
import { FileModel } from '../db/models/File';

// 扫描状态类型
export interface ScanStatus {
  running: boolean;
  progress: number;
  totalFiles: number;
  scannedFiles: number;
  currentFile: string;
  startTime: number;
  endTime: number | null;
}

// 扫描服务类
export class ScanService {
  private static instance: ScanService;
  private status: ScanStatus = {
    running: false,
    progress: 0,
    totalFiles: 0,
    scannedFiles: 0,
    currentFile: '',
    startTime: 0,
    endTime: null
  };

  private constructor() {}

  // 单例模式
  static getInstance(): ScanService {
    if (!ScanService.instance) {
      ScanService.instance = new ScanService();
    }
    return ScanService.instance;
  }

  // 获取扫描状态
  getStatus(): ScanStatus {
    return this.status;
  }

  // 开始扫描
  startScan(fullScan: boolean = false): void {
    if (this.status.running) {
      return;
    }

    // 重置状态
    this.status = {
      running: true,
      progress: 0,
      totalFiles: 0,
      scannedFiles: 0,
      currentFile: '',
      startTime: Date.now(),
      endTime: null
    };

    // 异步执行扫描
    this.scan(fullScan);
  }

  // 停止扫描
  stopScan(): void {
    this.status.running = false;
    this.status.endTime = Date.now();
  }

  // 扫描核心逻辑
  private async scan(_fullScan: boolean): Promise<void> {
    try {
      // 获取所有源文件夹
      const sources = SourceModel.list();
      
      // 收集所有文件
      const allFiles: Array<{
        sourceName: string;
        sourcePath: string;
        fullPath: string;
        relativePath: string;
      }> = [];

      // 首先遍历所有源文件夹，收集所有文件
      for (const source of sources) {
        this.collectFiles(source.name, source.path, allFiles);
      }

      this.status.totalFiles = allFiles.length;

      // 标记所有文件为已删除（后续会更新存在的文件）
      FileModel.markAllDelete();

      // 处理每个文件
      for (let i = 0; i < allFiles.length; i++) {
        if (!this.status.running) {
          break;
        }

        const fileInfo = allFiles[i];
        this.status.currentFile = fileInfo.fullPath;
        this.status.scannedFiles = i + 1;
        this.status.progress = Math.round((i + 1) / allFiles.length * 100);

        try {
          const stat = statSync(fileInfo.fullPath);
          const isDir = stat.isDirectory();
          
          // 检查文件是否已存在于数据库中
          const existingFile = FileModel.getPathName(
            fileInfo.relativePath,
            fileInfo.sourceName
          );

          if (existingFile) {
            // 更新现有文件
            FileModel.add(
              fileInfo.relativePath,
              fileInfo.sourceName,
              stat.size,
              stat.mtimeMs, // 使用mtimeMs获取时间戳
              stat.dev,
              stat.ino,
              null, // TODO: 实现校验和计算
              isDir,
              existingFile.tags
            );
          } else {
            // 添加新文件
            FileModel.add(
              fileInfo.relativePath,
              fileInfo.sourceName,
              stat.size,
              stat.mtimeMs, // 使用mtimeMs获取时间戳
              stat.dev,
              stat.ino,
              null, // TODO: 实现校验和计算
              isDir,
              ''
            );
          }
        } catch (error) {
          console.error(`Error processing file ${fileInfo.fullPath}:`, error);
        }
      }
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      this.status.running = false;
      this.status.endTime = Date.now();
    }
  }

  // 收集文件递归函数
  private collectFiles(sourceName: string, sourcePath: string, allFiles: any[]): void {
    try {
      const entries = readdirSync(sourcePath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(sourcePath, entry.name);
        const relativePath = `/${sourceName}/`;

        if (entry.isDirectory()) {
          // 跳过隐藏目录
          if (entry.name.startsWith('.')) {
            continue;
          }
          
          allFiles.push({
            sourceName,
            sourcePath,
            fullPath,
            relativePath
          });
          
          // 递归扫描子目录
          this.collectFiles(sourceName, fullPath, allFiles);
        } else {
          // 跳过隐藏文件
          if (entry.name.startsWith('.')) {
            continue;
          }
          
          allFiles.push({
            sourceName,
            sourcePath,
            fullPath,
            relativePath
          });
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${sourcePath}:`, error);
    }
  }
}
