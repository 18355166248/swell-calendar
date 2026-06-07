# 2026-06-06 修复 resize 引导透明看不清 + 拖拽落点回跳闪烁

## 背景

承接 [对齐 mobiscroll 拖拽与 resize](../agent-plan/tasks)（commit `ef63309`）后，实测发现两处交互缺陷：

1. **resize 引导卡片几乎透明、看不清**
2. **拖拽松手后卡片先闪回拖拽前位置、再跳到落点**

## 根因

### 问题 1：resize 引导透明

`TimeEvent` 的 `getStyles`：

```ts
backgroundColor: isDraggingTarget ? dragBackgroundColor : backgroundColor,
```

- 事件只配了 `backgroundColor`，没配 `dragBackgroundColor`；`getEventColors` 用 `??` 串联，
  上游 `calendarColor.dragBackgroundColor` 为空串 `''`（非 null/undefined），`??` 不穿透空串，
  最终 `dragBackgroundColor === ''` → 渲染成透明 `rgba(0,0,0,0)`。
- **move 跟手克隆**带 `nextStartTime` → `hasNextStartTime` 为真 → `isDraggingTarget=false` → 用正常 `backgroundColor`，所以可见。
- **resize 引导**（`ResizingEventShadow` 渲染的 `TimeEvent isResizingEvent`）不带 `nextStartTime`
  → `isDraggingTarget=true` → 套上透明 `dragBackgroundColor` → 整张引导卡透明，只剩 3px 边框 + 文本，"看不清"。

实测：resize 过程中同 id 有两张卡，原卡 `opacity:0.5`、引导 `opacity:1`，但两者 `backgroundColor` 都是 `rgba(0,0,0,0)`。

### 问题 2：落点回跳闪烁

日历**渲染源是内部 store**（`calendar.events`），props 只通过 `useEffect` 同步进 store。
move/resize 落点提交时只调用了 `callbacks.onEventUpdate`（通知父级），**没有更新内部 store**。
于是松手后的渲染时序：

1. `isDraggingTarget` 清除 → 原卡按 store 旧位置渲染（不透明）→ **闪现在拖拽前位置**
2. 父级收到回调 → `setEvents(新数组)` → 异步 props → `useEffect` → store 更新 → 原卡跳到落点

逐帧实测：松手后第 1 帧落点、第 2 帧回到旧位、第 3 帧落点 —— 中间夹一帧旧位闪烁。

## 目标

- resize 引导卡片不透明、可清晰看到（与 move 跟手克隆一致的可见度）。
- 拖拽/resize 落点提交后卡片直接停在落点，消除回跳闪帧。

## 非目标

- 不改 `getEventColors` 的 `??` 空串语义（影响面更大，独立后置）。
- 不改 recurrence 落点的父级 `applyRecurrenceEditScope` 真源逻辑；recurrence 事件不做乐观本地更新（保持回调单一真源，避免误改整条序列）。
- 不动跨实例拖拽提交链路。

## 方案

### 修复 1（组件层，单点）

`components/events/TimeEvent.tsx` `getStyles` 背景色：resize 引导（`isResizingEvent`）一律用正常 `backgroundColor`、不套 `dragBackgroundColor`：

```ts
backgroundColor: isDraggingTarget && !isResizingEvent ? dragBackgroundColor : backgroundColor,
```

`opacity` 已是 `isDraggingTarget && !isResizingEvent ? 0.5 : 1`（引导本就 1），无需改。

### 修复 2（落点乐观更新内部 store）

- `controller/event.controller.ts` 新增纯函数 `getOptimisticUpdatedEvents(calendarData, updated)`：
  取当前 store 事件 → `toEventObject()` → 按 `id` 用 `updated` 替换，返回 `EventObject[]`。
- `hooks/TimeGrid/useTimeGridEventMove.ts` 与 `useTimeGridEventResize.ts` 落点提交（`shouldAccept` 通过后）：
  - 目标**非 recurrence**（无 `recurrence` 规则且无 `recurrenceParentId`）时，
    先 `store.getState().calendar.setEvents(getOptimisticUpdatedEvents(calendar, updatedEvent))` 同步落地，
  - 再调用 `callbacks.onEventUpdate`。
  - 受控父级随后 `setEvents` 幂等覆盖；非受控场景拖拽也能即时落位（正向收益）。
- store 句柄用既有 `useCalendarStoreInternal()`（非响应式 `getState`）。

## 影响范围

