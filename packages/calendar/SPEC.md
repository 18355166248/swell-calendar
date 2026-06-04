# swell-calendar SPEC

> 约束即产品。本文件定义 swell-calendar 组件库的功能边界、API 接口和不变式。
> 所有实现决策须以此文件为准。如需变更，先修改本文件并获得 review。

## 产品定位

swell-calendar 是一个**可嵌入的 React 日历组件库**，面向需要在产品中集成日历功能的开发团队。发布为 NPM 包，与宿主应用的样式系统解耦。

## 外部参考

当前 scheduler 路线图的主参考样例为：

- `Mobiscroll React Scheduler Desktop Week View`
- <https://demo.mobiscroll.com/react/scheduler/desktop-week-view>

说明：

- 参考的是桌面端 scheduler 的产品行为、布局和交互闭环
- 不要求与 Mobiscroll 保持同名 API
- `agenda`、移动端适配、`connections`、`eventList` 不在当前近期范围

## 核心约束

1. **零副作用样式**：所有 CSS 类名带 `swell-calendar-` 前缀，不污染宿主页面
2. **多实例隔离**：同一页面可挂载多个独立日历实例，Store 互不干扰
3. **纯组件库**：不包含数据获取逻辑，事件数据由宿主应用注入
4. **主题可替换**：通过 ThemeStore 配置颜色，不依赖 CSS 变量注入
5. **模板可定制**：通过 `options.template` 替换任意渲染函数

## 功能规范

### 视图

| 视图                | 状态        | 描述                                                                        |
| ------------------- | ----------- | --------------------------------------------------------------------------- |
| 日视图（Day）       | ✅ 完成     | 单日时间网格，24 小时展示                                                   |
| 周视图（Week）      | ✅ 完成     | 7 天时间网格，支持 workweek 模式                                            |
| 月视图（Month）     | 🟡 事件可用 | 月历格子 + 事件卡片，支持 `startDayOfWeek` 与 `workweek`，交互能力仍未扩展 |
| 时间线（Timeline）  | 🟡 事件可用 | 资源行 + 横向时间轴，事件布局已修复，支持 colors/invalid 区段，Toolbar 可见 |
| 调度器（Scheduler） | 🟡 核心基线可用 | 垂直时间轴 + 资源列的 time-grid 视图，已具备桌面端基础闭环，Phase 3 高级能力未完成 |

### 事件功能

| 功能                           | 状态 | 描述                                                          |
| ------------------------------ | ---- | ------------------------------------------------------------- |
| 事件渲染                       | ✅   | 时间范围显示为卡片                                            |
| 碰撞布局                       | ✅   | 重叠事件自动并排，分配宽度                                    |
| 拖拽移动                       | ✅   | 鼠标拖动修改事件时间，30min 吸附                              |
| 拖拽调整                       | ✅   | 拖动事件底部边缘调整结束时间                                  |
| 新建事件                       | ✅   | 点击或框选时间段触发创建                                      |
| 只读模式                       | ✅   | `isReadOnly: true` 禁用所有交互                               |
| 自定义颜色                     | ✅   | 按日历 ID 配置事件颜色                                        |
| `invalid` / `blockedTimes`     | 🟡   | `invalid` 为主名，运行时兼容 `blockedTimes`                   |
| `colors` 背景区段（scheduler） | ✅   | scheduler/timeline time-grid 背景时段，`invalid` 视觉层级在上 |
| all-day lane（scheduler）      | ✅   | scheduler 顶部全天事件栏                                      |
| 多日事件分段（scheduler）      | ✅   | scheduler time 事件按日期切分到资源列                         |
| overlap policy                 | ✅   | scheduler 全局 `eventOverlap` 与 per-event `overlap` 均已接入 |
| 删除事件（scheduler）          | ✅   | 聚焦事件卡片后支持 `Delete/Backspace` 删除                    |
| failed callbacks               | ✅   | `onEventCreateFailed` / `onEventUpdateFailed` 已接入          |
| 资源显隐                       | ✅   | `visibleResourceIds` 可控制 scheduler/timeline 可见资源       |
| 资源分组 / 折叠                | ✅   | `children` / `collapsed` 支持树形资源与折叠显示               |
| shared events                  | ✅   | `resourceIds` 可让事件出现在多个资源列，资源级策略按命中的所有资源共同判定 |
| 资源级交互限制                 | ✅   | `eventDragInTime` / `eventResize` / `eventOverlap` 已接入     |
| 跨资源拖动 gate                | ✅   | scheduler 全局 / 资源级 / per-event `dragBetweenResources` 已接入 |
| recurrence / timezone          | 🟡   | 字段已有，行为尚未接入                                        |

