# 数据持久化（IndexedDB）

## 功能概述
- 自动加载上次保存的 JSON 文本
- 文本变更去抖同步到 IndexedDB
- 跨浏览器标签页广播同步
- IndexedDB 不可用时回退到 localStorage

## 存储设计
- 数据库：`json4u`
- 仓库：`kv`
- 键：`lastDoc`
- 值：`{ text: string, timestamp: number, version?: number }`

## API
- `getLastDocument(): Promise<{ text: string, timestamp: number, version?: number } | null>`
- `setLastDocument(text: string, version?: number): Promise<void>`
- `clearLastDocument(): Promise<void>`

## 集成点
- 首屏加载：`useDisplayExample` 优先加载 `lastDoc`，否则展示示例
- 自动写入：`usePersistDoc` 订阅树版本变化，去抖保存并广播
- 广播监听：收到更新后拉取最新文本并无格式写入编辑器

## 错误与回退
- `InvalidStateError`：回退至 `localStorage` 的同名键
- 读写异常：记录日志并保持编辑体验不中断

## 测试
- 单元：读写与异常回退
- E2E：
  - 关闭标签页后恢复
  - 跨标签页同步
  - 不同数据量采样

## 兼容性
- 不改变解析与树结构，使用原始文本保存
- 与现有配置持久化互不影响
