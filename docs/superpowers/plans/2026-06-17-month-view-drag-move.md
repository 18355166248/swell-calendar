# 月视图拖动换天（move）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让月视图事件可以按住拖到另一个日期格子，按天平移 `start/end`（保留时长与跨天天数），经校验后触发 `onEventUpdate`。

**Architecture:** 镜像 Timeline 的日粒度拖拽分层 —— 纯函数 controller（命中测试 + 事件改写）、校验模块、Interaction Context、基于 `useDrag` 的 per-event hook、`MonthGrid` 挂 gridRef + 幽灵预览条、`MonthEvent` 绑 onMouseDown。host 驱动数据更新（不做内部乐观更新，与 timeline 一致）。

**Tech Stack:** React 18 + TypeScript + Zustand store + Vitest + Storybook 交互测试；`DayjsTZDate` 时间类型。

---

本计划只覆盖**第 1 步：move（拖动换天）**。step2（两端 resize）、step3（空白拖拽创建）将在 move 落地后各自出独立计划，复用此处建立的 controller / context / hook 骨架。

设计文档：`docs/tasks/2026-06-17-month-view-drag.md`

## 文件结构

- 新增 `packages/calendar/src/controller/month-interaction.ts` —— 纯函数：`getMonthGridPositionFromPoint`（命中测试）、`computeMovedMonthEvent`（按天平移）。无 React。
- 新增 `packages/calendar/src/controller/month-interaction.spec.ts` —— 上述纯函数单测。
- 新增 `packages/calendar/src/controller/month-validation.ts` —— `shouldAcceptMonthEventChange`（开关 + per-event + onValidateEventChange + 失败回调）。
- 新增 `packages/calendar/src/controller/month-validation.spec.ts`。
- 新增 `packages/calendar/src/components/month/MonthInteractionContext.tsx` —— Provider/Hook + 预览/commit 接口。
- 新增 `packages/calendar/src/hooks/month/useMonthEventDrag.ts` —— `useDrag` 封装（move）。
- 改 `packages/calendar/src/types/options.type.ts` —— `MonthOptions` 加 `dragToMove/dragToResize/dragToCreate`。
- 改 `packages/calendar/src/slices/options.slice.ts` —— `initializeMonthOptions` 默认值 + `isReadOnly` 归一化。
- 改 `packages/calendar/src/components/month/MonthGrid.tsx` —— gridRef + Provider + commitMove + dragPreview + 幽灵条。
- 改 `packages/calendar/src/components/month/MonthEvent.tsx` —— `weekIndex` 入参 + onMouseDown 触发拖拽。
- 改 `packages/calendar/SPEC.md` —— 能力升级 + 测试覆盖表 + 选项。

---

## Task 1: MonthOptions 增加拖拽开关与默认值

**Files:**
- Modify: `packages/calendar/src/types/options.type.ts:84-97`
- Modify: `packages/calendar/src/slices/options.slice.ts:49-64`

- [ ] **Step 1: 给 `MonthOptions` 增加三个开关字段**

在 `packages/calendar/src/types/options.type.ts` 的 `MonthOptions` 接口末尾（`visibleEventCount?` 之后）追加：

```ts
  // 每天可见的事件数量
  visibleEventCount?: number;
  /** 允许拖动事件改期（换天）。默认 true；isReadOnly 时强制 false */
  dragToMove?: boolean;
  /** 允许拖动事件两端 resize（改跨天天数）。默认 true；isReadOnly 时强制 false */
  dragToResize?: boolean;
  /** 允许空白格子拖拽创建事件。默认 true；isReadOnly 时强制 false */
  dragToCreate?: boolean;
```

- [ ] **Step 2: 在 `initializeMonthOptions` 设默认值并处理 isReadOnly**

`packages/calendar/src/slices/options.slice.ts` 的 `initializeMonthOptions` 当前签名为 `(monthOptions: Options['month'] = {})`。改为接收 `isReadOnly`，并补默认值。把第 49-64 行替换为：

```ts
function initializeMonthOptions(
  monthOptions: Options['month'] = {},
  isReadOnly = false
): Required<MonthOptions> {
  const month: Required<MonthOptions> = {
    startDayOfWeek: Day.SUN,
    dayNames: [],
    narrowWeekend: false,
    workweek: false,
    isAlways6Weeks: true,
    visibleWeeksCount: 0,
    visibleEventCount: 6,
    dragToMove: true,
    dragToResize: true,
    dragToCreate: true,
    ...monthOptions,
  };
  if (!month.dayNames || month.dayNames.length === 0) {
    month.dayNames = DEFAULT_DAY_NAMES.slice() as Required<MonthOptions>['dayNames'];
  }

  if (isReadOnly) {
    month.dragToMove = false;
    month.dragToResize = false;
    month.dragToCreate = false;
  }

  return month;
}
```