### 当前范围基线（2026-06）

当前仓库对标的是 `Mobiscroll React Scheduler Desktop Week View` 的桌面端基础闭环，已经进入“可继续收敛 API 与交互细节”的阶段，不再是纯底座 demo。

当前**已进入基线**的 scheduler 能力：

- 多资源列与资源头
- all-day lane
- 多日事件分段
- `invalid` / `colors`
- create / move / resize / delete
- overlap policy / buffer
- 模板插槽、hover、cell click、failed callbacks
- `visibleResourceIds`
- 资源分组 / 折叠
- shared events
- 资源级与 per-event 交互限制

当前**仍明确后置**的能力：

- recurrence 行为展开与 recurring exceptions（类型层已就绪：`RecurrenceRule` / `RecurringException` / `recurringExceptions` / `recurringExceptionRule`，运行时引擎待接入）
- timezone 驱动的渲染和编辑语义
- external drag & drop
- 跨实例拖拽
- `agenda`
- 移动端适配
- `connections`
- `eventList`
- 虚拟化、打印、a11y 强化

shared events 的资源策略固定为：

- 一个事件通过 `resourceIds` 命中多个资源列时，这些资源都参与资源级策略判定
- `eventDragInTime` / `eventResize` / `eventOverlap` / `eventDragBetweenResources` 采用保守语义：
  - 任一命中资源显式 `false`：拒绝
  - 否则任一命中资源显式 `true`：允许
  - 否则回退到全局策略或现有默认语义
- `dragBetweenResources` 同时检查 source 资源集合与 target 资源

### 配置选项（`CalendarOptions`）

```ts
interface CalendarOptions {
  defaultView?: 'day' | 'week' | 'month' | 'scheduler' | 'timeline';
  initialDate?: Date | string;
  isReadOnly?: boolean;
  views?: {
    day?: boolean;
    week?: boolean;
    month?: boolean;
    scheduler?: boolean;
    timeline?: boolean;
  };
  week?: {
    startDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    workweek?: boolean;
    narrowWeekend?: boolean;
    hourStart?: number;
    hourEnd?: number;
    invalid?: BlockedTimeRange[];
    blockedTimes?: BlockedTimeRange[];
  };
  month?: {
    startDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    isAlways6Rows?: boolean;
  };
  scheduler?: {
    resources?: ResourceInfo[];
    hourStart?: number;
    hourEnd?: number;
    invalid?: BlockedTimeRange[];
    blockedTimes?: BlockedTimeRange[];
    colors?: ColoredRange[];
    dragToCreate?: boolean;
    dragToMove?: boolean;
    dragToResize?: boolean;
    dragInTime?: boolean;
    eventOverlap?: boolean;
    visibleResourceIds?: string[];
    dragBetweenResources?: boolean;
  };
  timeline?: {
    resources?: ResourceInfo[];
    hourStart?: number;
    hourEnd?: number;
    rowHeight?: number;
    cellWidth?: number;
    invalid?: BlockedTimeRange[];
    blockedTimes?: BlockedTimeRange[];
    colors?: ColoredRange[];
    visibleResourceIds?: string[];
  };
  template?: Partial<Template>;
}
```

### 事件数据结构（`EventObject`）

```ts
interface EventObject {
  id: string;
  calendarId: string;
  title: string;
  start: Date | string; // ISO 8601
  end: Date | string;
  allDay?: boolean;
  isAllday?: boolean; // 兼容旧字段，迁移期保留
  resourceId?: string;
  resourceIds?: string[];
  timezone?: string;
  recurrence?: RecurrenceRule;
  recurringExceptions?: RecurringException[];
  recurringExceptionRule?: RecurrenceRule;
  category?: 'time' | 'allday' | 'milestone' | 'task';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  dragBackgroundColor?: string;
  order?: number;
  isReadOnly?: boolean;
  editable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  overlap?: boolean;
  dragBetweenResources?: boolean;
  bufferBefore?: number;
  bufferAfter?: number;
  meta?: Record<string, unknown>;
  body?: string;
}
```

### 重复规则（`RecurrenceRule`）与异常（`RecurringException`）

