# swell-calendar — Claude Code 指令

> 这是一个 React 日历组件库（monorepo），采用 Harness Engineering 方法论管理。
> 核心包在 `packages/calendar/`，导航入口是根目录和各包的 `AGENTS.md`。

## 架构原则（必须遵守）

分层架构，依赖只能向前（低层不能导入高层）：

```
types → constants → utils → time → model → store/slices/contexts → controller → helpers → hooks → Template → components
```

**添加功能前先确认文件放在哪一层，再写代码。**

## 禁止行为

- 不在 `types/`、`constants/`、`utils/`、`time/`、`model/` 中导入 React（层级违规）
- 不在组件（`components/`）里写业务逻辑（属于 `controller/`）
- 不用 `console.log`（ESLint 报错，组件库会污染宿主环境）
- 不把状态直接写在组件 useState（用 Zustand store 的对应 slice）
- 不创建超过 400 行的单文件（须拆分）

## 常见任务指南

### 新增事件类型/字段
1. 修改 `src/types/events.type.ts`（层 0）
2. 修改 `src/model/eventModel.ts`（层 4）
3. 修改 `src/controller/event.controller.ts`（层 6）

### 新增视图配置选项
1. 修改 `src/types/options.type.ts`
2. 修改 `src/slices/options.slice.ts`（初始值 + action）
3. 在对应视图组件读取选项

### 修改主题
- 修改 `src/slices/theme/theme.common.slice.ts`（通用）
- 修改 `src/slices/theme/theme.week.slice.ts`（周视图）
- 修改 `src/slices/theme/theme.month.slice.ts`（月视图）

### 新增拖拽逻辑
- 拖拽状态机在 `src/slices/dnd.slice.ts`
- 具体逻辑在 `src/hooks/TimeGrid/`
- 不要修改 DOM 事件；通过 `useDrag` hook 传递

### 修改事件布局算法
- 碰撞分组：`src/controller/core.controller.ts`
- 渲染位置计算：`src/controller/column.controller.ts`

## 验证命令

```bash
# 运行前先跑这些
node scripts/check-arch.mjs   # 架构约束
pnpm lint                      # ESLint
pnpm test                      # 单元测试
```

## 文件命名约定

- 组件：`PascalCase.tsx`
- hooks：`useCamelCase.ts`
- 类型文件：`*.type.ts`
- 切片文件：`*.slice.ts`
- 控制器：`*.controller.ts`
- 测试：`*.spec.ts`

## Git 约定

- 提交信息使用中文
- 不直接 commit/push，除非用户明确要求
- 分支格式：`feat/描述`、`fix/描述`

## 关于 Storybook

Stories 在 `packages/calendar/src/stories/`，随组件一起维护。
启动：`pnpm storybook`（需要 Node 20，脚本自动切换）
