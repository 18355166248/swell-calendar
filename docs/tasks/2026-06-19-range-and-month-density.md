# 2026-06-19 Month 事件密度与 Range 归一化

## 背景

当前仓库里，`month.visibleEventCount` 的类型与 controller 已经存在，但 `Month.tsx` 仍写死为 `4`，导致公开配置没有真正生效。

与此同时，`scheduler` 与 `timeline` 的可见日期窗口仍各自计算：

- `scheduler` 固定走 week/workweek 视图窗口
- `timeline` 固定展示 `renderDate` 所在自然月
- toolbar 的日期文案与 `navigate()` 的步进规则没有和这些窗口能力统一收口

如果继续在这个状态下往上叠功能，宿主可配置项、视图表现和导航语义会继续偏离。

## 目标

完成这一波 3 个能力收口：

1. 让 `month.visibleEventCount` 成为真正生效的公开能力
2. 为 `scheduler` 增加 `range` 配置，支持连续天窗口
3. 为 `timeline` 增加 `range` 配置，并把默认月导航 / 文案与自定义范围导航统一收口

## 非目标

- 不引入 `agenda`
- 不实现 `connections` / `eventList`
- 不调整 `scheduler` 的 `showAllDay` / `resourceGrouping`
- 不改 month 的 `+N 更多` 交互模型，只接通已有密度配置

## 影响范围

- 文档：
  - `docs/tasks/2026-06-19-range-and-month-density.md`
  - `docs/README.md`
  - `docs/agent-plan/plan.md`
  - `packages/calendar/SPEC.md`
- 运行时：
  - `packages/calendar/src/components/view/Month.tsx`
  - `packages/calendar/src/components/view/Scheduler.tsx`
  - `packages/calendar/src/components/view/Timeline.tsx`
  - `packages/calendar/src/components/toolbar/Toolbar.tsx`
  - `packages/calendar/src/slices/options.slice.ts`
  - `packages/calendar/src/slices/view.slice.ts`
  - `packages/calendar/src/time/`
- 测试：
  - `packages/calendar/src/controller/month.controller.spec.ts`
  - `packages/calendar/src/controller/timeline-calendar.spec.ts`
  - 新增 range / navigation 相关测试

## 方案

### 1. Month `visibleEventCount`

- 继续使用现有命名 `month.visibleEventCount`
- 默认值统一为 `4`
- `Month.tsx` 不再写死 `VISIBLE_EVENT_COUNT = 4`，改为读取归一化后的 `options.month.visibleEventCount`
- 继续复用 `getMonthEventRows(...)` 与 `MonthGrid` 的现有 overflow / `+N 更多` 逻辑

### 2. Scheduler `range`

- 新增 `scheduler.range?: number`
- 语义定义为：
  - 当未配置时，保持当前 week/workweek 行为
  - 当配置为正整数时，`scheduler` 显示从 `renderDate` 开始的连续 `range` 个可见日期
  - `workweek=true` 时，窗口收集过程中跳过周末列
- `navigate('prev'|'next')` 在 `scheduler.range` 生效时按“上一页 / 下一页可见窗口”步进，而不是固定 7 天
- toolbar 日期文案改为基于实际可见窗口计算

### 3. Timeline `range` + 默认导航归一

- 新增 `timeline.range?: number`
- 语义定义为：
  - 未配置时，保持当前“自然月”时间轴
  - 配置为正整数时，`timeline` 显示从 `renderDate` 开始的连续 `range` 天
- `navigate()` 归一为：
  - `timeline.range` 存在时按自定义窗口步进
  - 否则 timeline 按“整月”步进，而不是沿用当前的 7 天步进
- toolbar 日期文案同步：
  - 自然月模式显示 `YYYY年M月`
  - 自定义范围模式显示实际起止日期

### 共享落点

- 在 `time/` 层新增共享日期窗口工具，统一处理：
  - 连续可见日期收集
  - workweek 跳过周末
  - 前后页窗口起点计算
  - toolbar 日期文案所需的起止日期

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`
- [x] `docs/ARCHITECTURE.md` 无需变更（现有 `time/` → `range 归一化` 职责已覆盖本次落点）
- [x] ADR 无需变更（沿用现有 scheduler scope 决策）
- [x] 更新 `docs/agent-plan/plan.md`
- [x] 更新 `docs/README.md`

## 验证计划

- `node scripts/check-docs.mjs`
- `node scripts/check-arch.mjs`
- `pnpm --filter swell-calendar exec tsc --noEmit`
- `pnpm --filter swell-calendar test -- src/controller/month.controller.spec.ts`
- `pnpm --filter swell-calendar test -- src/controller/timeline-calendar.spec.ts`
- 补充 range / navigation 相关测试后，跑对应测试文件

## 风险与回滚

- 风险：
  - `scheduler.range` 与 `workweek` 组合后会改变日期窗口语义，若未统一到导航与文案，容易出现“渲染正确、翻页错误”的割裂
  - `timeline` 从固定月导航切到“月 / 自定义范围双模式”后，如果 toolbar 不同步，用户感知会混乱
- 回滚方式：
  - `month.visibleEventCount` 可直接回退为 `Month.tsx` 常量
  - `scheduler.range` / `timeline.range` 可移除新字段并恢复旧导航逻辑

## 实施结果

- 实际改动：
  - `Month.tsx` 改为读取 `options.month.visibleEventCount`，并把 month 默认值统一收口到 `4`
  - 新增 `time/view-range.ts`，统一连续日期窗口收集、workweek 跳过周末、前后页起点计算与窗口文案格式化
  - `Scheduler.tsx` 接入 `scheduler.range`
  - `Timeline.tsx` / `timeline-calendar.ts` 接入 `timeline.range`
  - 新增 Storybook 演示：
    - `Scheduler.Basic.stories.tsx` → `自定义日期窗口`
    - `Timeline.stories.tsx` → `自定义日期窗口`
  - `view.slice.ts` 改为：
    - `scheduler.range` 存在时按可见窗口翻页
    - `timeline.range` 存在时按可见窗口翻页
    - `timeline.range` 缺省时按整月翻页
  - `Toolbar.tsx` 改为基于实际可见窗口输出日期文案
  - 新增回归测试：
    - `src/components/view/Month.spec.tsx`
    - `src/components/toolbar/Toolbar.spec.tsx`

- 与原计划的偏差：
  - 没有新增独立的 month 密度 story，改为沿用现有月视图演示并用组件级回归测试覆盖 `visibleEventCount` 行为

- 验证结果：
  - `node scripts/check-docs.mjs` ✅
  - `node scripts/check-arch.mjs` ✅
  - `corepack pnpm --filter swell-calendar exec tsc --noEmit` ✅
  - `corepack pnpm --filter swell-calendar test -- src/components/view/Month.spec.tsx src/components/toolbar/Toolbar.spec.tsx src/controller/timeline-calendar.spec.ts src/controller/month.controller.spec.ts` ✅
    - 实际执行中 Vitest 全量跑过 `42` 个文件、`363` 个用例，全部通过

- 剩余问题：
  - 本次没有把 `agenda` / `connections` / `eventList` 拉入近期范围；若后续要做，仍需先更新一级真源