- [ ] **Step 3: 调用处传入 isReadOnly**

`options.slice.ts` 第 121 行与第 129 行各有一处 `initializeMonthOptions(options.month)`。两处都改为传入只读标志。第 121 行所在的初始化对象里 `isReadOnly` 来自 `options.isReadOnly`；先确认该作用域能取到 `options`。把两处调用改为：

```ts
month: initializeMonthOptions(options.month, options.isReadOnly ?? false),
```

```ts
state.options.month = initializeMonthOptions(options.month, options.isReadOnly ?? false);
```

> 注：若第 129 行所在的 setter 作用域中变量名不是 `options`（例如是 `newOptions`），按该作用域实际入参名调整，保持「传入对应的 isReadOnly」语义。

- [ ] **Step 4: 类型检查**

Run: `cd packages/calendar && pnpm exec tsc --noEmit`
Expected: PASS（无新增报错）

- [ ] **Step 5: 提交**

```bash
git add packages/calendar/src/types/options.type.ts packages/calendar/src/slices/options.slice.ts
git commit -m "feat(month): MonthOptions 增加 dragToMove/dragToResize/dragToCreate 开关"
```

---

## Task 2: month-interaction 纯函数（命中测试 + 按天平移）

**Files:**
- Create: `packages/calendar/src/controller/month-interaction.ts`
- Test: `packages/calendar/src/controller/month-interaction.spec.ts`

- [ ] **Step 1: 写失败测试**

创建 `packages/calendar/src/controller/month-interaction.spec.ts`：

```ts
import { describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject } from '@/types/events.type';

import { computeMovedMonthEvent, getMonthGridPositionFromPoint } from './month-interaction';

describe('month-interaction', () => {
  describe('getMonthGridPositionFromPoint', () => {
    // 6 周 × 7 列，网格 700×600（每格 100×100）
    const base = { width: 700, height: 600, weekCount: 6, colCount: 7 };

    it('左上角第一格 → week 0 / col 0 / flatOffset 0', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: 10, offsetY: 10 });
      expect(pos).toEqual({ weekIndex: 0, colIndex: 0, flatOffset: 0 });
    });

    it('第 2 周第 3 列 → flatOffset = 1*7 + 2 = 9', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: 250, offsetY: 150 });
      expect(pos).toEqual({ weekIndex: 1, colIndex: 2, flatOffset: 9 });
    });

    it('越界坐标 clamp 到合法范围', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: 9999, offsetY: 9999 });
      expect(pos).toEqual({ weekIndex: 5, colIndex: 6, flatOffset: 41 });
    });

    it('负坐标 clamp 到 0', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: -50, offsetY: -50 });
      expect(pos).toEqual({ weekIndex: 0, colIndex: 0, flatOffset: 0 });
    });
  });

  describe('computeMovedMonthEvent', () => {
    const prev: EventObject = {
      id: '1',
      calendarId: 'c1',
      title: 'e',
      start: new DayjsTZDate('2026-06-10T09:00:00'),
      end: new DayjsTZDate('2026-06-12T10:00:00'),
    } as EventObject;

    it('正向平移 +3 天，保留时分与跨天天数', () => {
      const next = computeMovedMonthEvent(prev, 3);
      expect((next.start as DayjsTZDate).dayjs.date()).toBe(13);
      expect((next.end as DayjsTZDate).dayjs.date()).toBe(15);
      expect((next.start as DayjsTZDate).dayjs.hour()).toBe(9);
      expect((next.end as DayjsTZDate).dayjs.hour()).toBe(10);
    });

    it('负向平移 -5 天', () => {
      const next = computeMovedMonthEvent(prev, -5);
      expect((next.start as DayjsTZDate).dayjs.date()).toBe(5);
      expect((next.end as DayjsTZDate).dayjs.date()).toBe(7);
    });

    it('不修改原对象', () => {
      computeMovedMonthEvent(prev, 3);
      expect((prev.start as DayjsTZDate).dayjs.date()).toBe(10);
    });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/calendar && pnpm exec vitest run src/controller/month-interaction.spec.ts`
