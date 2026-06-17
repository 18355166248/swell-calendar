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
- 追加：`DragResizeRegression` 原仅 2 张卡片，三列 scheduler 显得空洞。现补齐 13 张，事件均匀分布在 7 天（`d(0)` 到 `d(6)`）中，每天至少 1–3 张跨 r1/r2/r3，视觉饱满、同时仍以 Day0 的 reg-a/reg-b 为 play 测试的主要交互对象。

## 追加：6/8 8:30 卡片"resize 拖不动"复核 + 锁测

- 现象（用户反馈）：6/8（Day1）8:30 的 `reg-r3-1`（r3，8:30–9:30，孤立无重叠）resize 拖不动。
- 复核：**fresh load 无法复现**。实测该卡顶/底手柄均存在（7px）、`elementFromPoint` 距边 0–6/0–7px 均命中
  自身手柄（未被遮挡）；合成真实慢拖（距顶边 3px 按下、逐步上拖）正常 resize（"08:00–09:30"，顶部上移）；
  当前页无残留幽灵卡 / 无重复。
- 判断：最可能是**陈旧页面态**——HMR/Fast Refresh 在 move→resize 引导兜底清空修复前保留了旧的 stuck guide
  组件状态；硬刷新（Ctrl+Shift+R）即可恢复。
- 锁测：`DragResizeRegression` play 增加第 4 段——对未经任何前置交互的孤立卡 `reg-r3-1` 顶/底边各 resize
  一次，断言生效（变高 / 顶部上移）且无重复。play 通过。

## 追加：拖拽被打断后卡死（半透明 + 无法拖动/ resize，需刷新）

- 现象：某些情况下卡片"拖拽时变半透明、之后无法再拖拽/ resize",只能刷新恢复。
- 根因：`useDrag` 只在 document 的 `mouseup` 上清理拖拽。一旦 **mouseup 丢失**（窗口外松开 / 失焦 /
  导航或脚本中途打断），dnd 永久停在 `DRAGGING`：`layoutContainer` 的 `dragging--*` class 不卸载、
  `isDraggingTarget` 恒真 → 卡片半透明；`draggingEvent` 不清空 → 后续交互无法登记 → 表现为"拖不动"。
  无任何自恢复路径，只能刷新。
- 修复：`useDrag.handleMouseMove` 增加兜底——拖拽进行中若主键已不再按下（`(e.buttons & 1) === 0`），
  立即按"结束拖拽"处理（`handleMouseUp` → 卸载 class + `reset()`）。这样**鼠标一移回日历就自恢复**，无需刷新。
- 实测（浏览器）：模拟"拖拽中途丢失 mouseup"（`mousemove` 带 `buttons=0`）后，`dragging--*` class 由 1→0、
  卡片恢复不透明、随后拖拽正常（727→825）。`tsc`/eslint/prettier 干净、vitest 249 全绿。
- 连带修复：`DragResizeRegression` play 的 `pointerGesture` 原 `mousemove` 未带 `buttons`（默认 0），
  会被上面的兜底识别为"按键已松开"而提前结束。已改为 mousedown/mousemove 带 `buttons:1`、mouseup 带 `buttons:0`，
  更贴近真实拖拽。修正后 play 通过（13 张卡、无重复、reg-a 与 reg-r3-1 均成功 resize）。

## 追加：useDraggingEvent 闭包竞态 → "做完一次 resize 后，其它列卡片全部无法 resize"

- 现象（刷新后稳定复现，非陈旧态）：在 `DragResizeRegression`（play 会连做 move/resize）跑完后，
  6/7 的 reg-a/reg-b 等卡片 resize 完全无反应（按下手柄、dnd 状态正确进入 DRAGGING、
  `draggingEventUIModel` 也正确指向该卡，但**引导始终不出现**）；而最后被 resize 的那张卡仍正常。
- 定位：经 React fiber 读取 store —— dnd 状态完全正确（`draggingEventUIModel=reg-a`、DRAGGING），
  问题在 resize **hook** 没接住。根因是 `useDraggingEvent` 的 transient 订阅回调**直接读 state 闭包值
  `draggingEvent`**：`setDragging→reset` 可能在同批次内连续触发 store 变更，回调读到过期闭包，
  结束分支（IDLE/CANCELED）漏判 → 该列 hook 的 `draggingEvent` 永远停在"上一次拖拽的事件"上。
  之后任何卡片在该列 resize：`isNil(draggingEvent)` 为假 → 不接管新拖拽 → `resizingStartUIModel` 用旧事件
  → `baseResizingInfo` 落到错误的列 → 引导不出现、resize 失灵。只有"上一次那张"恰好匹配才仍可用。
  （注：每列一个 `ResizingEventShadow`，且任一列的 `useDraggingEvent` 都会因 cid 全局匹配而置位，
  故一次 resize 会让"非目标列"也进入该竞态。先用 render 阶段 ref 仅部分缓解，仍有"set→reset 早于 render"的窗口。）
- 修复：在 `useDraggingEvent` 用**回调内同步置位的 `startedRef`** 取代"读 state 判断是否已开始/结束"——
  匹配即 `startedRef.current=true` 并 `setDraggingEvent`；IDLE/CANCELED 且 `startedRef.current` 即置
  `isDraggingEnd`；`clearDraggingEvent` 复位 `startedRef`。彻底消除 render 时序竞态。
- 验证（浏览器）：play 跑完后,跨 7 天 12 张卡片**逐一 resize 全部生效**（含 reg-a/reg-b）；
  play 新增第 5 段——在对另一列 reg-r3-1 resize 后，再对 reg-b（不同列）resize 必须仍生效（锁此回归）。
  `tsc`/eslint/prettier 干净、vitest 249 全绿。
