# Migration Guide

> 参考样例：Mobiscroll React Scheduler Desktop Week View
> https://demo.mobiscroll.com/react/scheduler/desktop-week-view

本文档记录 `scheduler` 路线图推进过程中，对宿主应用可见的命名收敛和兼容期策略。

## 当前迁移项

### 1. `blockedTimes -> invalid`

#### 目标

将 `blockedTimes` 收敛为 `invalid`，统一表示不可交互时间段。

#### 兼容窗口

- Phase 1A.1：`invalid` 为主名，运行时兼容 `blockedTimes`
- Phase 1B：`blockedTimes` 在类型和文档中标记 deprecated
- Phase 2：移除 `blockedTimes`

#### 最小替换

旧写法：

```ts
options: {
  scheduler: {
    blockedTimes: [
      { start, end },
    ],
  },
}
```

新写法：

```ts
options: {
  scheduler: {
    invalid: [
      { start, end },
    ],
  },
}
```

#### 兼容期写法

如果宿主需要跨版本兼容，可以先统一改为：

```ts
const schedulerOptions = {
  invalid: blockedTimes,
};
```

#### search-replace 提示

- 搜索：`blockedTimes`
- 替换：`invalid`

### 2. `isAllday -> allDay`

#### 目标

将旧字段 `isAllday` 收敛为 `allDay`，统一全天事件命名。

#### 兼容窗口

- Phase 1A.1：`allDay` 为主名，运行时兼容 `isAllday`
- Phase 1B：`isAllday` 在类型和文档中标记 deprecated
- Phase 2：移除 `isAllday`

#### 最小替换

旧写法：

```ts
{
  title: 'All day event',
  isAllday: true,
}
```

新写法：

```ts
{
  title: 'All day event',
  allDay: true,
}
```

#### 兼容期写法

```ts
{
  title: 'All day event',
  allDay: true,
}
```

兼容期内运行时仍会读取 `allDay ?? isAllday`，但宿主代码应尽快统一到 `allDay`。

#### search-replace 提示

- 搜索：`isAllday`
- 替换：`allDay`

## 计划中的后续迁移

以下迁移已经进入 scheduler 资源能力实现阶段，但仍建议按阶段推进宿主改造，不要把“字段已存在”误当成“老写法已彻底废弃”：

- `parentId + children` 共存：`children` 已可直接驱动树形资源，`parentId` 仍保留兼容与扁平输入建树能力
- `hidden + visibleResourceIds` 共存：`visibleResourceIds` 用于显式控制可见资源，`hidden` 仍保留兼容入口

建议：

- 新增资源分组时优先直接传树形 `children`
- 宿主存在“按业务动态切换资源显隐”场景时优先使用 `visibleResourceIds`
- 老数据若仍以扁平 `parentId` 或 `hidden` 驱动，可保留兼容写法，待业务侧统一后再收敛

## 新增可选能力（非破坏，无需迁移）

以下为近期新增的纯增量字段，不影响既有写法，宿主可按需启用：

- `ViewType: 'agenda'` 与 `options.agenda`
  - 新增只读列表视图，按天分组展示事件，点击事件行触发既有 `onEventClick`
  - 默认 `agenda.range = 14`、`agenda.showEmptyDays = true`
  - 不配置时既有默认视图、事件数据流和回调语义不变
  - 如果宿主代码对 `ViewType` 做了 TypeScript 穷举（例如 `Record<ViewType, ...>` 或 `switch(view)` 的 exhaustive check），需要补上 `'agenda'` 分支

  ```ts
  const options = {
    defaultView: 'agenda',
    views: {
      agenda: true,
    },
    agenda: {
      range: 14,
      showEmptyDays: true,
    },
  };
  ```

- `month.maxEventStack?: number`
  - 用于统一 month 每格直接显示的事件堆叠上限语义
  - 兼容期内运行时优先读取 `maxEventStack`，未提供时回退到旧字段 `visibleEventCount`
  - 旧字段 `visibleEventCount` 仍可继续工作，但新的宿主示例与文档将统一使用 `maxEventStack`

  ```ts
  const monthOptions = {
    maxEventStack: 3,
  };
  ```

- `scheduler.timezones?: { timezone: string; displayLabel?: string }[]`
  - 在主时间轴左侧叠加副时区刻度轴，按配置顺序向左排列
  - 刻度由主显示时区（`displayTimezone`，缺省为浏览器本地时区）换算到各副时区
  - 不配置时行为与之前完全一致（单轴）

  ```ts
  const schedulerOptions = {
    displayTimezone: 'America/New_York',
    timezones: [
      { timezone: 'Asia/Tokyo', displayLabel: 'TYO' },
      { timezone: 'Europe/London', displayLabel: 'LON' },
    ],
  };
  ```

## 原则

- 不通过运行时 `console.warn` 提醒宿主
- 兼容信息以类型 deprecated 标记和本文档为准
- 所有迁移同时适用于 `scheduler` 和 `timeline`