Expected: FAIL（`month-interaction` 模块不存在 / 导出未定义）

- [ ] **Step 3: 实现纯函数**

创建 `packages/calendar/src/controller/month-interaction.ts`：

```ts
import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject } from '@/types/events.type';

/**
 * 月视图日粒度拖拽的纯函数：命中测试 + 事件改写。
 *
 * 月视图是 Timeline 的二维版本（周行 × 日列，事件为跨天全天条）。
 * 与 `timeline-calendar.ts` 刻意解耦，避免月视图耦合资源行语义。
 */

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export interface MonthGridPosition {
  /** 周行索引（0-based） */
  weekIndex: number;
  /** 日列索引（0-based） */
  colIndex: number;
  /** 压平到「自网格首日起第几天」：weekIndex * colCount + colIndex */
  flatOffset: number;
}

/**
 * 由网格内偏移坐标求 { weekIndex, colIndex, flatOffset }。
 *
 * 首版按等宽近似（width/colCount、height/weekCount）；narrowWeekend
 * 默认关闭，开启后的不等列宽精确命中留待后续增量（见任务文档风险项）。
 */
export function getMonthGridPositionFromPoint({
  offsetX,
  offsetY,
  width,
  height,
  weekCount,
  colCount,
}: {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  weekCount: number;
  colCount: number;
}): MonthGridPosition {
  if (colCount <= 0 || weekCount <= 0 || width <= 0 || height <= 0) {
    return { weekIndex: 0, colIndex: 0, flatOffset: 0 };
  }
  const colWidth = width / colCount;
  const rowHeight = height / weekCount;
  const colIndex = clamp(Math.floor(offsetX / colWidth), 0, colCount - 1);
  const weekIndex = clamp(Math.floor(offsetY / rowHeight), 0, weekCount - 1);
  return { weekIndex, colIndex, flatOffset: weekIndex * colCount + colIndex };
}

/**
 * 按天平移事件：start/end 各 +dayDelta 天，保留 time-of-day 与跨天天数。
 */
export function computeMovedMonthEvent(prev: EventObject, dayDelta: number): EventObject {
  const start = new DayjsTZDate(prev.start).addDate(dayDelta);
  const end = new DayjsTZDate(prev.end).addDate(dayDelta);
  return { ...prev, start, end };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd packages/calendar && pnpm exec vitest run src/controller/month-interaction.spec.ts`
Expected: PASS（7 个用例全绿）

- [ ] **Step 5: 提交**

```bash
git add packages/calendar/src/controller/month-interaction.ts packages/calendar/src/controller/month-interaction.spec.ts
git commit -m "feat(month): 新增月视图命中测试与按天平移纯函数"
```

---

## Task 3: month-validation 校验模块

**Files:**
- Create: `packages/calendar/src/controller/month-validation.ts`
- Test: `packages/calendar/src/controller/month-validation.spec.ts`

- [ ] **Step 1: 写失败测试**

创建 `packages/calendar/src/controller/month-validation.spec.ts`：

```ts
import { describe, expect, it, vi } from 'vitest';

import { EventObject } from '@/types/events.type';
import { Options } from '@/types/options.type';

import { shouldAcceptMonthEventChange } from './month-validation';

const event = { id: '1', title: 'e' } as EventObject;

describe('shouldAcceptMonthEventChange', () => {
  it('默认无任何限制时接受', () => {
    const accepted = shouldAcceptMonthEventChange({} as Options, null, {
      action: 'move',
      event,
    });
    expect(accepted).toBe(true);
  });

  it('month.dragToMove === false 时拒绝并触发 onEventUpdateFailed', () => {
    const onEventUpdateFailed = vi.fn();
    const accepted = shouldAcceptMonthEventChange(
      { month: { dragToMove: false } } as Options,
      { onEventUpdateFailed },
      { action: 'move', event }
    );
    expect(accepted).toBe(false);
    expect(onEventUpdateFailed).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'policy', policySource: 'view', action: 'move' })
    );
  });

  it('per-event draggable === false 时拒绝（move）', () => {
    const accepted = shouldAcceptMonthEventChange({} as Options, null, {
      action: 'move',
      event,
      previousEvent: { ...event, draggable: false } as never,
    });
    expect(accepted).toBe(false);
  });

  it('onValidateEventChange 返回 false 时拒绝', () => {
    const accepted = shouldAcceptMonthEventChange(
      {} as Options,
      { onValidateEventChange: () => false },
      { action: 'move', event }
    );
    expect(accepted).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/calendar && pnpm exec vitest run src/controller/month-validation.spec.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现校验模块**

创建 `packages/calendar/src/controller/month-validation.ts`（结构镜像 `timeline-validation.ts`，view 改为 `'month'`，开关读 `options.month`）：

```ts
import {
  CalendarCallbacks,
  CalendarEventChangeAction,
  CalendarEventChangeFailedInfo,
  CalendarPolicySource,
} from '@/types/callbacks.type';
import { EventObject, EventObjectWithDefaultValues } from '@/types/events.type';
import { Options } from '@/types/options.type';

