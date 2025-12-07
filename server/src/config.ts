export interface SyncConfig {
  realPath: string;
  virtualName: string;
}

export const syncConfigs: SyncConfig[] = [
  { realPath: 'D:/Pictures/Screenshots', virtualName: 'Screenshots' },
  { realPath: 'D:/Pictures/Saved Pictures', virtualName: 'Saved Pictures' },
  { realPath: 'D:/Pictures/Camera Roll', virtualName: 'Camera Roll' },
  { realPath: 'D:/OneDrive', virtualName: 'OneDrive' },
  { realPath: 'D:/Downloads', virtualName: 'Downloads' },
  { realPath: 'F:/分类/139', virtualName: '139' },
  { realPath: 'F:/分类/aliyun', virtualName: 'aliyun' },
  { realPath: 'F:/分类/baidu', virtualName: 'baidu' },
  { realPath: 'F:/分类/qbit', virtualName: 'qbit' },
  { realPath: 'F:/分类/quark', virtualName: 'quark' },
  { realPath: 'F:/分类/xunlei', virtualName: 'xunlei' },
  { realPath: 'F:/分类/下载', virtualName: '下载' },
  { realPath: 'F:/分类/有损压缩', virtualName: '有损压缩' },
];
