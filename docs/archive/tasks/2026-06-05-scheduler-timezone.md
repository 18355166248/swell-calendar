# 2026-06-05 Phase 3 Step 33 — scheduler timezone 接入渲染链

## 背景

`EventObject.timezone` 字段已在类型层存在（`events.type.ts:88`），`EventModel` 也在构造时保存了该字段（`eventModel.ts:54,113`），但当前整个渲染链完全未使用该字段。`DayjsTZDate` 底层已具备完整的时区转换能力（`tz()` / `local()` / `tzOffset`），dayjs 的 `utc` / `timezone` 插件也已加载。

本步将 **数据时区 → 显示时区** 转换接入 scheduler 渲染链，使宿主可以：
- 传入带 `timezone` 字段的事件（如：该事件是东京时间 9:00 AM 的会议）
- 配置 scheduler 的 `displayTimezone`（如：用户当前在纽约看日历）
- 组件自动将事件时间转换后渲染到正确的 hour grid 位置

## 目标

- 新增 `SchedulerOptions.displayTimezone` 选项字段
- 新建 `time/timezone.ts`：时区转换纯函数（数据时区 → 显示时区）
- 在 `scheduler-layout.ts` 的 pipeline 中接入转换：进入 `getSchedulerViewEvents` 前或内部完成转换
- 非 timezone 事件（`timezone` 字段缺失或 `displayTimezone` 未配置）行为完全不变
- 新增 `Scheduler/Timezone` Storybook 直观验证

## 非目标

- 不进入 `recurrence` / `external DnD` / `跨实例拖动`
- 不进入 timeline / month / week / day 时间（本轮仅 scheduler）
- 不提供"多时区列同时显示"（Mobiscroll 的 `timezones[]` 数组）
- 不做 `dataTimezone` 全局字段（`EventObject.timezone` 已完成 per-event 的"数据时区"表达）
- 不处理全天事件在时区转换后的日期边界问题（复杂度高，后置）
- 不修改 `invalid` / `colors` 的时间判断逻辑（这些区间当前以本地时间语义为准，timezone 后续单独接入）

## 影响范围

- 文档：
  - `docs/tasks/2026-06-05-scheduler-timezone.md`（本文件，新建）
  - `packages/calendar/SPEC.md`（更新 timezone 能力描述、`SchedulerOptions`）
  - `docs/agent-plan/05-advanced-scheduling.md`（更新 Step 33 状态）

- 代码：
  - `packages/calendar/src/types/options.type.ts`（`SchedulerOptions.displayTimezone` 新增）
  - `packages/calendar/src/time/timezone.ts`（新建，纯转换函数）
  - `packages/calendar/src/time/timezone.spec.ts`（新建，单元测试）
  - `packages/calendar/src/controller/scheduler-layout.ts`（`getSchedulerViewEvents` 接入转换）
  - `packages/calendar/src/stories/Calendar/Scheduler.stories.tsx`（新增 Timezone story）

## 方案

### 1. 类型层新增

```ts
// SchedulerOptions 新增
displayTimezone?: string;  // IANA 时区名称，如 'America/New_York'。缺省 = 本地时区（不转换）
```

设计说明：
- 只加 `displayTimezone`，不加 `dataTimezone`。per-event `timezone` 已经可以表达各事件的"数据时区"。
- 缺少 `timezone` 的事件视为已在 `displayTimezone` 中（即宿主导出数据时已对齐），不经转换直接渲染。
- 未配置 `displayTimezone` 时无任何行为变化。

### 2. `time/timezone.ts`（新建）— 纯时区转换

```ts
/**
 * 将事件时间从数据时区转换到显示时区
 *
 * @param date      事件的时间（DayjsTZDate）
 * @param sourceTz  数据时区 IANA 名称（如 'Asia/Tokyo'）
 * @param targetTz  显示时区 IANA 名称（如 'America/New_York'）
 * @returns 转换后的 DayjsTZDate（新实例）
 *
 * 行为：
 * - 若 sourceTz === targetTz，返回新实例（值相同）
 * - 否则通过 dayjs 的 tz() 进行 IANA 时区双向换算
 */
export function convertTimezone(
  date: DayjsTZDate,
  sourceTz: string,
  targetTz: string
): DayjsTZDate

/**
 * 检测时区是否需要转换
 * @returns true 如果 sourceTz 和 targetTz 都有效且不同
 */
export function needsTimezoneConversion(
  sourceTz?: string,
  targetTz?: string
): boolean
```

