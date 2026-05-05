# swell-calendar SPEC

> 约束即产品。本文件定义 swell-calendar 组件库的功能边界、API 接口和不变式。
> 所有实现决策须以此文件为准。如需变更，先修改本文件并获得 review。

## 产品定位

swell-calendar 是一个**可嵌入的 React 日历组件库**，面向需要在产品中集成日历功能的开发团队。发布为 NPM 包，与宿主应用的样式系统解耦。

## 核心约束

1. **零副作用样式**：所有 CSS 类名带 `swell-calendar-` 前缀，不污染宿主页面
2. **多实例隔离**：同一页面可挂载多个独立日历实例，Store 互不干扰
3. **纯组件库**：不包含数据获取逻辑，事件数据由宿主应用注入
4. **主题可替换**：通过 ThemeStore 配置颜色，不依赖 CSS 变量注入
5. **模板可定制**：通过 `options.template` 替换任意渲染函数

## 功能规范

### 视图

| 视图 | 状态 | 描述 |
|------|------|------|
| 日视图（Day） | ✅ 完成 | 单日时间网格，24 小时展示 |
| 周视图（Week） | ✅ 完成 | 7 天时间网格，支持 workweek 模式 |
| 月视图（Month） | 🚧 开发中 | 月历格子，事件简要展示 |

### 事件功能

| 功能 | 状态 | 描述 |
|------|------|------|
| 事件渲染 | ✅ | 时间范围显示为卡片 |
| 碰撞布局 | ✅ | 重叠事件自动并排，分配宽度 |
| 拖拽移动 | ✅ | 鼠标拖动修改事件时间，30min 吸附 |
| 拖拽调整 | ✅ | 拖动事件底部边缘调整结束时间 |
| 新建事件 | ✅ | 点击或框选时间段触发创建 |
| 只读模式 | ✅ | `isReadOnly: true` 禁用所有交互 |
| 自定义颜色 | ✅ | 按日历 ID 配置事件颜色 |

### 配置选项（`CalendarOptions`）

```ts
interface CalendarOptions {
  defaultView?: 'day' | 'week' | 'month';   // 默认: 'week'
  isReadOnly?: boolean;                       // 默认: false
  week?: {
    startDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 默认: 0 (周日)
    workweek?: boolean;                             // 默认: false
    narrowWeekend?: boolean;                        // 默认: false
  };
  month?: {
    startDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    isAlways6Rows?: boolean;
  };
  template?: Partial<Template>;  // 可覆盖任意渲染函数
}
```

### 事件数据结构（`EventObject`）

```ts
interface EventObject {
  id: string;
  calendarId: string;
  title: string;
  start: Date | string;  // ISO 8601
  end: Date | string;
  isAllDay?: boolean;
  category?: 'time' | 'allday' | 'milestone' | 'task';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  dragBackgroundColor?: string;
  isReadOnly?: boolean;
  body?: string;  // HTML 内容（DOMPurify 净化后渲染）
}
```

### 模板接口（`Template`）

7 个可定制渲染点：

| 函数名 | 渲染位置 |
|--------|---------|
| `timeGridDisplayPrimaryTime` | 时间轴上的主时间标签 |
| `timeGridDisplayTime` | 时间轴其他时间格 |
| `weekDayName` | 周视图顶部星期名称 |
| `time` | 时间事件卡片内容 |
| `timeMove` | 拖拽中的事件卡片内容 |
| `timeMoveGuide` | 拖拽时间提示 |
| `nowIndicatorLabel` | 当前时间指示器标签 |

## API 接口

### 组件 Props

```ts
interface CalendarProps {
  calendars?: CalendarInfo[];    // 日历列表（定义颜色）
  events?: EventObject[];        // 事件数据
  options?: CalendarOptions;     // 配置选项
  theme?: Partial<ThemeState>;   // 主题配置
  onBeforeCreateEvent?: (event: EventObject) => boolean | void;
  onAfterRenderEvent?: (event: EventObject) => void;
  onClickEvent?: (event: EventObject) => void;
  onSelectDateTime?: (info: SelectDateTimeInfo) => void;
}
```

## 不变式（Invariants）

以下约束由 lint + 测试机械化守护：

1. **CSS 前缀**：所有生成的 CSS 类名必须以 `swell-calendar-` 开头
2. **无全局副作用**：组件挂载/卸载不修改 `window`、`document.body`
3. **分层依赖**：`types → constants → utils → time → model → ... → components`，不可逆向
4. **HTML 净化**：所有用户提供的 HTML 内容必须经过 `sanitizer.ts` 的 DOMPurify 净化
5. **事件不可变**：原始 `EventObject` 不直接修改，统一通过 `EventModel` 封装操作

## 待开发功能（Backlog）

- [ ] 月视图事件渲染
- [ ] 全天事件栏（time grid 顶部）
- [ ] 键盘导航（无障碍访问）
- [ ] 虚拟化（超长事件列表性能优化）
- [ ] 导出 `CalendarInstance` 命令式 API（`calendar.setDate()`、`calendar.next()`）
