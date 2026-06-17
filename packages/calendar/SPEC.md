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
4. **主题可替换**：通过 ThemeStore 配置颜色（含 timeline 视图），不依赖 CSS 变量注入
5. **模板可定制**：通过 `options.template` 替换任意渲染函数

## 功能规范

### 视图

| 视图                | 状态        | 描述                                                                        |
| ------------------- | ----------- | --------------------------------------------------------------------------- |
| 日视图（Day）       | ✅ 完成     | 单日时间网格，24 小时展示                                                   |
| 周视图（Week）      | ✅ 完成     | 7 天时间网格，支持 workweek 模式                                            |
| 月视图（Month）     | ✅ 事件 + 拖动 | 月历格子 + 事件卡片，支持 `startDayOfWeek` 与 `workweek`；事件支持拖动换天（move，日粒度，保留时长）、左右 resize（改跨天天数）与空白格子横向框选创建全天事件（create） |
| 时间线（Timeline）  | ✅ 日粒度排程 | 对标 Mobiscroll Calendar timeline：按天列（当月）+ 资源行，事件渲染为跨天横条、同行重叠按车道堆叠、行高自适应，今天列高亮、周末浅染；资源池与 scheduler 共享；支持拖拽移动（含跨资源行）/ 左右 resize / 空白拖拽创建 / 日期 tooltip |
| 调度器（Scheduler） | 🟡 核心闭环可用 | 垂直时间轴 + 资源列的 time-grid 视图，桌面端核心业务闭环已形成，当前进入 Phase 3 高级体验收口阶段 |

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
| 多日 time 事件分段（day/week） | ✅   | 跨天（>24h）的 `time` 事件在日/周时间网格内按天分段渲染（起始日起点→当日底、中间日整列、结束日顶→终点），**不再**因时长超 24h 塌进顶部全天条；仅显式 `allDay` / `isAllday` 进全天栏。分段标签两行布局（第一行标题、第二行时间）：起始列第二行显示「开始 -」（右侧 `-` 表示向后延续）、结束列显示「- 结束」（左侧 `-` 表示从前一日延续）、中间整天列显示「全天」。单日事件同样为两行布局（第一行标题、第二行开始时间，无延续标记）。新建框选预览：起始列显示 `开始 - 结束` 完整区间、结束列显示结束时间、中间列留空。详见下方说明 |
| overlap policy                 | ✅   | scheduler 全局 `eventOverlap` 与 per-event `overlap` 均已接入 |
| 删除事件（scheduler）          | ✅   | 聚焦事件卡片后支持 `Delete/Backspace` 删除                    |
| failed callbacks               | ✅   | `onEventCreateFailed` / `onEventUpdateFailed` 已接入          |
| 拖拽时间提示（time-grid）      | ✅   | 移动/缩放事件时跟随光标显示 `HH:mm - HH:mm` 浮层（`DragTimeTooltip`），day/week/scheduler 全部生效（此前仅 scheduler）；新建框选则在选区内直接显示起止时间 |
| 事件卡片透明度                 | ✅   | day/week time-grid 与 month 事件卡片静置时 `opacity: 0.9`（更轻、与网格/重叠融合），hover 恢复 `1`；time-grid 拖拽目标仍 `0.5`，move/resize 引导阴影为半透明。time-grid 由 `events/time.scss` 控制，month 由 `MonthEvent` + `monthGrid.scss` 控制 |
| 事件悬浮高亮 / 跨天联动        | ✅   | 鼠标经过事件卡片加深（恢复不透明 + 投影 + 提亮）。跨天事件按列拆成多段时，悬浮任一段会让同一事件（按 `hover` slice 的 `hoveredEventId` 匹配）的所有段一起加深，离开同步还原 |
| 资源显隐                       | ✅   | `visibleResourceIds` 可控制 scheduler/timeline 可见资源       |
| 资源分组 / 折叠                | ✅   | `children` / `collapsed` 支持树形资源与折叠显示               |
| shared events                  | ✅   | `resourceIds` 可让事件出现在多个资源列，资源级策略按命中的所有资源共同判定 |
| 资源级交互限制                 | ✅   | `eventDragInTime` / `eventResize` / `eventOverlap` 已接入     |
| 跨资源拖动 gate                | ✅   | scheduler 全局 / 资源级 / per-event `dragBetweenResources` 已接入 |
| recurrence 展开 + exceptions     | ✅   | scheduler 已接入视口内展开，`recurringExceptions` 跳过/替换与实例编辑链已闭环 |
| recurrence 编辑作用域             | ✅   | 支持 `single` / `following` / `all` 三种作用域，`applyRecurrenceEditScope` 工具函数已落地，`onEventUpdate` / `onEventDelete` 回调已携带 `recurrenceInstance` 信息 |
| timezone 转换                     | ✅   | `displayTimezone` + per-event `timezone` 已接入 scheduler 渲染链（数据时区→显示时区）；`timezones` 支持主轴左侧叠加副时区刻度轴；全天事件按业内方案（floating）时区无关、不随时区平移边界 |
| external DnD                      | 🟡   | `allowExternalDrop` + `onExternalDrop` / `onExternalDropFailed` 与目标格预览阴影已接入 scheduler；第三方库封装仍未接入 |
| 跨实例拖动                         | ✅   | `onCrossInstanceDragEnd` / `onCrossInstanceDrop` 与目标实例实时预览阴影已接入 scheduler；策略钉死为「仅移动」：resize / create 为实例内行为，不参与跨实例桥 |

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
- recurrence 展开 / exceptions / 编辑作用域
- timezone 数据时区 -> 显示时区转换
- external DnD（`onExternalDrop` / `onExternalDropFailed`）
- 跨实例拖动（`onCrossInstanceDragEnd` / `onCrossInstanceDrop`）