### 3. `controller/scheduler-layout.ts` — 接入转换

在 `getSchedulerViewEvents` 内部，对 time events 做转换：

```
rawTimeEvents 
  → expandSchedulerTimeEvents (recurrence 展开，已有)
  → convertEventTimezone (新增：timezone 转换)
  → splitMultiDayTimeEvents (已有)
  → sortSchedulerEventsByOrder (已有)
```

新增内部函数 `convertSchedulerEventTimezone`：
- 对每个 `EventUIModel`，若 `model.timezone` 存在且 `displayTimezone` 已配置且不等，则把 `start` / `end` 从 `model.timezone` 转换到 `displayTimezone`
- 返回新的 `EventUIModel`（不可变模式）
- 无 timezone 的事件原样返回

`getSchedulerViewEvents` 签名新增 `displayTimezone?: string` 参数。

### 4. `components/view/Scheduler.tsx` — 传入 displayTimezone

```tsx
const schedulerEvents = useMemo(
  () =>
    getSchedulerViewEvents(calendar, {
      start: weekStart,
      end: weekEnd,
      hourStart,
      hourEnd,
      displayTimezone: schedulerOptions?.displayTimezone,  // 新增
    }),
  [calendar, hourStart, hourEnd, weekStart, weekEnd, schedulerOptions?.displayTimezone]
);
```

### 5. Storybook — `Scheduler/Timezone`

- 配置 `displayTimezone: 'America/New_York'`
- 创建事件：3 条事件，分别标记 `timezone: 'Asia/Tokyo'`、`timezone: 'Europe/London'`、无 timezone
- 直观验证：东京 9:00 AM 事件在纽约时间网格中渲染在对应位置（应与 UTC 偏移差 +13h 一致 → 即前一天的 20:00）
- 日志面板记录点击事件的实际时间

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] `pnpm --filter swell-calendar exec tsc --noEmit`
- [ ] `pnpm --filter swell-calendar test`（所有 186 个已有单测 + 新增 timezone 单测）
- [ ] `pnpm lint`
- [ ] Storybook 手动对照：东京 9:00→纽约 20:00(前一天) / 伦敦 9:00→纽约 4:00

## 风险与回滚

- 风险：dayjs timezone 插件对某些 IANA 时区名称的解析失败（如废弃名称 `US/Eastern` → `America/New_York`）
  - 缓解：转换函数内 `try/catch`，失败时原样返回不转换 + 不抛异常
- 风险：全天事件（allday）在时区边界附近会产生日期偏移（如 UTC+14 的全天事件在 UTC-12 显示时日期跃变）
  - 缓解：本步明确**不做全天事件时区转换**，后续单独处理
- 回滚方式：`time/timezone.ts` 可独立删除，`scheduler-layout.ts` 改动仅去除新增函数调用即可回退

## 实施记录

2026-06-05 已完成。

实施内容：

- `types/options.type.ts` — `SchedulerOptions.displayTimezone?: string` 新增
- `time/timezone.ts` — 新建，`convertTimezone()` + `needsTimezoneConversion()` 纯函数
- `time/timezone.spec.ts` — 新建，14 个单测（8 个转换 + 6 个需要性判定）
- `controller/scheduler-layout.ts` — 新增 `convertSchedulerEventTimezone()` 并接入 `getSchedulerViewEvents` pipeline；接受 `displayTimezone` 参数
- `components/view/Scheduler.tsx` — 将 `schedulerOptions?.displayTimezone` 传给 `getSchedulerViewEvents`
- `stories/Calendar/Scheduler.stories.tsx` — 新增 `Timezone` story（东京/伦敦/纽约/无时区 四条事件）

验证结果：

