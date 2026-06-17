# 2026-06-06 Phase 3 Step 36 — 编辑作用域（Recurrence Edit Scope）

## 背景

Phase 3 已完成 recurrence 视口展开（Step 30）、recurring exceptions（Step 31）、timezone（Step 32）、external DnD（Step 34）、跨实例拖动（Step 35）。但展开后的实例**丢失了父事件身份信息**：

- 展开实例 `recurrence = undefined`，`recurringExceptions = undefined`
- 实例 `id` 被覆写为 `"${parentId}-${date}"`，原 `id` 丢失
- 回调 payload（`onEventUpdate` / `onEventDelete`）中宿主无法区分"recurrence 实例"与"普通事件"

宿主在收到拖拽/resize/删除回调时，不知道该操作作用于单次发生、本次及以后、还是全部发生。

## 目标

- 在 `EventObject` 增加 `recurrenceParentId` + `recurrenceOccurrenceDate` 字段，展开时注入
- 穿透 `EventModel` → `toEventObject()` 全链路
- 定义 `CalendarRecurrenceEditScope` 类型（`'single' | 'following' | 'all'`）
- 扩展 `CalendarEventUpdateInfo` / `CalendarEventDeleteInfo` 携带 scope 元数据
- 新建 `controller/recurrence-edit-scope.ts`，提供 `applyRecurrenceEditScope()` 工具函数
- 新增 Storybook 验证故事

## 非目标

- 不实现内建作用域选择弹窗（宿主自行实现 UI）
- 不修改 DnD / resize / delete 内部交互逻辑
- 不实现 recurringExceptionRule（Phase 3 后置）
- 不接入 week / day / timeline 视图

## 方案

### 1. EventObject 新字段

```ts
/** 展开实例专属：父事件 ID（组件内部设置，宿主不应手动赋值） */
recurrenceParentId?: string;
/** 展开实例专属：本次发生的原始日期（组件内部设置，宿主不应手动赋值） */
recurrenceOccurrenceDate?: DateType;
```

### 2. EventModel 穿透

`eventModel.ts` 增加两个字段，在 `init()` 中从 EventObject 读取，在 `toEventObject()` 中输出。

### 3. 展开时注入元数据

`scheduler-recurrence.ts` 的 `expandSchedulerRecurrenceEvent` 在每个实例上设置：
- `recurrenceParentId: event.id ?? ''`
- `recurrenceOccurrenceDate: occurrenceDate`

### 4. 回调 payload 扩展

```ts
export type CalendarRecurrenceEditScope = 'single' | 'following' | 'all';

export interface CalendarRecurrenceInstanceInfo {
  recurrenceParentId: string;
  recurrenceOccurrenceDate: DayjsTZDate;
}

export interface CalendarEventUpdateInfo {
  event: EventObject;
  previousEvent: EventObjectWithDefaultValues;
  /** 仅当事件为 recurrence 展开实例时存在 */
  recurrenceInstance?: CalendarRecurrenceInstanceInfo;
}

export interface CalendarEventDeleteInfo {
  event: EventObjectWithDefaultValues;
  /** 仅当事件为 recurrence 展开实例时存在 */
  recurrenceInstance?: CalendarRecurrenceInstanceInfo;
}
```

### 5. applyRecurrenceEditScope() 工具函数

```ts
export function applyRecurrenceEditScope(params: {
  parentEvent: EventObject;
  occurrenceDate: DayjsTZDate;
  scope: CalendarRecurrenceEditScope;
  changes: Partial<EventObject>;
}): EventObject[]
```

- **single**: 创建/更新 RecurringException `{ date, overrides: changes }`
- **following**: 截断父事件 `recurrence.until`，创建新事件携带原 recurrence 规则
- **all**: 直接修改父事件基础属性

### 6. 辅助函数

```ts
export function isRecurrenceInstance(event: EventObject): boolean
export function getRecurrenceParentId(event: EventObject): string | undefined
```

### 7. Storybook — `Scheduler/RecurrenceEditScope`

