# 2026-06-09 Storybook demo 精简（只保留可拖拽交互）

## 背景

`2026-06-07-storybook-sidebar-cleanup` 对 Storybook 做了分类与中文化，但保留了大量「纯展示、不可拖拽」的 story。
实际演示与回归场景中，这类静态 story 价值低、噪音高，且容易让人误以为该视图不支持交互
（例如 timeline 整页应用只给 store、未接回调写回，横条拖不动）。

本次只裁剪 Storybook 展示层，不改组件能力与交互行为。

## 目标

- 删除所有「纯展示、无拖拽/交互」的 story，只保留真正演示拖拽 / resize / 交互的 demo。
- 同步清理因 story 删除而产生的死代码（未用 helper、常量、导入）。

## 非目标

- 不修改 `packages/calendar/SPEC.md`，本次无产品能力和 API 变化。
- 不改任何拖拽 / resize / 交互逻辑与自动化断言。
- 不动保留 story 的 `meta.title` / `name`（story id 不变）。

## 影响范围

- 代码：
  - `packages/calendar/src/stories/Calendar/*.stories.tsx`
  - `packages/calendar/src/stories/Calendar/Scheduler.shared.tsx`
- 文档：
  - 本任务文档
- 运行时行为：
  - 仅减少 Storybook 左侧 story 数量，保留的 demo 行为不变。

## 方案

- 删除整文件（该视图无任何拖拽 story）：
  - `Month.stories.tsx`（基础视图 / 工作周）
  - `Scheduler.Constraints.stories.tsx`（禁止时段 / 无效时段 / 重叠策略 / 缓冲时间 / 可见资源 / 资源分组 / 共享事件）
- 删除纯静态 story（保留所在文件）：
  - 日 / 周 / 时间线视图的 `基础视图`、周视图 `工作周`
  - 调度器 `基础视图`、`全天与跨天`、`模板渲染`、`重复事件展开`、`时区渲染`、`重复事件编辑作用域`
  - App `时间线整页应用`（store 驱动 + timeline 受控，未接回调 → 不可拖）
- 保留全部可拖拽 / 交互 demo：各视图 `垂直拖拽`/`跨天拖拽`/`调整时长`/`ESC 取消`、
  时间线 `受控拖拽与 resize`、调度器 `受控增删改`/`时间提示与排序`/`交互回调`/`删除事件`/`键盘导航`/`外部拖入模拟`/`跨实例拖拽`/`拖拽与调整回归`/`真实指针回归`、App `周视图整页应用`。
- 死代码清理：补回被保留 story 仍依赖、却落在删除区间内的 helper
  （`DELETE_EVENTS`、`buildRegressionEvents`、`REGRESSION_RESOURCES`、`centerOf`、`pointerGesture`）；
  删除孤儿常量 `OVERLAP_EVENTS`、未用导入 `useRef`/`TEMPLATE_RESOURCES`/`applyRecurrenceEditScope`；
  各视图 story 的 `meta.component` 由 `Wrapper` 收敛为 `Calendar`，移除随之失效的导入。

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [x] `node_modules/.bin/eslint`（改动 story 文件）
- [x] `node_modules/.bin/tsc -p packages/calendar/tsconfig.json --noEmit`

## 风险与回滚

- 风险：被删 story 的固定书签 / 脚本入口 URL 失效。
- 回滚方式：从本提交还原对应 story 文件与 `Scheduler.shared.tsx`。

## 实施结果

- 实际删除 2 个整文件 + 多个纯静态 story；`Scheduler.shared.tsx` 由 2959 行收敛到约 1230 行。
- 保留 demo 全部为可拖拽 / 交互场景，行为与断言未改。
- 验证结果：`check-docs`、`check-arch`、`tsc`、`eslint` 均通过（0 error / 0 warning）。
- 剩余问题：命令行环境未连活动的 Storybook dev server，未直接截图核对左侧导航；源码与类型层已收敛。
