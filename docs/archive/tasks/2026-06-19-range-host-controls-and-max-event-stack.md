# 2026-06-19 Range 宿主控制与 Month 堆叠命名统一

## 背景

`range`、`scheduler.range`、`timeline.range` 与 month 事件堆叠能力已经在 `packages/calendar` 中落地，但当前仍有两个明显缺口：

1. `apps/swell-calendar-s2` 只是通过常量显式消费 `range` / month 事件密度，宿主用户无法在页面内直接调节这些能力。
2. month 事件密度的公开命名目前仍以 `visibleEventCount` 为主，而 backlog 与产品语义更接近 `maxEventStack`，包层和宿主层还没有统一到同一套术语。

如果继续保持这个状态，宿主演示会停留在“代码可配、页面不可配”，同时 month 相关能力的公开语义也会继续分裂。

## 目标

完成这一波 2 个能力收口：

1. 在 `packages/calendar` 中把 `month.maxEventStack` 收敛成新的公开语义名，并兼容旧字段 `visibleEventCount`
2. 在 `apps/swell-calendar-s2` 中把 month 堆叠数、`scheduler.range`、`timeline.range` 暴露成宿主可调的设置面板 UI

## 非目标

- 不新增 `showAllDay` / `cellWidth` / `resourceGrouping` 控件
- 不把 `range` 推到 week / day 宿主设置里
- 不移除 `visibleEventCount` 兼容入口
- 不修改 month `+N 更多` 的交互模式

## 影响范围

- 文档：
  - `docs/tasks/2026-06-19-range-host-controls-and-max-event-stack.md`
  - `docs/README.md`
  - `docs/MIGRATION.md`
  - `docs/agent-plan/plan.md`
  - `packages/calendar/SPEC.md`
- `packages/calendar`：
  - `src/types/options.type.ts`
  - `src/slices/options.slice.ts`
  - `src/components/view/Month.tsx`
  - month 相关测试
- `apps/swell-calendar-s2`：
  - `src/appCalendarConfig.ts`
  - `src/App.tsx`
  - `src/overlays.tsx`
  - `src/styles/app.css`
  - 宿主配置 / 设置面板测试

## 方案

### 1. Month 命名统一

- 新增 `month.maxEventStack?: number`
- 命名语义：
  - `maxEventStack`：新的主名，表示月视图每格默认最多直接显示多少条事件
  - `visibleEventCount`：兼容别名，表示相同行为
- 归一化规则：
  - `maxEventStack` 优先
  - 未提供 `maxEventStack` 时回退到 `visibleEventCount`
  - 两者都未提供时默认值为 `4`
- 文档与宿主示例统一改写为 `maxEventStack`

### 2. 宿主控制与 UI 暴露

- 在 `apps/swell-calendar-s2` 新增宿主级“日历布局偏好”状态：
  - `monthMaxEventStack`
  - `schedulerRange`
  - `timelineRange`
- 这些状态进入设置面板，支持实时切换并驱动：
  - `buildCalendarOptions(...)`
  - `computeViewTitle(...)`
  - 顶栏标题 / 副标题
- 页面行为：
  - month：调节后更早或更晚出现 `+N 更多`
  - scheduler：标题、副标题、日期列数与翻页步进一起变化
  - timeline：标题、副标题、日期列数与翻页步进一起变化

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`
- [x] 更新 `docs/MIGRATION.md`
- [x] 更新 `docs/agent-plan/plan.md`
- [x] 更新 `docs/README.md`
- [x] `docs/ARCHITECTURE.md` 无需变更（现有分层已覆盖：API 归一化在 `types/slices`，宿主 UI 在 app）

## 验证计划

- `node scripts/check-docs.mjs`
- `node scripts/check-arch.mjs`
- `corepack pnpm --filter swell-calendar exec tsc --noEmit`
- `corepack pnpm --filter swell-calendar test -- src/components/view/Month.spec.tsx src/controller/month.controller.spec.ts`
- `corepack pnpm --filter swell-calendar-s2 test -- src/appCalendarConfig.spec.ts`

## 风险与回滚

- 风险：
  - 若 `maxEventStack` 与 `visibleEventCount` 优先级不明确，宿主会出现“配置改了但月视图不变”的歧义
  - 若宿主标题仍继续读取旧常量，UI 控件会和实际渲染窗口脱节
- 回滚方式：
  - 包层可移除 `maxEventStack` 并恢复仅 `visibleEventCount`
  - 宿主设置面板可移除新增控件并回退到固定常量

## 实施结果

- 实际改动：
  - `packages/calendar` 新增 `month.maxEventStack`，并将 `visibleEventCount` 收口为兼容别名
  - `initializeMonthOptions(...)` 统一按 `maxEventStack > visibleEventCount > 默认 4` 归一化
  - `Month.tsx` 改为直接消费归一化后的 `maxEventStack`
  - `apps/swell-calendar-s2` 新增宿主级 `calendarTuning` 状态与本地持久化
  - `SettingsPanel` 现在可直接调节：
    - 月视图堆叠数
    - `scheduler.range`
    - `timeline.range`
  - `computeViewTitle(...)` / `buildCalendarOptions(...)` 改为读取宿主 tuning，而不是写死常量

- 新增 / 更新验证：
  - `Month.spec.tsx` 新增 `maxEventStack` 优先级回归
  - `appCalendarConfig.spec.ts` 改为验证宿主 tuning 会真正驱动 options 与标题文案

- 验证结果：
  - `node scripts/check-docs.mjs` ✅
  - `node scripts/check-arch.mjs` ✅
  - `corepack pnpm --filter swell-calendar exec tsc --noEmit` ✅
  - `corepack pnpm --filter swell-calendar test -- src/components/view/Month.spec.tsx` ✅
  - `corepack pnpm --filter swell-calendar-s2 test` ✅
  - `corepack pnpm --filter swell-calendar-s2 build` ✅

- 剩余问题：
  - 本次只把 `range` 与 month 堆叠数暴露到宿主设置面板，`showAllDay` / `cellWidth` / `resourceGrouping` 仍是后续项
  - `visibleEventCount` 仍保留兼容窗口；如果后续要正式移除，需要单独推进迁移阶段并更新 `MIGRATION.md`
