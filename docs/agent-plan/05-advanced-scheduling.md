# 步骤 05：高级调度能力

> 参考样例：Mobiscroll React Scheduler Desktop Week View
> https://demo.mobiscroll.com/react/scheduler/desktop-week-view
> 本文档是执行附件。当前 phase 状态与公开能力口径一律以 [plan.md](./plan.md) 和 `SPEC.md` 为准。

本阶段对应 [plan.md](./plan.md) 的 `Phase 3`。目标是把 recurrence、exceptions、timezone、external DnD、跨实例拖动拆成可独立验证的能力，而不是一次性并包。

## 当前状态

- 总状态：`[x] 已完成`
- 说明：Step 30-36 全部完成；recurrence 视口内展开和 recurring exceptions 跳过/替换已接入 scheduler 渲染链；timezone 数据→显示转换已接入；external DnD 已接入；跨实例拖动已接入；recurrence 编辑作用域已接入

## 步骤清单

- [x] Step 30：补 recurrence 相关类型
- [x] Step 31：实现 recurrence 视口内展开
- [x] Step 32：接入 recurring exceptions
- [x] Step 33：接入 timezone
- [x] Step 34：接入 external DnD
- [x] Step 35：接入跨实例拖动
- [x] Step 36：编辑作用域（Recurrence Edit Scope）

## 目标

- 先补齐高级数据结构
- 再做 recurrence 视口内展开
- 再做 exceptions
- 再做 timezone
- 最后做 external DnD / 跨实例拖动

## Step 30：补 recurrence 相关类型

内容：

- `RecurringException` 接口（新增）
- `EventObject.recurringExceptions` 字段（新增）
- `EventObject.recurringExceptionRule` 字段（新增）
- `EventModel`、`getColors()`、`toEventObject()` 同步接入
- `EventObjectWithDefaultValues` MarkOptional 同步

最小验证：

- `pnpm --filter swell-calendar exec tsc --noEmit`
- `pnpm lint`
- `pnpm --filter swell-calendar test`
- `node scripts/check-docs.mjs`

通过标准：

- 旧事件模型不受影响
- 所有现有 Storybook 仍绿
- 全部门禁通过

实施记录：

- 2026-06-04：类型层落地，`tsc` / `lint` / 154 tests 全部通过

## Step 31：实现 recurrence 视口内展开

内容：

- 只在当前可视窗口内展开
- 覆盖 daily / weekly / monthly / yearly + interval / count / until / byWeekDays / byMonthDays
- exceptions 排除在 `expandRecurrence` 入口统一处理
- interval ≤ 0 与 count=0 防御性返回空数组

落点：

- `time/recurrence.ts` — 纯时间计算，不依赖 React 或 scheduler 视图

最小验证：

- `pnpm --filter swell-calendar test -- recurrence`

通过标准：

- 不会把整个历史/未来无限展开
- 所有现有 Storybook 仍绿

实施记录：

- 2026-06-04：20 个单测全部通过，覆盖 4 种频率 + interval/count/until/exceptions/边界场景

## Step 32：接入 recurring exceptions ✅

2026-06-05 已完成


内容：

- 支持跳过实例
- 支持替换实例

最小验证：

- 单测覆盖 exception 优先级

通过标准：

- recurrence 和 exceptions 可协同工作

## Step 33：接入 timezone ✅

2026-06-05 已完成

内容：

- 新增 `time/timezone.ts`：`convertTimezone` / `needsTimezoneConversion` 纯时区转换
- 接入 `scheduler-layout.ts` pipeline：recurrence 展开后 → timezone 转换 → 多日分段 → 排序
- 新增 `SchedulerOptions.displayTimezone` 选项
- per-event `timezone` 作为数据时区，`displayTimezone` 作为显示时区
- 无 timezone 事件 / 未配置 displayTimezone 时行为完全不变

最小验证：

- `timezone.spec.ts` 14 个单测：同区/跨区/无效名静默回退/午夜边界
- `Scheduler/Timezone` Story

通过标准：

- 非 timezone 事件渲染结果不变
- 200 个测试全部通过

## Step 34：接入 external DnD ✅

2026-06-06 已完成

内容：

- 新增 `SchedulerOptions.allowExternalDrop` 全局开关与 `ResourceInfo.allowExternalDrop` 资源级开关
- 新建 `hooks/TimeGrid/useExternalDrop.ts`：基于 HTML5 DnD API 处理外部拖入
- `controller/scheduler.controller.ts` 新增 `createExternalDropInfo` / `isBlockedExternalDrop` / `isExternalDropAllowedForResource`
- `TimeGridView.tsx` 列容器接入 `onDragOver` / `onDrop`
- 新增 `onExternalDrop` / `onExternalDropFailed` 回调
- 新增 `Scheduler/ExternalDnDMock` Story

最小验证：

- `Scheduler/ExternalDnDMock` Story

通过标准：

- 宿主可以拿到外部 drop intent
- 200 个测试全部通过

## Step 35：接入跨实例拖动 ✅

2026-06-06 已完成

内容：

- 新建 `controller/cross-instance-bridge.ts`：模块级 publish/subscribe 单例桥接器
- 新建 `hooks/TimeGrid/useCrossInstanceDnD.ts`：源侧（检测拖出 + 发布）+ 目标侧（订阅 + 接收）
- 新增 `onCrossInstanceDragEnd` / `onCrossInstanceDrop` 回调
- `TimeGridView.tsx` 接入跨实例 hook
- 新增 `Scheduler/CrossInstanceDnD` Story

最小验证：

- `Scheduler/CrossInstanceDnD` Story

通过标准：

- 高级调度能力不破坏宿主受控数据流

## Step 36：编辑作用域（Recurrence Edit Scope） ✅

2026-06-06 已完成

内容：

- 新增 `recurrenceParentId` / `recurrenceOccurrenceDate` 到 `EventObject`、`EventModel` 及展开链
- 新建 `CalendarRecurrenceEditScope` 类型
- 扩展 `CalendarEventUpdateInfo` / `CalendarEventDeleteInfo`，增加 `recurrenceInstance` 字段
- 新建 `applyRecurrenceEditScope()` 工具函数，支持 single / following / all 三种作用域
- DnD / resize / delete 回调中接入编辑作用域逻辑
- 新增 Storybook story

新增文件：

- `controller/recurrence-edit-scope.ts`
- `controller/recurrence-edit-scope.spec.ts`

修改文件：

- `types/events.type.ts`
- `types/callbacks.type.ts`
- `model/eventModel.ts`
- `controller/scheduler-recurrence.ts`
- `hooks/TimeGrid/useTimeGridEventMove.ts`
- `hooks/TimeGrid/useTimeGridEventResize.ts`
- `components/events/TimeEvent.tsx`
- `index.ts`
- `stories/Calendar/Scheduler.stories.tsx`

最小验证：

- `pnpm --filter swell-calendar exec tsc --noEmit`
- `pnpm lint`
- `pnpm --filter swell-calendar test`
- Storybook `Scheduler/RecurrenceEditScope` Story

通过标准：

- single / following / all 三种作用域行为正确
- 不影响非 recurrence 事件的编辑流程
- 全部门禁通过

## 阶段回归清单

每完成一步都回归：

- `Scheduler/Recurrence`
- `Scheduler/Timezone`
- `Scheduler/ExternalDnDMock`
- `Day`
- `Week`
- `Timeline`

## 退出条件

- recurrence、exceptions、timezone、external DnD、跨实例拖动、编辑作用域全部完成
- 不要求内建弹窗编辑器
- 不引入 agenda、移动端或远期 backlog 能力