一个 scheduler 显示 weekly recurring 事件，拖拽/resize/删除实例时弹出 scope 选择（用 window.prompt 模拟），宿主调用 applyRecurrenceEditScope 更新事件数组。

## 影响范围

- 代码：`types/events.type.ts`、`types/callbacks.type.ts`、`model/eventModel.ts`、`controller/scheduler-recurrence.ts`（注入元数据）、新建 `controller/recurrence-edit-scope.ts`、`hooks/TimeGrid/useTimeGridEventMove.ts`、`hooks/TimeGrid/useTimeGridEventResize.ts`、`components/events/TimeEvent.tsx`
- 文档：SPEC.md、plan.md、implementation-steps.md、05-advanced-scheduling.md
- 运行时行为：recurrence 实例的回调 payload 新增 `recurrenceInstance` 字段，对非 recurrence 事件无影响

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [ ] 无规格变更，仅补任务记录

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] `pnpm --filter swell-calendar exec tsc --noEmit`
- [ ] `pnpm --filter swell-calendar test`
- [ ] `pnpm lint`

## 风险与回滚

- 风险：`EventObject` 新增字段属于公开 API 变更
  - 缓解：字段为 optional，向后兼容，文档标注"组件内部设置"
- 风险：`createUpdatedTimeGridEvent` 的 `...previousEvent` spread 会自动携带新字段
  - 已确认安全
- 回滚方式：去除新字段和 recurrenceInstance payload 即可回退，无破坏性变更

## 实施结果

2026-06-06 已完成。

实施内容：

- `types/events.type.ts` — `EventObject` 新增 `recurrenceParentId`、`recurrenceOccurrenceDate` 字段；`EventObjectWithDefaultValues` 扩展 optional 列表
- `types/callbacks.type.ts` — 新增 `CalendarRecurrenceEditScope` 类型、`CalendarRecurrenceInstanceInfo` 接口；`CalendarEventUpdateInfo` 和 `CalendarEventDeleteInfo` 新增 `recurrenceInstance?` 字段
- `model/eventModel.ts` — 新增 `recurrenceParentId`、`recurrenceOccurrenceDate` 属性，穿透 `init()` → `toEventObject()` 全链路
- `controller/scheduler-recurrence.ts` — 展开时注入 `recurrenceParentId` 和 `recurrenceOccurrenceDate` 到每个实例
- `controller/recurrence-edit-scope.ts` — 新建，提供 `applyRecurrenceEditScope()`（single/following/all 三种作用域）、`isRecurrenceInstance()`、`getRecurrenceParentId()`、`getRecurrenceOccurrenceDate()`、`buildRecurrenceInstanceInfo()`
- `controller/recurrence-edit-scope.spec.ts` — 新建，16 个单元测试
- `controller/scheduler-recurrence.spec.ts` — 新增 3 个测试（展开实例元数据验证）
- `hooks/TimeGrid/useTimeGridEventMove.ts` — `onEventUpdate` 回调携带 `recurrenceInstance`
- `hooks/TimeGrid/useTimeGridEventResize.ts` — `onEventUpdate` 回调携带 `recurrenceInstance`
- `components/events/TimeEvent.tsx` — `onEventDelete` 回调携带 `recurrenceInstance`
- `index.ts` — 导出新类型和工具函数
- `stories/Calendar/Scheduler.stories.tsx` — 新增 `RecurrenceEditScope` story

与原计划的偏差：

- `applyAllScope` 中用 `delete` 替代解构排除（避免 unused-vars lint 警告）
- `DayjsTZDate` 不可变操作需链式赋值（`dayBefore = dayBefore.setDate(...)`）

验证结果：

- [x] `node scripts/check-docs.mjs` ✅
- [x] `node scripts/check-arch.mjs` ✅
- [x] `pnpm --filter swell-calendar exec tsc --noEmit` ✅
- [x] `pnpm --filter swell-calendar test` ✅（218 个测试全部通过）
- [x] `pnpm lint` ✅

剩余问题：无