当前**仍明确后置**的能力：

- external DnD 第三方库封装
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
    /** 允许拖动事件改期（换天）。默认 true；isReadOnly 时强制 false */
    dragToMove?: boolean;
    /** 允许拖动事件两端 resize（改跨天天数）。默认 true；isReadOnly 时强制 false */
    dragToResize?: boolean;
    /** 允许空白格子拖拽创建事件。默认 true；isReadOnly 时强制 false */
    dragToCreate?: boolean;
  };
  scheduler?: {
    resources?: ResourceInfo[];
    hourStart?: number;
    hourEnd?: number;
    workweek?: boolean;
    /** 固定列宽（px）。设置后 scheduler 启用水平滚动，每列宽度固定为此值 */
    columnWidth?: number;
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
    displayTimezone?: string;
    timezones?: { timezone: string; displayLabel?: string }[];
    allowExternalDrop?: boolean;
  };
  timeline?: {
    resources?: ResourceInfo[];
    visibleResourceIds?: string[];
    // cellWidth：天列宽度（px）。日粒度 Calendar timeline 已采用按天列布局，
    // 下列 hourStart/hourEnd/rowHeight/invalid/blockedTimes/colors 为旧「小时条」遗留字段，
    // 当前 timeline 渲染不再消费（保留以兼容类型，不破坏宿主）。
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
  recurrenceParentId?: string;
  recurrenceOccurrenceDate?: DayjsTZDate;
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
> scheduler 渲染链的视口内展开与 exceptions 跳过/替换已于 2026-06-05 接入。
> `timezone` 的数据→显示时区转换已于 2026-06-05 接入 scheduler 渲染链（`displayTimezone` + per-event `timezone`）。
> `scheduler.timezones` 已于 2026-06-07 接入：在主时间轴左侧叠加副时区刻度轴，按配置顺序向左排列，刻度由主显示时区（`displayTimezone`，缺省为浏览器本地时区）换算到各副时区。
> 全天事件采用业内通行的 floating（时区无关）语义：对齐 Google Calendar / RFC 5545 floating time，全天事件锚定在其日历日期上，**不**随 `displayTimezone` 平移边界；只有定时事件参与数据→显示时区换算。
> 编辑作用域（`single` / `following` / `all`）已于 2026-06-06 落地，`applyRecurrenceEditScope` 工具函数与回调 `recurrenceInstance` 信息已接入。
> 跨天定时事件的归类规则（2026-06-13 调整）：`category: 'time'` 事件**不再**因「时长 > 24h」被归为全天。`isAllday` 仅按显式 `allDay` / `isAllday` 判定，`isTimeEvent` 不再排除 `hasMultiDates`。后果：日/周视图中跨天定时事件在时间网格内按天分段渲染（每列经 `setRenderInfo` 裁剪到当天可见范围），与 scheduler 的多日分段行为对齐；顶部全天栏只保留显式全天事件。此前的「>24h time 事件 → 全天条」为继承自 toast-ui 的旧默认，已移除。

### 重复事件编辑作用域 API

```ts
// 编辑作用域枚举
type CalendarRecurrenceEditScope = 'single' | 'following' | 'all';

// 重复事件实例信息（携带在 update/delete 回调中）
interface CalendarRecurrenceInstanceInfo {
  recurrenceParentId: string;
  recurrenceOccurrenceDate: DayjsTZDate;
}

// onEventUpdate 回调的 info 参数
interface CalendarEventUpdateInfo {
  event: EventObject;
  previousEvent: EventObjectWithDefaultValues;
  recurrenceInstance?: CalendarRecurrenceInstanceInfo;
}

// onEventDelete 回调的 info 参数
interface CalendarEventDeleteInfo {
  event: EventObjectWithDefaultValues;
  recurrenceInstance?: CalendarRecurrenceInstanceInfo;
}
```

工具函数：

```ts
// 根据作用域对重复事件执行编辑操作
function applyRecurrenceEditScope(params: {
  event: EventObject;
  scope: CalendarRecurrenceEditScope;
  changes: Partial<EventObject>;
}): EventObject | EventObject[];

// 判断事件是否为重复事件的某个实例
function isRecurrenceInstance(event: EventObject): boolean;

// 从展开后的实例事件构建 CalendarRecurrenceInstanceInfo
function buildRecurrenceInstanceInfo(event: EventObject): CalendarRecurrenceInstanceInfo | null;
```

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
  allowExternalDrop?: boolean;
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
    onEventUpdate?: (info: CalendarEventUpdateInfo) => void;
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
    onEventDelete?: (info: CalendarEventDeleteInfo) => void;
    onValidateEventChange?: (info: {
      action: 'create' | 'move' | 'resize' | 'delete';
      view: ViewType;
      event: EventObject;
      previousEvent?: EventObjectWithDefaultValues;
    }) => boolean;
    onExternalDrop?: (info: {
      dataTransfer: DataTransfer;
      date: DayjsTZDate;
      start: DayjsTZDate;
      end: DayjsTZDate;
      resourceId?: string;
      resourceName?: string;
    }) => void;
    onExternalDropFailed?: (info: {
      reason: 'invalid' | 'policy';
      policySource?: 'resource' | 'view';
      dataTransfer: DataTransfer;
      date: DayjsTZDate;
      start: DayjsTZDate;
      end: DayjsTZDate;
      resourceId?: string;
    }) => void;
    onCrossInstanceDragEnd?: (info: {
      event: EventObjectWithDefaultValues;
    }) => void;
    onCrossInstanceDrop?: (info: {
      event: EventObject;
      date: DayjsTZDate;
      start: DayjsTZDate;
      end: DayjsTZDate;
      resourceId?: string;
      resourceName?: string;
    }) => void;
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

### 宿主侧数据装配（可选）

引擎本体只消费 `EventObject` props，数据获取/持久化是宿主职责。为减少"把 Calendar 接到异步数据源"的重复样板，包额外暴露一对**可选**宿主侧装配件，不参与渲染/交互引擎本体：

```ts
// 异步事件数据源契约；任意实现（HTTP / IndexedDB / localStorage）皆可
interface CalendarDataSource<TEvent, TDraft = Omit<TEvent, 'id'>> {
  list(): Promise<TEvent[]>;
  create(draft: TDraft): Promise<TEvent>;
  update(id: string, patch: TDraft): Promise<TEvent>;
  remove(id: string): Promise<void>;
}

type CalendarDataStatus = 'loading' | 'ready' | 'error';

// 托管数据源的三态与 CRUD；StrictMode 安全，mutation 后静默重拉列表
function useCalendarDataSource<TEvent, TDraft>(
  source: CalendarDataSource<TEvent, TDraft>
): {
  events: TEvent[];
  status: CalendarDataStatus;
  error: string | null;
  reload: () => void;
  createEvent: (draft: TDraft) => Promise<void>;
  updateEvent: (id: string, patch: TDraft) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
};
```

约定：

- `TEvent` 是宿主领域事件类型；宿主自行把它转换为 `EventObject` 再传给 `Calendar`，hook 不做转换
- `TDraft` 默认 `Omit<TEvent, 'id'>`，`id` 由数据源（后端职责）分配
- `list()` 返回完整列表；`status='loading'` 仅首屏/`reload()` 出现，mutation 走静默重拉不闪 loading
- 失败时 `status='error'` 且 `error` 取 `Error.message`，无 message 时回退中性英文兜底

## 测试体系

| 层级       | 工具                               | 运行命令                                 |
| ---------- | ---------------------------------- | ---------------------------------------- |
| 单元测试   | Vitest (jsdom)                     | `pnpm test`                              |
| 交互测试   | Storybook test-runner (Playwright) | `pnpm test:storybook`                    |
| 可视化交互 | headed 模式（Chromium 可见）       | `SLOWMO=5000 pnpm test:storybook:headed` |

### 拖拽测试覆盖

| 视图      | 拖拽移动            | 拖拽调整          | 跨天/跨资源         | 键盘交互              |
| --------- | ------------------- | ----------------- | ------------------- | --------------------- |
| Scheduler | ✅ DragVertical     | ✅ DragResize     | ✅ OverlapPolicy    | ✅ KeyboardNavigation |
| Day       | ✅ DayDragVertical  | ✅ DayDragResize  | —                   | ✅ Enter/Space        |
| Week      | ✅ WeekDragVertical | ✅ WeekDragResize | ✅ WeekDragCrossDay | ✅ Enter/Space        |
| Timeline  | —                   | —                 | —                   | ✅ Enter/Space        |
| Month     | ✅ MonthDragMove    | ✅ MonthDragResize | ✅ 跨周平移 / MonthDragCreate | ✅ Enter/Space        |

测试文件位于 `src/slices/dnd.slice.spec.ts`（DnD 状态机）和 `src/stories/Calendar/`（各个视图的故事文件，含 Timeline）。

## 不变式（Invariants）

以下约束由 lint + 测试机械化守护：

1. **CSS 前缀**：所有生成的 CSS 类名必须以 `swell-calendar-` 开头
2. **无全局副作用**：组件挂载/卸载不修改 `window`、`document.body`
3. **分层依赖**：`types → constants → utils → time → model → ... → components`，不可逆向
4. **HTML 净化**：所有用户提供的 HTML 内容必须经过 `sanitizer.ts` 的 DOMPurify 净化
5. **事件不可变**：原始 `EventObject` 不直接修改，统一通过 `EventModel` 封装操作

## 待开发功能（Backlog）

- [x] Timeline 拖拽交互（移动 / resize / 拖拽创建 / 日期 tooltip）— 见下方「Timeline 交互」
- [ ] Timeline 交互后续增量：overlap/invalid 校验、external/cross-instance DnD、shared events 跨资源行语义
- [ ] agenda 视图
- [ ] 月视图 workweek 支持
- [ ] 顶边 resize（Scheduler 事件顶边调整开始时间）
- [ ] 资源层级渲染（利用 `parentId` 字段）
- [ ] 虚拟化（超长事件列表性能优化）

## 当前阶段说明

- `timeline` 已升级为日粒度 Calendar Timeline（按天列 + 资源行 + 跨天横条 + 车道堆叠），对标 Mobiscroll Calendar timeline
- `timeline` 交互（务实子集）：
  - 拖拽横条移动（按天平移，纵向跨资源行改 `resourceId`）→ `onEventUpdate`
  - 左右边 resize 改起止天 → `onEventUpdate`
  - 资源行空白处横拖创建跨天**全天**事件 → `onEventCreate`
  - 拖拽过程显示幽灵横条 + 日期范围 tooltip
  - 校验：per-event `editable/draggable/resizable` + timeline 级 `dragToCreate/dragToMove/dragToResize` + `onValidateEventChange` + `onEventCreateFailed/onEventUpdateFailed`；**不含** overlap/invalid 区间（后续增量）
- `scheduler` 使用垂直 time-grid + 资源列布局
- `scheduler` 当前为近期核心
- 宿主受控是默认数据所有权模型，最终事件数据始终以 `props.events` 为准
- `scheduler` 当前已向宿主暴露资源化的区间选择创建意图和拖拽移动更新意图
- `scheduler` 当前已支持 time-grid 内单列事件 resize 后的更新意图回调
- `scheduler` 当前已有独立 layout pipeline，支持 all-day lane、多日 time 事件分段、`colors` 背景区段和同槽位 `order`
- `create/move/resize` 当前支持通过 `onValidateEventChange` 做同步准入校验
- `create/move/resize` 当前也会先检查 `invalid` / `blockedTimes`，命中后直接拒绝提交
- `invalid` / `blockedTimes` 当前会在 time-grid 中渲染为只读遮罩，提示不可操作区域
- 内部尚未内建事件编辑弹窗、宿主侧冲突解决 UI、external/cross-instance 预览层与 timezone 完整多时区体验