/**
 * 月视图（日粒度）拖拽交互校验。
 *
 * 务实子集：per-event editable/draggable/resizable + month 级
 * dragToCreate/dragToMove/dragToResize 开关 + onValidateEventChange + 失败回调。
 * 不含 overlap / invalid 区间（与 timeline 首版一致，见任务文档）。
 *
 * 刻意与 `timeline-validation.ts` / `scheduler-validation.ts` 解耦，避免改动既有校验链。
 */

function dispatchFailed(
  callbacks: CalendarCallbacks | null | undefined,
  info: CalendarEventChangeFailedInfo
) {
  if (info.action === 'create') {
    callbacks?.onEventCreateFailed?.(info);
    return;
  }
  callbacks?.onEventUpdateFailed?.(info);
}

/** month 级开关（dragToCreate/Move/Resize === false）命中则返回 'view'。 */
function getDisabledViewPolicySource(
  options: Options,
  action: CalendarEventChangeAction
): CalendarPolicySource | null {
  const month = options.month;
  if (!month) {
    return null;
  }

  if (action === 'create' && month.dragToCreate === false) {
    return 'view';
  }
  if (action === 'move' && month.dragToMove === false) {
    return 'view';
  }
  if (action === 'resize' && month.dragToResize === false) {
    return 'view';
  }
  return null;
}

/** per-event editable/draggable/resizable === false 命中则返回 'event'。 */
function getDisabledEventPolicySource(
  action: CalendarEventChangeAction,
  event: EventObject,
  previousEvent?: EventObjectWithDefaultValues
): CalendarPolicySource | null {
  const policyEvent = previousEvent ?? event;

  if ((action === 'move' || action === 'resize') && policyEvent.editable === false) {
    return 'event';
  }
  if (action === 'move' && policyEvent.draggable === false) {
    return 'event';
  }
  if (action === 'resize' && policyEvent.resizable === false) {
    return 'event';
  }
  return null;
}

