# 2026-06-08 拖拽 ESC 取消（接通已有管线 + timeline 接入）

参考样例：Mobiscroll React Timeline - Calendar timeline
https://demo.mobiscroll.com/react/timeline/calendar-timeline

## 背景

`docs/tasks/2026-06-07-timeline-calendar-rebuild.md` 的后续增量清单包含「ESC 取消」。
核对代码后发现这是一处**未接通的潜在缺陷**，影响范围不止 timeline：

- `hooks/common/useDrag.ts` 的 `DragListeners` 已声明 `onPressESCKey`，但实现里既没解构也没注册 keydown 监听
- `slices/dnd.slice.ts` 已有 `cancelDrag()`（置 `CANCELED`），但全仓**没有任何调用点**
- `hooks/event/useDraggingEvent.ts` 已对 `CANCELED` 状态分支处理（`isDraggingCanceled`），
  `hooks/TimeGrid/useTimeGridEventMove.ts` / `useTimeGridEventResize.ts` 的提交都已 `!isDraggingCanceled` 门控
- `components/events/TimeEvent.tsx` 的 `isDraggingTarget` 由 transient 监听驱动，仅在 `DRAGGING` 时为真

也就是说：整条「ESC → cancelDrag → 消费方跳过提交」的管线早已铺好，只差 `useDrag` 里
keydown → `cancelDrag()` 这一根线没接。现状下拖拽中按 ESC **没有任何效果**；现有
Day/Week/Scheduler 的 ESC 故事之所以「通过」，是因为它们按完 ESC 后从不发 mouseup，
本来就不会提交，断言很弱、检测不到真问题。

## 目标

- 在 `useDrag` 接通 ESC：拖拽进行中按 ESC 调用 `onPressESCKey` 并 `cancelDrag()`，
  立即结束本次拖拽监听，使后续 mouseup 不再触发提交
- 让各消费方在 ESC 时清理自身预览/视觉：
  - `TimeEvent`：移除拖拽 CSS 类（`endDragEvent`）
  - `useGridSelection`：清空网格选择
  - timeline `useTimelineEventDrag` / `useTimelineCreate`：清除幽灵横条预览
- 不改变正常 move/resize/create 的提交路径，不引入 runtime `console.*`

## 非目标

- 不新增 scheduler / timeline 主能力
- 不改 `cancelDrag` 之后的 `CANCELED → IDLE` 时机（沿用既有：下一次 `initDrag` 自然复位，
  `clearDraggingEvent` 只清本地状态）

## 状态机说明（为什么 cancel 后不立即 reset）

`useDraggingEvent` 在 `IDLE` 分支会把 `isDraggingCanceled` 重写为 `false`。若 ESC 后同步
`cancelDrag()`→`reset()`，`CANCELED` 会被紧随的 `IDLE` 覆盖，导致消费方误判为「正常结束」并提交。
因此 ESC 只 `cancelDrag()`，保持 `CANCELED` 为终态；`startDragEvent` 每次拖拽开始都会重设
`draggingEventUIModel`，下一次 `initDrag` 置 `INIT`，不会泄漏陈旧状态。

## 范围与落点

- `hooks/common/useDrag.ts`：解构 `onPressESCKey`；`isStarted` 期间在 `document` 注册 `keydown`，
  命中 `Escape` 时 `setIsStarted(false)` → `onPressESCKey?.()` → `cancelDrag()`
- `components/events/TimeEvent.tsx`：move / resizeTop / resizeBottom 三处补 `onPressESCKey` 清理 CSS 类
- `hooks/GridSelection/useGridSelection.tsx`：补 `onPressESCKey` 清空选择
- `hooks/Timeline/useTimelineEventDrag.ts`：move / resize 两类补 `onPressESCKey` 清预览
- `hooks/Timeline/useTimelineCreate.ts`：补 `onPressESCKey` 清预览 + 重置 `startDayRef`

## 验证

- `node scripts/check-docs.mjs` / `check-arch.mjs`
- `pnpm --filter swell-calendar exec tsc --noEmit`
- `pnpm --filter swell-calendar test`（扩展 `useDrag.spec.tsx`：ESC → `CANCELED` + `onPressESCKey` 调用 + 监听移除）
- Storybook 回归：Day / Week / Scheduler / Timeline ESC 故事保持绿；新增 timeline ESC 行为人工对照

## 进度

- [x] useDrag 接通 ESC（keydown 监听 → onPressESCKey → cancelDrag，CANCELED 终态不 reset）
- [x] TimeEvent（move/resizeTop/resizeBottom）/ useGridSelection / timeline hooks（move/resize/create）接入 onPressESCKey
- [x] useDrag.spec 扩展（ESC 取消 + 跳过 trailing mouseup + 非 Escape 忽略，共 3 例）
- [x] 验证四件套
  - check-docs / check-arch 通过
  - tsc --noEmit 通过
  - vitest：28 文件 / 276 用例全绿（含新增 3 例）
  - Storybook 实测：
    - timeline create-drag → ESC：幽灵横条出现后被清除，trailing mouseup 不提交（事件数 32→32 不变）
    - scheduler 时间事件 move → ESC：卡片 opacity 1→0.5→1，onEventUpdate 不触发、onEventUpdateFailed 也不触发（纯取消，非校验失败）

## 结论

「ESC 取消」从未接通的潜在缺陷已修复，影响 timeline + scheduler / week / day 全部拖拽路径。
timeline 后续增量清单中的「ESC 取消」一项关闭。
