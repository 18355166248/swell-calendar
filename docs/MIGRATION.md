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

以下迁移尚未进入当前实现阶段，只在路线图中定义，不建议提前修改业务代码：

- `parentId -> children`
- `hidden -> visibleResourceIds`

## 原则

- 不通过运行时 `console.warn` 提醒宿主
- 兼容信息以类型 deprecated 标记和本文档为准
- 所有迁移同时适用于 `scheduler` 和 `timeline`