export function shouldAcceptMonthEventChange(
  options: Options,
  callbacks: CalendarCallbacks | null | undefined,
  {
    action,
    event,
    previousEvent,
  }: {
    action: CalendarEventChangeAction;
    event: EventObject;
    previousEvent?: EventObjectWithDefaultValues;
  }
): boolean {
  const viewPolicySource = getDisabledViewPolicySource(options, action);
  if (viewPolicySource) {
    dispatchFailed(callbacks, {
      reason: 'policy',
      policySource: viewPolicySource,
      action,
      event,
      previousEvent,
    });
    return false;
  }

  const eventPolicySource = getDisabledEventPolicySource(action, event, previousEvent);
  if (eventPolicySource) {
    dispatchFailed(callbacks, {
      reason: 'policy',
      policySource: eventPolicySource,
      action,
      event,
      previousEvent,
    });
    return false;
  }

  return (
    callbacks?.onValidateEventChange?.({
      action,
      view: 'month',
      event,
      previousEvent,
    }) ?? true
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd packages/calendar && pnpm exec vitest run src/controller/month-validation.spec.ts`
Expected: PASS（4 个用例全绿）

- [ ] **Step 5: 提交**

```bash
git add packages/calendar/src/controller/month-validation.ts packages/calendar/src/controller/month-validation.spec.ts
git commit -m "feat(month): 新增月视图拖拽校验模块"
```

---

## Task 4: MonthInteractionContext

**Files:**
- Create: `packages/calendar/src/components/month/MonthInteractionContext.tsx`

- [ ] **Step 1: 创建 Context（move-only，预留 resize/create 后续扩展）**

创建 `packages/calendar/src/components/month/MonthInteractionContext.tsx`：

```ts
import { createContext, useContext } from 'react';

import { EventUIModel } from '@/model/eventUIModel';

export interface MonthDragPreview {
  /** 落点周行索引 */
  weekIndex: number;
  /** 落点起始列 */
  startCol: number;
  /** 跨列数（clamp 在所在周内） */
  colspan: number;
  kind: 'move' | 'resize' | 'create';
  /** 光标位置，供 tooltip 跟随（首版可不渲染 tooltip） */
  cursorX: number;
  cursorY: number;
}

export interface MonthGridPositionResult {
  weekIndex: number;
  colIndex: number;
  flatOffset: number;
}

export interface MonthInteractionValue {
  weekCount: number;
  colCount: number;
  /** 由 client 坐标求 { weekIndex, colIndex, flatOffset }，容器缺失返回 null */
  gridPositionFinder: (clientX: number, clientY: number) => MonthGridPositionResult | null;
  /** 更新拖拽预览（幽灵条），null 清除 */
  setDragPreview: (preview: MonthDragPreview | null) => void;
  /** 提交移动：按天平移 dayDelta 天 */
  commitMove: (uiModel: EventUIModel, dayDelta: number) => void;
}

const MonthInteractionContext = createContext<MonthInteractionValue | null>(null);

export const MonthInteractionProvider = MonthInteractionContext.Provider;

export function useMonthInteraction(): MonthInteractionValue {
  const value = useContext(MonthInteractionContext);
  if (!value) {
    throw new Error('useMonthInteraction 必须在 MonthInteractionProvider 内使用');
  }
  return value;
}
```

- [ ] **Step 2: 类型检查**

Run: `cd packages/calendar && pnpm exec tsc --noEmit`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add packages/calendar/src/components/month/MonthInteractionContext.tsx
git commit -m "feat(month): 新增月视图交互 Context"
```

---

## Task 5: useMonthEventDrag hook（move）

**Files:**
- Create: `packages/calendar/src/hooks/month/useMonthEventDrag.ts`

- [ ] **Step 1: 创建 hook（镜像 useTimelineEventDrag 的 move 分支）**

创建 `packages/calendar/src/hooks/month/useMonthEventDrag.ts`：

```ts
import { MouseEvent } from 'react';

import {
  MonthDragPreview,
  useMonthInteraction,
} from '@/components/month/MonthInteractionContext';
import { DRAGGING_TYPE_CREATE } from '@/helpers/drag';
import { useDrag } from '@/hooks/common/useDrag';
import { EventUIModel } from '@/model/eventUIModel';
import { DndState } from '@/types/dnd.type';

interface UseMonthEventDragParams {
  uiModel: EventUIModel;
  /** 事件当前所在周行 */
  weekIndex: number;
  /** 事件当前段在周内的起始列 */
  startCol: number;
  /** 事件当前段跨列数 */
  colspan: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 月视图事件条的移动交互（按天换格）。
 *
 * dayDelta = 当前光标落点 flatOffset − 按下时落点 flatOffset（2D 压平）。
 * 拖拽过程中把当前段按 dayDelta 平移后渲染幽灵条；mouseup 经校验提交 onEventUpdate。
 */
export function useMonthEventDrag({
  uiModel,
  weekIndex,
  startCol,
  colspan,
}: UseMonthEventDragParams) {
  const { weekCount, colCount, gridPositionFinder, setDragPreview, commitMove } =
    useMonthInteraction();

  const dayDeltaOf = (e: MouseEvent, dnd: DndState): number => {
    const initPos = gridPositionFinder(dnd.initX ?? e.clientX, dnd.initY ?? e.clientY);
    const curPos = gridPositionFinder(e.clientX, e.clientY);
    if (!initPos || !curPos) {
      return 0;
    }
    return curPos.flatOffset - initPos.flatOffset;
  };

  const previewOf = (dayDelta: number, e: MouseEvent): MonthDragPreview => {
    const srcFlat = weekIndex * colCount + startCol;
    const nextFlat = clamp(srcFlat + dayDelta, 0, weekCount * colCount - 1);
    const nextWeekIndex = Math.floor(nextFlat / colCount);
    const nextStartCol = nextFlat % colCount;
    const nextColspan = clamp(colspan, 1, colCount - nextStartCol);
    return {
      kind: 'move',
      weekIndex: nextWeekIndex,
      startCol: nextStartCol,
      colspan: nextColspan,
      cursorX: e.clientX,
      cursorY: e.clientY,
    };
  };

  const moveType = DRAGGING_TYPE_CREATE.moveEvent('timeGrid', `${uiModel.cid()}`);

  const onMoveStart = useDrag(moveType, {
    onDrag: (e, dnd) => {
      setDragPreview(previewOf(dayDeltaOf(e, dnd), e));
    },
    onMouseUp: (e, dnd) => {
      const dayDelta = dayDeltaOf(e, dnd);
      setDragPreview(null);
      if (dayDelta !== 0) {
        commitMove(uiModel, dayDelta);
      }
    },
  });

  return { onMoveStart };
}
```

> 说明：`DRAGGING_TYPE_CREATE.moveEvent` 的首参是 `DraggingTypes` 域名；timeline 复用 `'timeGrid'` 作为通用拖拽域。这里沿用同一惯例（避免新增枚举值），仅用于区分本次拖拽身份，不影响校验/提交逻辑。

- [ ] **Step 2: 类型检查**

Run: `cd packages/calendar && pnpm exec tsc --noEmit`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add packages/calendar/src/hooks/month/useMonthEventDrag.ts
git commit -m "feat(month): 新增 useMonthEventDrag 移动交互 hook"
```

---

## Task 6: 接线 MonthGrid + MonthEvent

**Files:**
- Modify: `packages/calendar/src/components/month/MonthGrid.tsx`
- Modify: `packages/calendar/src/components/month/MonthEvent.tsx`

- [ ] **Step 1: MonthEvent 增加 weekIndex 入参并绑定 onMouseDown**

`packages/calendar/src/components/month/MonthEvent.tsx`：

1. 顶部新增 import：

```ts
import { useMonthEventDrag } from '@/hooks/month/useMonthEventDrag';
```

2. `MonthEventProps` 接口增加：

```ts
  totalCols: number;
  /** 事件所在周行索引，用于拖拽落点计算 */
  weekIndex: number;
```

3. 组件解构新增 `weekIndex`，并在 `const callbacks = useCalendarCallbacks();` 之后调用 hook：

```ts
  const { onMoveStart } = useMonthEventDrag({ uiModel, weekIndex, startCol, colspan });
```

4. 在最外层 `<div className={cls('month-event')} ...>` 上新增 `onMouseDown={onMoveStart}`（放在 `onClick` 之前）。`useDrag` 内部用 `MINIMUM_DRAG_MOUSE_DISTANCE` 阈值区分点击与拖拽，未越阈值不会触发移动，`onClick` 仍正常打开事件。

- [ ] **Step 2: MonthGrid 挂 gridRef + Provider + commitMove + 幽灵条**

`packages/calendar/src/components/month/MonthGrid.tsx` 整体改写为：

```tsx
import { useCallback, useMemo, useRef, useState } from 'react';

import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStore } from '@/contexts/calendarStore';
import {
  computeMovedMonthEvent,
  getMonthGridPositionFromPoint,
} from '@/controller/month-interaction';
import { MonthWeekEventData } from '@/controller/month.controller';
import { shouldAcceptMonthEventChange } from '@/controller/month-validation';
import { cls } from '@/helpers/css';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObjectWithDefaultValues } from '@/types/events.type';

