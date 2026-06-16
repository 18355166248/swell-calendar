# 2026-06-16 scheduler 独立 workweek 支持

## 背景

当前 `week.workweek` 可控制周视图的工作日模式（隐藏周末列），但 scheduler 视图未独立支持该选项。需要在 `SchedulerOptions` 中新增 `workweek` 字段，让 scheduler 可以独立切换工作日模式，缺省时回退到 `week.workweek`。

## 目标

- `SchedulerOptions` 新增 `workweek?: boolean`，与 `hourStart/hourEnd` 保持一致的「scheduler 覆盖 week」回退语义
- Demo 中「显示周末」开关仅在周视图 / 资源调度视图下显示（日/月/时间线无意义）

## 非目标

- 不改变时间线视图的周末行为
- 不改变 `week.workweek` 在周视图的既有逻辑

## 影响范围

- 代码：
  - `packages/calendar/src/types/options.type.ts` — `SchedulerOptions.workweek` 新增
  - `packages/calendar/src/components/view/Scheduler.tsx` — 读取 `workweek` 并传入 `getWeekDates`
  - `apps/swell-calendar-s2/src/App.tsx` — 传递 `showWeekendToggle` 条件
  - `apps/swell-calendar-s2/src/overlays.tsx` — `SubBar` 新增 `showWeekendToggle` prop
- 文档：
  - `packages/calendar/SPEC.md` — `scheduler` 选项新增 `workweek`
- 运行时行为：
  - scheduler 开启 `workweek` 后隐藏周末列，关闭则显示
  - Demo SubBar 的「显示周末」开关仅在周/调度视图渲染

## 方案

1. 类型层：`SchedulerOptions` 新增 `workweek?: boolean`
2. 视图层：`Scheduler.tsx` 读取 `schedulerOptions?.workweek ?? weekOptions?.workweek`，传入 `getWeekDates`
3. Demo 层：`SubBar` 通过 `showWeekendToggle` prop 控制开关显隐

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`（不涉及架构变化）
- [ ] 新增或更新 ADR（无需 ADR）
- [x] 任务记录（本文件）

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] `pnpm -r exec tsc --noEmit`
- [ ] `pnpm test`

## 风险与回滚

- 风险：低。纯 additive 变更，不影响既有行为
- 回滚方式：revert commit