```ts
// 控制事件重复周期的规则
interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;       // 间隔，默认 1
  count?: number;          // 重复次数上限（与 until 互斥）
  until?: DateType;        // 截止日期（与 count 互斥）
  byWeekDays?: number[];   // 按周几，0=周日，仅 weekly
  byMonthDays?: number[];  // 按月内日期，仅 monthly
  exceptions?: DateType[]; // 排除/跳过日期
}

// 单次发生的覆盖/跳过
interface RecurringException {
  date: DateType;                    // 要覆盖/跳过的发生日期
  skipped?: boolean;                 // true 跳过该次
  overrides?: Partial<EventObject>;  // 替换该次属性
}
```

> 注：`recurrence` / `recurringExceptions` / `recurringExceptionRule` 的类型层已于 2026-06-04 落地，
> 运行时展开引擎与编辑语义仍属 Phase 3 后置范围。

### 资源结构（`ResourceInfo`）

```ts
interface ResourceInfo {
  id: string;
  name: string;
  parentId?: string;
  children?: ResourceInfo[];
  collapsed?: boolean;
  color?: string;
  backgroundColor?: string;
  hidden?: boolean;
  order?: number;
  width?: number | string;
  meta?: Record<string, unknown>;
  eventDragInTime?: boolean;
  eventDragBetweenResources?: boolean;
  eventResize?: boolean;
  eventOverlap?: boolean;
}

interface BlockedTimeRange {
  start: Date | string;
  end: Date | string;
  resourceId?: string;
  resourceIds?: string[];
}

interface ColoredRange {
  start: Date | string;
  end: Date | string;
  resourceId?: string;
  resourceIds?: string[];
  background?: string;
  color?: string;
  cssClass?: string;
}
```

### 模板接口（`Template`）

12 个可定制渲染点：

| 函数名                       | 渲染位置                   |
| ---------------------------- | -------------------------- |
| `timeGridDisplayPrimaryTime` | 时间轴上的主时间标签       |
| `timeGridDisplayTime`        | 时间轴其他时间格           |
| `weekDayName`                | 周视图顶部星期名称         |
| `monthDayName`               | 月视图顶部星期名称         |
| `time`                       | 时间事件卡片内容           |
| `schedulerTime`              | scheduler 时间事件卡片内容 |
| `timeMove`                   | 拖拽中的事件卡片内容       |
| `timeMoveGuide`              | 拖拽时间提示               |
| `timeGridNowIndicatorLabel`  | 当前时间指示器标签         |
| `monthGridHeader`            | 月视图日期格头部           |
| `schedulerDayHeader`         | scheduler 顶部日期头       |
| `schedulerResourceHeader`    | scheduler 资源列头         |

## API 接口

### 组件 Props

```ts
interface CalendarProps {
  calendars?: CalendarInfo[]; // 日历列表（定义颜色）
  events?: EventObject[]; // 事件数据
  options?: CalendarOptions; // 配置选项
  theme?: Partial<ThemeState>; // 主题配置
  callbacks?: {
    onEventClick?: (info: { event: EventObjectWithDefaultValues }) => void;
    onCellClick?: (info: {
      view: ViewType;
      start: DayjsTZDate;
      end: DayjsTZDate;
      resourceId?: string;
      resourceIds?: string[];
      resourceNames?: string[];
    }) => void;
    onEventHover?: (info: { event: EventObjectWithDefaultValues; hovering: boolean }) => void;
    onPageChange?: (info: { view: ViewType; date: DayjsTZDate }) => void;
    onRangeSelect?: (info: {
      view: ViewType;
      start: DayjsTZDate;
      end: DayjsTZDate;
      resourceId?: string;
      resourceIds?: string[];
      resourceNames?: string[];
    }) => void;
    onEventCreate?: (info: { event: EventObject }) => void;
    onEventUpdate?: (info: {
      event: EventObject;
      previousEvent: EventObjectWithDefaultValues;
    }) => void;
    onEventCreateFailed?: (info: {
      reason: 'invalid' | 'overlap' | 'readonly' | 'policy';
      policySource?: 'event' | 'resource' | 'view';
      action: 'create' | 'move' | 'resize' | 'delete';
      event: EventObject;
      previousEvent?: EventObjectWithDefaultValues;
    }) => void;
    onEventUpdateFailed?: (info: {
      reason: 'invalid' | 'overlap' | 'readonly' | 'policy';
      policySource?: 'event' | 'resource' | 'view';
      action: 'create' | 'move' | 'resize' | 'delete';
      event: EventObject;
      previousEvent?: EventObjectWithDefaultValues;
    }) => void;
    onEventDelete?: (info: { event: EventObjectWithDefaultValues }) => void;
    onValidateEventChange?: (info: {
      action: 'create' | 'move' | 'resize' | 'delete';
      view: ViewType;
      event: EventObject;
      previousEvent?: EventObjectWithDefaultValues;
    }) => boolean;
  };
}
```