import {
  MonthDragPreview,
  MonthInteractionProvider,
  MonthInteractionValue,
} from './MonthInteractionContext';
import { MonthEvent } from './MonthEvent';

const CELL_EVENT_HEIGHT = 22;
const CELL_HEADER_HEIGHT = 28;

interface MonthGridProps {
  weeks: DayjsTZDate[][];
  eventRows: MonthWeekEventData[];
  renderDate: DayjsTZDate;
  visibleEventCount: number;
  /** 每周的列数，默认为 7（周日—周六） */
  totalCols?: number;
}

function isSameDay(a: DayjsTZDate, b: DayjsTZDate) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: DayjsTZDate) {
  return isSameDay(date, new DayjsTZDate());
}

function isCurrentMonth(date: DayjsTZDate, renderDate: DayjsTZDate) {
  return (
    date.getFullYear() === renderDate.getFullYear() && date.getMonth() === renderDate.getMonth()
  );
}

export function MonthGrid({
  weeks,
  eventRows,
  renderDate,
  visibleEventCount,
  totalCols = 7,
}: MonthGridProps) {
  const weekCount = weeks.length;
  const rowHeightPercent = 100 / weekCount;

  const options = useCalendarStore((state) => state.options);
  const callbacks = useCalendarCallbacks();
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragPreview, setDragPreview] = useState<MonthDragPreview | null>(null);

  const gridPositionFinder = useCallback(
    (clientX: number, clientY: number) => {
      const container = gridRef.current;
      if (!container) {
        return null;
      }
      const rect = container.getBoundingClientRect();
      return getMonthGridPositionFromPoint({
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
        width: rect.width,
        height: rect.height,
        weekCount,
        colCount: totalCols,
      });
    },
    [weekCount, totalCols]
  );

  const commitMove = useCallback(
    (uiModel: EventUIModel, dayDelta: number) => {
      const prev = uiModel.model.toEventObject();
      const next = computeMovedMonthEvent(prev, dayDelta);
      const accepted = shouldAcceptMonthEventChange(options, callbacks, {
        action: 'move',
        event: next,
        previousEvent: prev as EventObjectWithDefaultValues,
      });
      if (!accepted) {
        return;
      }
      callbacks?.onEventUpdate?.({ event: next, previousEvent: prev as EventObjectWithDefaultValues });
    },
    [options, callbacks]
  );

  const interactionValue = useMemo<MonthInteractionValue>(
    () => ({
      weekCount,
      colCount: totalCols,
      gridPositionFinder,
      setDragPreview,
      commitMove,
    }),
    [weekCount, totalCols, gridPositionFinder, commitMove]
  );

  return (
    <MonthInteractionProvider value={interactionValue}>
      <div className={cls('month-grid')} ref={gridRef}>
        {weeks.map((week, weekIndex) => {
          const { rows, overflowByCol } = eventRows[weekIndex] ?? { rows: [], overflowByCol: [] };
          const ghost = dragPreview?.weekIndex === weekIndex ? dragPreview : null;

          return (
            <div
              key={weekIndex}
              className={cls('month-week-row')}
              style={{ height: `${rowHeightPercent}%` }}
            >
              {week.map((date, colIndex) => {
                const today = isToday(date);
                const currentMonth = isCurrentMonth(date, renderDate);
                const overflow = overflowByCol[colIndex] ?? 0;

                return (
                  <div
                    key={colIndex}
                    className={cls('month-cell', {
                      'month-cell-today': today,
                      'month-cell-other-month': !currentMonth,
                    })}
                  >
                    <div className={cls('month-cell-header')}>
                      <span className={cls('month-cell-date', { 'month-cell-date-today': today })}>
                        {date.getDate()}
                      </span>
                    </div>
                    {overflow > 0 && (
                      <div
                        className={cls('month-more')}
                        style={{ top: CELL_HEADER_HEIGHT + visibleEventCount * CELL_EVENT_HEIGHT }}
                      >
                        +{overflow} 更多
                      </div>
                    )}
                  </div>
                );
              })}

              <div className={cls('month-event-layer')}>
                {rows.map(({ uiModel, startCol, colspan, slotIndex }, i) => (
                  <MonthEvent
                    key={i}
                    uiModel={uiModel}
                    startCol={startCol}
                    colspan={colspan}
                    slotIndex={slotIndex}
                    cellEventHeight={CELL_EVENT_HEIGHT}
                    cellHeaderHeight={CELL_HEADER_HEIGHT}
                    totalCols={totalCols}
                    weekIndex={weekIndex}
                  />
                ))}

                {ghost && (
                  <div
                    className={cls('month-event-ghost')}
                    style={{
                      position: 'absolute',
                      left: `${(ghost.startCol / totalCols) * 100}%`,
                      width: `calc(${(ghost.colspan / totalCols) * 100}% - 4px)`,
                      top: CELL_HEADER_HEIGHT,
                      height: CELL_EVENT_HEIGHT - 2,
                      borderRadius: 3,
                      border: '1px dashed #1677ff',
                      background: 'rgba(22,119,255,0.12)',
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </MonthInteractionProvider>
  );
}
```

> 关键点：幽灵条渲染在落点周行的 `month-event-layer` 内，复用 `MonthEvent` 同款百分比定位；`top` 固定在 header 之下首行（首版单段落点高亮，不做多段/多行堆叠）。

- [ ] **Step 3: 类型检查 + 全量测试**

Run: `cd packages/calendar && pnpm exec tsc --noEmit && pnpm exec vitest run`
Expected: PASS（含既有 304 用例 + 新增 month 用例；无回归）

- [ ] **Step 4: 提交**

```bash
git add packages/calendar/src/components/month/MonthGrid.tsx packages/calendar/src/components/month/MonthEvent.tsx
git commit -m "feat(month): 月视图事件支持拖动换天并显示落点预览"
```

---

## Task 7: 更新 SPEC.md

**Files:**
- Modify: `packages/calendar/SPEC.md`

- [x] **Step 1: 升级月视图能力描述**

`packages/calendar/SPEC.md` 第 39 行月视图能力行，把「交互能力仍未扩展」改为说明已支持拖动换天：

```
| 月视图（Month）     | 🟡 事件 + 拖动 | 月历格子 + 事件卡片，支持 `startDayOfWeek` 与 `workweek`；事件支持拖动换天（move，日粒度，保留时长），resize / 空白创建为后续增量 |
```

- [x] **Step 2: 在 `MonthOptions` 类型块补开关字段**

在 SPEC `month?: { startDayOfWeek?; isAlways6Rows?; ... }` 选项块（第 139-142 行附近）补充：

```ts
  month?: {
    startDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    isAlways6Rows?: boolean;
    dragToMove?: boolean;    // 默认 true，isReadOnly 时强制 false
    dragToResize?: boolean;  // 默认 true（resize 能力后续增量）
    dragToCreate?: boolean;  // 默认 true（创建能力后续增量）
  };
```

- [x] **Step 3: 拖拽测试覆盖表新增 Month 行**

在第 498-502 行的「拖拽测试覆盖」表内，Week 行下方新增：

```
| Month     | ✅ MonthDragMove    | — (后续)          | ✅       | ✅ 跨周平移         | ✅ Enter/Space        |
```

- [x] **Step 4: docs 门禁校验**

Run: `node scripts/check-docs.mjs && node scripts/check-arch.mjs`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add packages/calendar/SPEC.md
git commit -m "docs(month): SPEC 同步月视图拖动换天能力与选项"
```

---

## Task 8: Storybook 交互测试 MonthDragMove

**Files:**
- 定位现有月视图 story 文件（执行时先 `ls packages/calendar/src/**/*.stories.tsx | grep -i month`；若无独立 month story，则在最接近的日历 story 文件内新增 play 用例）。

- [x] **Step 1: 找到 month story 落点**

Run: `ls packages/calendar/src/**/*.stories.tsx 2>/dev/null; grep -rln "Month" packages/calendar/src --include=*.stories.tsx`
Expected: 输出含月视图的 story 文件路径。记录路径备用。

- [x] **Step 2: 写交互测试 play 函数**

在该 story 文件新增一个 `MonthDragMove` story，渲染含一个已知事件的月视图，注册 `onEventUpdate` spy（用 `fn()` from `@storybook/test`），用 `userEvent` 在事件卡片上 `pointer` 序列模拟「按下 → 移动到目标格子 → 抬起」，断言 `onEventUpdate` 被调用且新 `start` 日期 = 目标日期。参考既有 Week/Scheduler 的 DragVertical play 用例写法（`grep -rn "DragVertical\|onEventUpdate" packages/calendar/src --include=*.stories.tsx` 取最接近的模板，复制其 pointer 驱动与断言结构）。

> 注：此步代码依赖现有 story 模板结构，执行时按实际 story 文件的 `meta`/`render` 形态对齐；保持与既有 drag play 用例同款 `step()` 分段与 `expect(onEventUpdate).toHaveBeenCalled()` 断言。

- [x] **Step 3: 运行 Storybook 测试**

Run: `cd packages/calendar && pnpm test-storybook 2>/dev/null || pnpm exec test-storybook`（按项目实际脚本名；先 `grep test-storybook packages/calendar/package.json`）
Expected: `MonthDragMove` 通过

- [ ] **Step 4: 提交**

```bash
git add packages/calendar/src/**/*.stories.tsx
git commit -m "test(month): 新增月视图拖动换天交互测试"
```

---

## 收尾

- [x] 回写 `docs/tasks/2026-06-17-month-view-drag.md` 的「实施结果」段：实际改动、与原计划偏差、验证结果、剩余问题（resize / create / narrowWeekend 精确命中 / 跨周多段幽灵条）。
- [x] 全量门禁：`node scripts/check-docs.mjs && node scripts/check-arch.mjs && pnpm lint && pnpm -r exec tsc --noEmit && pnpm test`
- [ ] 用 `superpowers:finishing-a-development-branch` 决定合并 / PR。