- `packages/calendar/src/components/events/TimeEvent.tsx`
- `packages/calendar/src/controller/event.controller.ts`
- `packages/calendar/src/hooks/TimeGrid/useTimeGridEventMove.ts`
- `packages/calendar/src/hooks/TimeGrid/useTimeGridEventResize.ts`

## 验证

- 浏览器：Storybook `Calendar/Scheduler` 上 move/resize 落点无回跳；resize 引导卡可见有色。
- `pnpm --filter swell-calendar test`、`tsc --noEmit`、`check-docs`、`check-arch`。

## 风险

- 乐观更新改变非受控拖拽语义（原本不动 → 现在即时落位）；受控父级幂等覆盖，整体更符合直觉。
- recurrence 落点仍走回调单一真源（已显式跳过乐观更新），不退化。

## 完成状态（2026-06-06）

- ✅ 修复 1：`TimeEvent.getStyles` 背景色对 `isResizingEvent` 用正常 `backgroundColor`。
  - 浏览器实测：resize 引导卡 `backgroundColor` 由 `rgba(0,0,0,0)` → `rgb(16,185,129)`（资源色）、`opacity:1`，清晰可见。
- ✅ 修复 2：`getOptimisticUpdatedEvents` + move/resize 落点乐观更新内部 store（recurrence 跳过）。
  - 浏览器逐帧实测：松手后每帧卡片都停在落点 y，不再出现"回跳旧位"闪帧。
- ✅ 修复 2 衍生崩溃：乐观 `setEvents` 会重建事件集合（cid 变化），落点瞬间拖拽中的旧 cid
  已不在 `totalUIModels`，`useTimeGridEventResize` 的 `baseResizingInfo` 取 `resizeTargetUIModels[-1][0]`
  报 `Cannot read properties of undefined`。已加守卫：`eventStartDateColumnIndex < 0` 时提前返回 `null`。
  - 实测：被接受的 resize 落点正常持久化、无报错；被 overlap 拒绝的 resize 正常回弹。

## 追加：重叠事件无法并排（拖到同列同时段回弹）

- 现象：把一张卡片拖到另一张卡片所在列、时间重合时，落点被拒、卡片回弹。
- 根因：**不是核心限制**。核心 `isPairOverlapDenied` 默认允许重叠（仅 `eventOverlap===false` 或
  per-event/resource `overlap:false` 才拒绝），重叠事件本就并排分栏渲染。回弹来自 **`ControlledCrud`
  demo 的 `onValidateEventChange: !hasOverlap(...)`** 主动拒绝重叠，与 mobiscroll（允许重叠并排）不一致。
- 处理：移除 `ControlledCrud` 的 `onValidateEventChange` 重叠拒绝（及不再被引用的 `hasOverlap`），
  demo 默认允许重叠并排，对齐 mobiscroll。`OverlapPolicy` / `eventOverlap:false` 等策略演示 story 不动。
- 业务方如需禁止重叠：`scheduler.eventOverlap=false`、per-event/resource `overlap:false`，
  或自定义 `onValidateEventChange`。
- 实测：`ControlledCrud` 上把卡片拖到同列重合时段，落点保留并自动并排分栏（截图确认）。

## 追加：乱拖后出现重复卡片 + 拖拽失灵

- 现象：多次拖拽后某张卡片在同列出现两张（如 6/4 两张 11:00），且之后无法再拖动任何卡片。
- 根因：`useTimeGridEventMove` 的 `useWhen` 把 `clearState()` 放在 `if (shouldUpdate)` 内部。
  当落点未提交（未移动 / 落点被拒 / 取消，`shouldUpdate=false`）时不清理：
  - `movingEvent` 影子不卸载 → 残留一张重复卡（`event-card-${id}` 重复，store 仍 30、DOM 31）；
  - `draggingEvent` 不清空 → `useDraggingEvent` 认为仍在拖拽，后续 mousedown 不再登记 → **拖拽彻底失灵**。
  （`useTimeGridEventResize` 本就无条件 `clearStates()`，move hook 是历史遗漏；乐观更新的 store 重建放大了
  `shouldUpdate=false` 的触发面，使该残留更易复现。）
- 修复：把 `clearState()` 移出 `if (shouldUpdate)`，拖拽结束无条件清理，与 resize hook 对齐。
- 实测：连续 6 次混合方向拖拽 + 原地空拖（no-op）后均无重复、无残留；no-op 后仍能正常拖动其它卡片。

