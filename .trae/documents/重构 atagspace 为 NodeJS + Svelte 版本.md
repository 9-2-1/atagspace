# 重构计划：atagspace 为 NodeJS + Svelte 版本

## 1. 项目架构设计

### 1.1 技术栈

* **后端**：NodeJS + TypeScript + Express.js + tRPC

* **前端**：Svelte 5 + TypeScript

* **数据库**：better-sqlite3

* **包管理器**：pnpm

### 1.2 项目结构

```
├── backend/              # 后端代码
│   ├── src/
│   │   ├── db/           # 数据库模型和操作
│   │   ├── trpc/         # tRPC 路由和程序
│   │   ├── services/     # 业务逻辑服务
│   │   ├── utils/        # 工具函数
│   │   └── index.ts      # 后端入口
│   ├── package.json
│   └── tsconfig.json
├── frontend/             # 前端代码
│   ├── src/
│   │   ├── components/   # Svelte 组件
│   │   ├── routes/       # 路由
│   │   ├── stores/       # 状态管理
│   │   ├── trpc/         # tRPC 客户端
│   │   └── app.svelte    # 应用入口
│   ├── package.json
│   └── tsconfig.json
├── package.json          # 根项目配置
└── pnpm-workspace.yaml   # pnpm 工作区配置
```

## 2. 核心功能重构

### 2.1 数据库模型

**对应原始文件**：`atagspace/db.py`

使用 better-sqlite3 实现以下模型：

* Source：源文件夹配置

* File：文件信息和标签

* Category：标签分类

* Tag：标签信息

* MoveRule：文件移动规则

### 2.2 后端 API 设计

**对应原始文件**：`atagspace/web.py`

使用 tRPC 实现以下 API：

#### 文件管理

* `listFile`：列出文件

* `getFile`：获取文件详情

* `tagFile`：给文件打标签

* `tagFileChange`：修改文件标签

#### 标签管理

* `listCategories`：获取所有分类和标签

* `addCategory`：添加分类

* `updateCategory`：更新分类

* `deleteCategory`：删除分类

* `addTag`：添加标签

* `updateTag`：更新标签

* `deleteTag`：删除标签

#### 源文件夹管理

* `listSources`：获取所有源文件夹

* `addSource`：添加源文件夹

* `updateSource`：更新源文件夹

* `deleteSource`：删除源文件夹

#### 移动规则管理

* `listMoveRules`：获取所有移动规则

* `addMoveRule`：添加移动规则

* `updateMoveRule`：更新移动规则

* `deleteMoveRule`：删除移动规则

#### 文件扫描和移动

* `startScan`：开始扫描文件

* `getScanProgress`：获取扫描进度

* `startMove`：开始移动文件

* `getMoveProgress`：获取移动进度

### 2.3 前端界面设计

**对应原始文件**：`web/` 和 `web_ts/`

使用 Svelte 5 实现以下页面和组件：

#### 主页面

* 文件列表视图

* 标签管理面板

* 源文件夹配置

#### 组件

* 文件项组件

* 标签组件

* 分类管理组件

* 源文件夹配置组件

* 移动规则配置组件

* 进度条组件

### 2.4 核心功能实现

#### 文件扫描功能

* 使用 NodeJS 的 fs 模块扫描文件

* 实现增量扫描和全量扫描

* 使用 SSE 或 WebSocket 实时更新扫描进度

#### 标签管理功能

* 支持创建、编辑、删除分类和标签

* 支持给文件添加、删除标签

* 支持基于标签过滤文件

#### 文件移动功能

* 支持基于标签和规则移动文件

* 实现移动进度实时更新

#### 配置管理功能

* 支持在网页端配置源文件夹

* 支持在网页端配置移动规则

## 3. 重构步骤

### 3.1 项目初始化

1. 创建项目根目录和工作区配置
2. 初始化后端项目
3. 初始化前端项目
4. 配置 TypeScript 和 ESLint 和 Svelte-Check

### 3.2 数据库实现

1. 创建数据库模型
2. 实现数据库操作函数
3. 初始化数据库表结构

### 3.3 后端 API 实现

1. 配置 Express 服务器
2. 配置 tRPC
3. 实现核心 API 路由
4. 实现文件扫描和移动的业务逻辑

### 3.4 前端界面实现

1. 配置 Svelte 5 项目
2. 实现 tRPC 客户端
3. 实现核心组件
4. 实现页面路由
5. 实现状态管理

### 3.5 功能测试和优化

1. 测试核心功能
2. 优化性能
3. 修复 bug

## 4. 关键技术点

### 4.1 实时进度更新

使用 SSE（Server-Sent Events）或 WebSocket 实现文件扫描和移动的实时进度更新，提供良好的用户体验。

### 4.2 tRPC 统一 API

使用 tRPC 实现前后端 API 的类型安全，自动生成客户端代码，减少开发工作量。

### 4.3 Svelte 5 状态管理

利用 Svelte 5 的 reactive 和 stores 特性，实现高效的状态管理，减少不必要的重渲染。

### 4.4 数据库设计

保持与原始数据库结构的兼容性，同时优化查询性能，支持大规模文件管理。

## 5. 预期成果

1. 一个功能完整的文件标签管理工具
2. 前后端分离的架构，便于维护和扩展
3. 类型安全的 API 调用
4. 现代化的 Web 界面
5. 支持实时进度更新
6. 支持网页端配置管理

## 6. 后续扩展

1. 支持更多文件类型的预览
2. 支持批量操作
3. 支持标签导入导出
4. 支持文件查重功能
5. 支持自定义主题

通过以上重构计划，我们将把原始的 Python 项目重写为现代化的 NodeJS + Svelte 版本，提供更好的性能和用户体验。