### 命令式实例 API（`CalendarInstance`）

```ts
interface CalendarInstance {
  getDate(): DayjsTZDate;
  setDate(date: Date | string): void;
  setView(view: ViewType): void;
  navigate(direction: 'prev' | 'next'): void;
  goToToday(): void;
  setEvents(events: EventObject[]): void;
  getEvents(): EventObjectWithDefaultValues[];
}
```

## 测试体系

| 层级       | 工具                               | 运行命令                                 |
| ---------- | ---------------------------------- | ---------------------------------------- |
| 单元测试   | Vitest (jsdom)                     | `pnpm test`                              |
| 交互测试   | Storybook test-runner (Playwright) | `pnpm test:storybook`                    |
| 可视化交互 | headed 模式（Chromium 可见）       | `SLOWMO=5000 pnpm test:storybook:headed` |

### 拖拽测试覆盖

| 视图      | 拖拽移动            | 拖拽调整          | ESC 取消 | 跨天/跨资源         | 键盘交互              |
| --------- | ------------------- | ----------------- | -------- | ------------------- | --------------------- |
| Scheduler | ✅ DragVertical     | ✅ DragResize     | ✅       | ✅ OverlapPolicy    | ✅ KeyboardNavigation |
| Day       | ✅ DayDragVertical  | ✅ DayDragResize  | ✅       | —                   | ✅ Enter/Space        |
| Week      | ✅ WeekDragVertical | ✅ WeekDragResize | ✅       | ✅ WeekDragCrossDay | ✅ Enter/Space        |
| Timeline  | —                   | —                 | —        | —                   | ✅ Enter/Space        |

测试文件位于 `src/slices/dnd.slice.spec.ts`（DnD 状态机）和 `src/stories/Calendar/`（各个视图的故事文件，含 Timeline）。

## 不变式（Invariants）

以下约束由 lint + 测试机械化守护：

1. **CSS 前缀**：所有生成的 CSS 类名必须以 `swell-calendar-` 开头
2. **无全局副作用**：组件挂载/卸载不修改 `window`、`document.body`
3. **分层依赖**：`types → constants → utils → time → model → ... → components`，不可逆向
4. **HTML 净化**：所有用户提供的 HTML 内容必须经过 `sanitizer.ts` 的 DOMPurify 净化
5. **事件不可变**：原始 `EventObject` 不直接修改，统一通过 `EventModel` 封装操作

## 待开发功能（Backlog）

- [ ] Timeline 拖拽交互（移动/调整）
- [ ] agenda 视图
- [ ] recurrence 实例展开与编辑协议
- [ ] 月视图 workweek 支持
- [ ] 顶边 resize（Scheduler 事件顶边调整开始时间）
- [ ] 资源层级渲染（利用 `parentId` 字段）
- [ ] 虚拟化（超长事件列表性能优化）

## 当前阶段说明

- `timeline` 维持横向资源时间轴，面向资源时间段浏览
- `scheduler` 使用垂直 time-grid + 资源列布局
- `scheduler` 当前为近期核心，`timeline` 本轮只保证不退化
- 宿主受控是默认数据所有权模型，最终事件数据始终以 `props.events` 为准
- `scheduler` 当前已向宿主暴露资源化的区间选择创建意图和拖拽移动更新意图
- `scheduler` 当前已支持 time-grid 内单列事件 resize 后的更新意图回调
- `scheduler` 当前已有独立 layout pipeline，支持 all-day lane、多日 time 事件分段、`colors` 背景区段和同槽位 `order`
- `create/move/resize` 当前支持通过 `onValidateEventChange` 做同步准入校验
- `create/move/resize` 当前也会先检查 `invalid` / `blockedTimes`，命中后直接拒绝提交
- `invalid` / `blockedTimes` 当前会在 time-grid 中渲染为只读遮罩，提示不可操作区域
- 内部尚未内建事件编辑弹窗、冲突校验、blocked time 和 recurrence 编辑