## 追加：部分卡片"resize 拖不动"（手柄太小）

- 现象：某些卡片顶/底边都拖不动、resize 无效（真实鼠标操作）。
- 根因：`css/events/time.scss` 的 `.resize-handle-top/bottom` 高度仅 **2px**，真实鼠标几乎无法命中；
  差一两个像素就落到卡片主体上 → 触发"移动"或无响应。脚本用合成事件直接打在手柄中心，所以一直"正常"，
  掩盖了该问题。属全局问题，用户只是挑了几张卡试。
- 修复：手柄高度 2px → **7px**（对齐 mobiscroll 可抓取手柄），并加 `z-index:1` 保证短卡片上优先命中手柄。
- 实测：距底边 4px 处（旧 2px 手柄会落空触发移动）现在命中 `resize-handle-bottom`，正常 resize
  （y 不变、高度增长、tooltip 09:00→13:00），`didResizeNotMove=true`。

## 追加：cid 全量重建竞态 + move→resize 残留重复卡（含自动化测试）

### 竞态根因（乐观更新 cid 全量变化）
- `calendat.slice.setEvents` 每次乐观更新都"清空集合 + 重建"，导致**所有事件 cid 全量变化**。
  拖拽/resize 进行中持有的 `EventUIModel` 以 cid 索引回 `totalUIModels`，cid 全变 → 落点提交后
  紧接着发起的下一次交互偶发拿不到 baseInfo 而失灵（"移动后立刻 resize 失灵"）。
- 修复：新增 `applyOptimisticEventUpdate`（`event.controller`）与 `calendar.updateEvent`（slice）。
  **原地复用同一 `EventModel` 实例 `init()` 重写字段，cid（stamp 幂等）保持不变**；仅新建集合引用触发重渲染。
  move/resize hook 的乐观更新由 `setEvents(getOptimisticUpdatedEvents(...))` 改为 `updateEvent(updatedEvent)`，
  删除已不再使用的 `getOptimisticUpdatedEvents`。

### move→resize 残留重复卡（stuck resize guide）
- 现象（自动化测试稳定复现）：先移动一张卡片、再 resize，落点后多出一张同位置卡片且持久残留。
  DOM 定位：第二张卡片直接挂在 `swell-calendar-column` 下（不在 `events` 容器），即 `ResizingEventShadow`
  的引导影子（`guideUIModel`）未被清除。
- 根因：resize 引导 `useEffect` **只 set 不 clear** —— 不满足引导条件（resize 结束 `resizingStartUIModel`
  置空 / 事件已不在本列）时未把 `guideUIModel` 置空，残留成重复卡。
- 修复：引导 `useEffect` 增加兜底 `setGuideUIModel(null)`：命中条件才 set，否则一律 clear。

### 自动化测试（不再依赖手测）
- `event.controller.spec.ts`（5）：`applyOptimisticEventUpdate` 保 cid（含被更新事件）、原地改 start/end、
  新集合引用、重建日期矩阵、id 不存在时 no-op。
- `calendar.slice.spec.ts`（2）：immer produce 路径下 `updateEvent` 保 cid + 改字段；
  "移动后仍能按 id + 同 cid 找回"（move→resize 安全前提）。
- `Scheduler.stories` 新增 `DragResizeRegression`（受控、确定性）play 交互测试：
  移动不产生重复幽灵卡且真实移动；移动后立刻 resize 生效且无重复；no-op 落点无残留且之后仍可拖拽。
  该 play 在修复前稳定复现重复卡（`expected 2 to be 1`），修复后通过。
- 验证：`tsc` 干净、eslint/prettier 通过、**vitest 249 全绿**、check-docs/check-arch 通过；
  浏览器实测 move→resize ×4 无重复。
- 验证：`tsc --noEmit` 干净；`check-docs` / `check-arch` 通过；单测 242 全绿（无新增/回归失败）。
- 剩余：`getEventColors` 的 `??` 空串不穿透语义未改（move 跟手原卡仍是透明 0.5 ghost，符合预期，未列入本次范围）；recurrence 落点闪帧未优化（量小、走单一真源）。
- 追加：`DragResizeRegression` 原仅 2 张卡片，三列 scheduler 显得空洞。现补齐 10 张（r1/r2/r3 各含 2–4 张，覆盖 8:00–15:45），视觉饱满、同时仍以 reg-a/reg-b 为 play 测试的主要交互对象。