- [x] `node scripts/check-docs.mjs` ✅
- [x] `node scripts/check-arch.mjs` ✅（154 个文件，无分层违规）
- [x] `pnpm --filter swell-calendar exec tsc --noEmit` ✅
- [x] `pnpm --filter swell-calendar test` ✅（200 个测试全部通过）
- [x] `pnpm lint` ✅

## P1 修复记录

2026-06-05

### P1-1：取数窗口内 timezone 转换导致边界事件丢失/冗余 & allday 泄漏

**根因**：`getSchedulerViewEvents` 先以原始 `start/end` 调 `findByDateRangeForWeek`，直到 line 225 才做 timezone 转换。上一轮修复扩了 fetch 窗口 (±1d) 但只过滤了 time events，allday 面板直接把 fetch 扩展带进来的全天事件也渲染了。

**修复** (`scheduler-layout.ts`)：
- fetch 范围：`displayTimezone` 存在时向外扩 ±1 天
- time events 转换后视口裁剪：`.filter()` 丢弃 `eventEnd < start || eventStart > end`
- allday events 同样视口裁剪：与 time events 平行增加 `.filter()`

### P1-2：recurrence 展开用原始视口而非法取大窗口

**根因**：`expandSchedulerTimeEvents(rawTimeEvents, start, end)` 传的是原始 `start/end`，而非 fetch 扩展后的 `fetchStart/fetchEnd`。源时区落在视口外、转换后应落进视口内的 recurring occurrence 在展开阶段就被截断了。

**修复** (`scheduler-layout.ts`)：
- `expandSchedulerTimeEvents(rawTimeEvents, fetchStart, fetchEnd)` — 使用扩展后的 fetch 窗口做 recurrence 展开，保证所有可能落入视口的 occurrence 都被生成

### P1-3：转换后 callback payload 丢失 timezone 或自相矛盾

**根因**：上一轮直接 `timezone: undefined` 抹掉了 timezone 字段，导致宿主编辑后丢失时区语义。而保留 timezone 又会造成 "display-timezone start + source-timezone IANA 名" 的矛盾组合。

**修复** (`eventModel.ts` + `scheduler-layout.ts`)：
- `EventModel` 新增 `_sourceStart` / `_sourceEnd` 两个内部字段，存储数据时区下的原始时刻
- `toEventObject()` 优先取 `_sourceStart ?? this.start` / `_sourceEnd ?? this.end`，回调 payload 输出始终是数据时区的时间 + 原始 timezone，保持自洽
- `convertSchedulerEventTimezone` 在转换后的模型上设 `convertedModel._sourceStart = origStart` / `convertedModel._sourceEnd = origEnd`，保留原始值

### P1-4：`toEventObject` 反向转换无法穿透多日分段和拖拽/resize 管线

**根因**：上一轮只改了一层转换模型，`splitMultiDayTimeEvents` 新建的 `segmentModel` 未保留 `_sourceStart/_sourceEnd`，拖拽/resize 的 `createUpdatedTimeGridEvent` 也未做反向转换。分段后的 model 及 move/resize 的 callback payload 仍为"显示时区 start/end + 原始 timezone"的矛盾组合。

**修复**：

- `EventModel`：
  - `toEventObject()` 改为运行时反向转换：检测 `_displayTimezone` 存在 + 与 `timezone` 不同时，把 `this.start/this.end`（显示时区值）反转为数据时区值再输出
  - `toEventObject()` 返回值携带 `_displayTimezone`（动态挂在返回值上），穿过 `toEventObject → new EventModel` 往返
- `scheduler-layout.ts`：
  - `convertSchedulerEventTimezone` 在转换后模型上设 `_displayTimezone` 替代 `_sourceStart/_sourceEnd`
  - `splitMultiDayTimeEvents` 分段构造后继承 `model._displayTimezone`
- `scheduler.controller.ts`：
  - `createUpdatedTimeGridEvent` 从 `previousEvent` 提取 `_displayTimezone`，若存在则把 `nextStart/nextEnd` 从显示时区反转为数据时区，再输出 callback payload
