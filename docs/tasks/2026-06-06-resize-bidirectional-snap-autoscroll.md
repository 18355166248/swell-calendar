# 2026-06-06 双向 resize + 吸附粒度 + Scheduler 边缘自动滚动（mobiscroll parity）

## 背景

继 [拖拽跟手影子整列满宽](./2026-06-06-drag-ghost-full-column-width.md) 之后，继续对齐主参考样例
（https://demo.mobiscroll.com/react/scheduler/desktop-week-view）的基础交互手感。实测确认三项差距：

1. **resize 单向**：`useTimeGridEventResize` 只改结束时间（start 固定），顶/底两个手柄
   （`resize-handle-top` / `resize-handle-bottom`）派发同一个 `event/timeGrid/resize/{cid}`，无方向区分。
   mobiscroll 同时支持顶边（`resize-start`）与底边（`resize-end`），拖过对侧时**夹紧到最小一格、不翻转**
   （实测：拖底边越过开始 → start 锁定、高度夹到最小）。
2. **吸附粒度硬编码**：move/resize 用 `MS_PER_THIRTY_MINUTES` 硬编码换算时间；当 `hourDivision=4`（15min）
   时拖拽吸附与网格行错位。
3. **Scheduler 无边缘自动滚动**：`useTimeGridScrollSync`（垂直）已在 Week/Day 接入，Scheduler 未接入。

## 目标

- **#1 双向 resize**：顶边改开始时间、底边改结束时间；拖过对侧夹紧到最小一格（不翻转），对齐 mobiscroll。
- **#3-a 吸附粒度**：move/resize 的行→时间换算改为按网格行实际时长（`hourDivision` 推导），不新增公开 API。
- **#3-b 自动滚动**：Scheduler 时间面板接入既有 `useTimeGridScrollSync`（仅垂直，复用现有 hook）。

## 非目标

- 拖拽过程实时重排其余重叠卡片（实测 mobiscroll 也不做）
- 水平方向自动滚动（本轮仅垂直）
- 新增 `dragStep` / `minDuration` 等公开 API（吸附粒度 = 网格行粒度；最小时长 = 一格）

## 方案

### #1 双向 resize

- **方向编码进 drag type**：`DRAGGING_TYPE_CREATE.resizeEvent(area, id, direction?)`：
  - 有方向 → `event/${area}/resize/${direction}/${id}`（`direction: 'start' | 'end'`）
  - 无方向 → `event/${area}/resize/${id}`（向后兼容 dayGrid 等既有调用）
- `types/drag.type.ts`：扩展 `EventDragging` 联合，新增方向变体与 `EventResizeDirection`。
- `useDraggingEvent`：`getTargetEventId` 正则放宽为可选方向段 `(?:(start|end)/)?`，id 取末段；
  额外解析并返回 `resizeDirection`（默认 `'end'`）。
- `TimeEvent`：顶手柄派发 `direction='start'`，底手柄派发 `direction='end'`。
- `useTimeGridEventResize`：按方向计算：
  - `end`：`end = 指针行末`，start 固定（现有逻辑）
  - `start`：`start = 指针行首`，end 固定；引导影子同时调 `top` 与 `height`
  - 夹紧：保证 `end - start >= 一格`，越界夹紧到最小一格，不翻转。

### #3-a 吸附粒度跟随网格行

- 新增 `getRowSlotMs(date, rows)`（或内联）：`setTimeStrToDate(date, rows[0].endTime) - setTimeStrToDate(date, rows[0].startTime)`。
- `getMovingEventLayout` 与 `useTimeGridEventMove` 的 `rowDiff * MS_PER_THIRTY_MINUTES` 改为 `rowDiff * slotMs`。

### #3-b Scheduler 自动滚动

- `Scheduler.tsx`：`useTimeGridScrollSync(timePanelEl, timeGridData.rows.length)`（与 Week/Day 同构）。

## 影响范围

- `types/drag.type.ts`
- `helpers/drag.ts`
- `hooks/event/useDraggingEvent.ts`
- `hooks/TimeGrid/useTimeGridEventMove.ts`(+spec)
- `hooks/TimeGrid/useTimeGridEventResize.ts`(+spec)
- `components/events/TimeEvent.tsx`
- `components/view/Scheduler.tsx`

## 验证

- 单测：move 吸附粒度、resize 双向 + 夹紧
- `tsc --noEmit`、`check-docs`、`check-arch`
- 共享视图回归（Week/Day 的 move/resize 不退化）

## 风险

- `useDraggingEvent` 正则与 drag type 为共享契约，需保证 move 与 dayGrid 既有行为不变（方向段可选）。
- resize hook 多日分段逻辑较复杂，顶边方向需正确取 start 列；先覆盖 scheduler 单列场景，多日维持现状不退化。

## 完成状态（2026-06-06）

- ✅ #1 双向 resize：方向编码进 drag type，顶边改 start / 底边改 end，拖过对侧夹紧到最小一格（不翻转）
  - `types/drag.type.ts` 新增 `EventResizeDirection` 与方向变体
  - `helpers/drag.ts` `resizeEvent` 增加可选 `direction`（无方向时向后兼容）
  - `useDraggingEvent` 放宽正则、解析并返回 `resizeDirection`（默认 `'end'`）
  - `TimeEvent` 顶/底手柄分别派发 `start`/`end`（顶/底手柄样式见 `css/events/time.scss`，已定位 `top:0`/`bottom:0`）
  - `useTimeGridEventResize` 引导影子与落点更新按方向计算并夹紧
- ✅ #3-a 吸附粒度：新增 `getRowSlotMs`，move hook 行→时间换算改为按网格行实际时长
- ✅ #3-b 自动滚动：`Scheduler.tsx` 接入 `useTimeGridScrollSync`（仅垂直）
- 验证：`tsc --noEmit` 干净；`check-docs` / `check-arch` 通过；单测 242 全绿
  （新增 `datetime.spec.ts` 3 项、`useDraggingEvent.spec.ts` 6 项）
- 剩余：多日事件的顶边 resize 仍维持单列覆盖（未回归恶化），如需可后续单列项
