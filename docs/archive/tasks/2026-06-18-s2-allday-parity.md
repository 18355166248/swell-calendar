# 2026-06-18 s2 全天事件语义补齐

## 背景

`packages/calendar` 的 day / week 视图已经内建顶部 `allday` 行：显式 `allDay` / `allday` 事件会在时间栅格上方独立展示，不占满整列时间区。

但 `apps/swell-calendar-s2` 当前把宿主事件统一适配成 `category: 'time'`，并且在引擎回调 → 宿主草稿 → mock 数据源这条链路上没有保留 `allDay` 语义。结果是：

- 从月视图创建或编辑出来的全天跨天事件，进入 day / week 后会被当成普通时间事件；
- 事件整列铺满 `00:00-23:59`，严重影响阅读。

## 目标

- 在 `s2` 宿主数据模型中保留 `allDay` 语义。
- 让显式全天事件在 `packages/calendar` 的 day / week 现有 `allday` 行中展示。
- 不额外发明宿主层的"全天区"实现，直接复用引擎已有能力。

## 非目标

- 不修改 `packages/calendar` 的 day / week 视图结构。
- 不重做新建 / 编辑对话框的视觉设计。
- 不迁移历史 localStorage 中已丢失 `allDay` 标记的旧数据。

## 影响范围

- 代码：
  - `apps/swell-calendar-s2/src/data.ts`
  - `apps/swell-calendar-s2/src/calendarData.ts`
  - `apps/swell-calendar-s2/src/overlays.tsx`
- 文档：
  - 本任务文档
- 运行时行为：
  - 显式全天事件在 day / week 视图进入顶部全天行

## 现状

- `packages/calendar` 在 `event.controller.ts` 里只按显式 `allDay/isAllday` 判定全天，不再把"时长超过 24 小时"的 `time` 事件自动归到全天区。
- `s2` 的 `toCalendarEvents()` 当前把宿主事件统一映射为 `category: 'time'`，也没有透传 `allDay`。
- `engineEventToDraft()` / `inputToDraft()` / `engineEventToCreateInput()` 这条链路会把月视图全天事件的 `allDay` 标记丢掉。

## 方案

- 在 `CalEvent` / `EventDraft` / `NewEventInput` 链路中补 `allDay?: boolean`。
- `toCalendarEvents()`：
  - `allDay === true` 时映射为 `category: 'allday'` 并透传 `allDay: true`；
  - 否则保持 `time`。
- `engineEventToDraft()`：
  - 从引擎事件或原始宿主事件中保留 `allDay`。
- `engineEventToCreateInput()` / `inputToDraft()`：
  - 保证从月视图创建出的全天事件经过对话框确认后仍是全天事件；
  - 当用户把时间改成非全天范围时，自动降级为普通 `time` 事件。

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [x] `pnpm --filter swell-calendar-s2 exec tsc --noEmit`

## 风险与回滚

- 风险：
  - 对话框保存时若 `allDay` 判定不稳，可能把真实定时事件误判成全天。
  - 历史已写入的 mock 数据如果没有 `allDay` 字段，仍会按旧逻辑展示。
- 回滚方式：
  - 删除宿主数据模型中的 `allDay` 字段透传，回退到原始 `time` 映射。

## 实施结果

实现完成后补充：

- 实际改动：
  - `apps/swell-calendar-s2/src/data.ts` 的 `CalEvent` 新增 `allDay?: boolean`，宿主事件模型可以显式表达全天事件。
  - `apps/swell-calendar-s2/src/calendarData.ts` 补齐 `allDay` 贯通：`toCalendarEvents()` 会把宿主全天事件映射为引擎 `category: 'allday'`；`engineEventToDraft()` / `inputToDraft()` / `calEventToInput()` / `engineEventToCreateInput()` 都会保留这条语义。
  - `apps/swell-calendar-s2/src/overlays.tsx` 的 `NewEventInput` 新增 `allDay?: boolean`，保证从月视图创建出的全天事件经过对话框确认后仍能留在全天语义上。
- 与原计划的偏差：
  - 未额外改 `packages/calendar` 代码；本次问题确认是宿主适配丢失 `allDay` 语义，引擎本身已有顶部全天行能力。
- 验证结果：
  - `node scripts/check-docs.mjs` 通过。
  - `node scripts/check-arch.mjs` 通过。
  - `pnpm --filter swell-calendar-s2 exec tsc --noEmit` 通过。
- 剩余问题：
  - 旧 mock 数据里如果已经把原本的全天事件保存成了不带 `allDay` 的历史记录，刷新后仍会按普通时间事件显示；需要重新创建/编辑一次才能带上新语义。

## 追加：全天行主题化（同任务后续）

在 `allDay` 语义补齐后，全天行仍使用硬编码颜色（`#fafafa`、`#e8e8e8`、`#8c8c8c`），不支持宿主主题切换。本轮将全天行样式抽入 `week.allday` 主题。

### 影响范围

- 代码：
  - `packages/calendar/src/types/theme.type.ts` — 新增 `WeekAlldayTheme` 类型
  - `packages/calendar/src/slices/theme/theme.week.slice.ts` — 新增 `allday` 默认值
  - `apps/swell-calendar-s2/src/App.tsx` — 宿主注入 `allday` 主题变量
  - `packages/calendar/src/components/dayGrid/AlldayRow.tsx` — 全天行接入主题
  - `packages/calendar/src/components/scheduler/SchedulerAllDayLane.tsx` — scheduler 全天行接入主题
  - `packages/calendar/src/components/view/Scheduler.tsx` — 固定列宽模式下全天标签放入 gutter 列
  - `packages/calendar/src/css/dayGrid/allday.scss` — 移除硬编码颜色
  - `packages/calendar/src/css/timeline/timeline.scss` — 移除硬编码颜色

### 方案

- 新增 `WeekAlldayTheme` 类型，包含 `backgroundColor`、`borderBottom`、`labelColor`、`labelBorderRight` 四个字段。
- `theme.week.slice.ts` 初始化默认值与原来硬编码一致。
- `s2` 宿主通过 `App.tsx` 注入 CSS 变量驱动的 `allday` 主题。
- `AlldayRow` 在 day/week 视图才渲染「全天」标签（有左侧 gutter 时），scheduler 视图不重复渲染。
- `SchedulerAllDayLane` 在非固定列宽模式渲染自带标签；固定列宽模式标签由 `Scheduler.tsx` 的 gutter 列承载，保证全天事件内容列从 x=0 对齐。
- SCSS 中移除硬编码颜色，改为 inline style 注入主题值。

### 验证结果

- `node scripts/check-docs.mjs` 通过。
- `node scripts/check-arch.mjs` 通过。
- `pnpm --filter swell-calendar-s2 exec tsc --noEmit` 通过。
