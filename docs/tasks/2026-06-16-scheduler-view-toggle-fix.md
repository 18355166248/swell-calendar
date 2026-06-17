# 2026-06-16 scheduler 视图切换修复与 UX 优化

## 背景

1. **视图切换网格塌缩**：切换视图后，`dayGridRows` 残留上一个视图的面板高度（如 `scheduler-header`），导致 `getRestPanelHeight` 计算 time 面板高度时多扣了陈旧值，网格塌缩为零。
2. **scheduler 双时间轴**：固定列宽模式下，scheduler 外层渲染独立 sticky 时间轴，内层 `TimeGrid` 也渲染自己的时间轴，导致双时间轴且网格与表头错位。
3. **scheduler 今天无高亮**：周/日/月视图有今天高亮样式，scheduler header 缺少。

## 目标

- 修复切换视图时的网格塌缩，通过 `pruneDayGridRows` 裁剪陈旧面板高度
- 新增 `TimeGrid.hideGutter` prop，scheduler 固定列宽模式下隐藏内层时间轴
- scheduler header 日期标签增加今天高亮

## 非目标

- 不改动 `getRestPanelHeight` 的计算逻辑本身
- 不改变其他视图的 TimeGrid 行为

## 影响范围

- 代码：
  - `packages/calendar/src/types/layout.type.ts` — 新增 `pruneDayGridRows`
  - `packages/calendar/src/slices/layout.slice.ts` — 实现 `pruneDayGridRows`
  - `packages/calendar/src/components/Layout.tsx` — `useLayoutEffect` 中调用裁剪
  - `packages/calendar/src/components/timeGrid/TimeGridView.tsx` — 新增 `hideGutter` prop
  - `packages/calendar/src/components/view/Scheduler.tsx` — 传入 `hideGutter`
  - `packages/calendar/src/components/scheduler/SchedulerHeader.tsx` — 今天高亮样式
  - `packages/calendar/src/css/timeline/timeline.scss` — `.scheduler-header-day-label-today`
- 文档：
  - 本任务文档
- 运行时行为：
  - 切换视图后网格不再塌缩
  - scheduler 固定列宽模式无重复时间轴
  - scheduler header 今天日期高亮

## 方案

1. **pruneDayGridRows**：Layout 挂载后收集当前面板 name 集合，裁剪 `dayGridRows` 中不在集合内的陈旧 key
2. **hideGutter**：`TimeGrid` 新增布尔 prop，为 true 时跳过内部 `<TimeColumn>` 渲染，gutter 宽度置 0
3. **今天高亮**：`SchedulerHeader` 计算 `isToday`，添加 `scheduler-header-day-label-today` class，颜色回退 theme color

## 文档变更

- [x] 任务记录（本文件）
- [ ] 更新 `packages/calendar/SPEC.md`（内部实现，不涉及公开 API 变更）
- [ ] 更新 `docs/ARCHITECTURE.md`（不涉及架构变化）

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] `pnpm -r exec tsc --noEmit`

## 风险与回滚

- 风险：低。`pruneDayGridRows` 仅在 Layout effect 中裁剪不存在面板的 key
- 回滚方式：revert commit
