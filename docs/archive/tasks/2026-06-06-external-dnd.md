# 2026-06-06 Phase 3 Step 34 — external DnD 接入

## 背景

Phase 3 Step 30–33 已完成 recurrence 类型、视口展开、exceptions 跳过/替换和 timezone 转换。当前 scheduler 的内部 DnD（拖拽创建/移动/resize）已完全闭环，但尚不支持从日历组件外部拖入项目。

外部拖拽（external DnD）是 scheduler 的高级能力之一，宿主可能需要：
- 从侧边栏任务列表拖入一个任务到 scheduler 时间网格
- 从其他应用面板拖入外部数据
- 用自定义 DnD 库（dnd-kit、react-beautiful-dnd 等）驱动拖入

本步提供基于 HTML5 Drag and Drop API 的 intent 层，不做第三方库封装。

## 目标

- 新增 `SchedulerOptions.allowExternalDrop` 全局开关
- 新增 `CalendarExternalDropInfo` 类型与 `onExternalDrop` 回调
- 新建 `hooks/TimeGrid/useExternalDrop.ts`：在 time-grid 列容器上接入 HTML5 `dragover` / `drop` 事件
- drop 时计算目标位置（日期、时间、resourceId），通过回调输出完整 intent
- `invalid` 区间检查：drop 命中 `invalid` 时拒绝并触发 `onExternalDropFailed`
- `allowExternalDrop` 资源级 gate：资源可单独禁止外部拖入
- 新增 `Scheduler/ExternalDnDMock` Storybook 直观验证

## 非目标

- 不封装第三方 DnD 库
- 不进入跨实例拖动（Step 35）
- 不做拖拽过程中的实时预览阴影（复杂度高，后置）
- 不做 external DnD 与 `overlap` / `buffer` 的联动校验（外部 drop 时尚无事件对象，宿主自行校验）
- 不修改 `invalid` / `colors` 的现有判断逻辑

## 影响范围

- 文档：
  - `docs/tasks/2026-06-06-external-dnd.md`（本文件，新建）
  - `packages/calendar/SPEC.md`（更新 external DnD 能力描述）
  - `docs/agent-plan/05-advanced-scheduling.md`（更新 Step 34 状态）

- 代码：
  - `packages/calendar/src/types/callbacks.type.ts`（新增 `CalendarExternalDropInfo`、`CalendarExternalDropFailedInfo`、`onExternalDrop` / `onExternalDropFailed`）
  - `packages/calendar/src/types/options.type.ts`（`SchedulerOptions.allowExternalDrop` 新增）
  - `packages/calendar/src/hooks/TimeGrid/useExternalDrop.ts`（新建）
  - `packages/calendar/src/components/timeGrid/TimeGridView.tsx`（接入 `useExternalDrop`）
  - `packages/calendar/src/controller/scheduler.controller.ts`（新增 `createExternalDropInfo`）
  - `packages/calendar/src/stories/Calendar/Scheduler.stories.tsx`（新增 ExternalDnDMock story）

## 方案

### 1. 类型层新增

```ts
// callbacks.type.ts 新增

export interface CalendarExternalDropInfo {
  /** 外部拖拽携带的原始数据（来自 DataTransfer） */
  dataTransfer: DataTransfer;
  /** drop 位置对应的日期 */
  date: DayjsTZDate;
  /** drop 位置对应的开始时间 */
  start: DayjsTZDate;
  /** drop 位置对应的结束时间（start + 一个时间格） */
  end: DayjsTZDate;
  /** drop 位置对应的资源 ID */
  resourceId?: string;
  /** drop 位置对应的资源名称 */
  resourceName?: string;
}

export interface CalendarExternalDropFailedInfo {
  reason: 'invalid' | 'policy';
  policySource?: 'resource' | 'view';
  dataTransfer: DataTransfer;
  date: DayjsTZDate;
  start: DayjsTZDate;
  end: DayjsTZDate;
  resourceId?: string;
}

// CalendarCallbacks 新增
onExternalDrop?: (info: CalendarExternalDropInfo) => void;
onExternalDropFailed?: (info: CalendarExternalDropFailedInfo) => void;
```

设计说明：
- `dataTransfer` 直接暴露 HTML5 原生对象，宿主可自行读取 `text/plain`、`application/json` 等数据
- 不试图解析 `dataTransfer` 内容，保持组件库与业务数据解耦
- `start` / `end` 为一个时间格（由 hourDivision 决定，默认 30 分钟），宿主可自行调整持续时间

### 2. `SchedulerOptions` 新增

```ts
// options.type.ts SchedulerOptions 新增
allowExternalDrop?: boolean;  // 是否允许外部拖入，默认 false
```

`ResourceInfo` 新增：
```ts
allowExternalDrop?: boolean;  // 资源级外部拖入开关，缺省跟随全局
```

### 3. `useExternalDrop` hook（新建）

```ts
// hooks/TimeGrid/useExternalDrop.ts
export function useExternalDrop(params: {
  enabled: boolean;
  gridPositionFinder: GridPositionFinder;
  timeGridData: TimeGridData;
  options: NormalizedOptions;
}): {
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}
```

行为：
- `handleDragOver`：当 `enabled` 为 true 时，`e.preventDefault()` 允许 drop；否则不干预
- `handleDrop`：
  1. `e.preventDefault()` 阻止浏览器默认行为
  2. 用 `gridPositionFinder({ clientX, clientY })` 计算 grid 位置
  3. 从 `timeGridData` 取得对应的日期、时间行、资源列
  4. 检查全局 `allowExternalDrop` gate
  5. 检查资源级 `allowExternalDrop` gate
  6. 检查 `invalid` 区间是否命中
  7. 通过：触发 `callbacks.onExternalDrop`
  8. 拒绝：触发 `callbacks.onExternalDropFailed`

### 4. `controller/scheduler.controller.ts` 新增

```ts
export function createExternalDropInfo(
  timeGridData: TimeGridData,
  position: GridPosition,
  dataTransfer: DataTransfer
): CalendarExternalDropInfo
```

从 grid 位置解析出日期、时间范围、资源信息，构造完整的 drop intent。

### 5. `TimeGridView.tsx` 接入

在列容器 `div.time-columns` 上添加 `onDragOver` 和 `onDrop`：

```tsx
const { handleDragOver, handleDrop } = useExternalDrop({
  enabled: currentView === 'scheduler' && !isReadOnly && (schedulerOptions?.allowExternalDrop ?? false),
  gridPositionFinder,
  timeGridData,
  options,
});

// ...
<div
  className={cls('time-columns')}
  // ...
  onDragOver={handleDragOver}
  onDrop={handleDrop}
>
```

### 6. Storybook — `Scheduler/ExternalDnDMock`

- 左侧放一个可拖拽的外部项目列表（使用 `draggable="true"` + `onDragStart` 设置 `dataTransfer`）
- 右侧为 scheduler
- drop 时在日志面板显示 drop 位置信息
- drop 成功后，宿主侧创建新事件并更新 `events` state
- 演示 `invalid` 区间拒绝外部 drop

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] `pnpm --filter swell-calendar exec tsc --noEmit`
- [ ] `pnpm --filter swell-calendar test`
- [ ] `pnpm lint`
- [ ] Storybook 手动对照：外部拖入到合法位置触发 `onExternalDrop`；拖入 `invalid` 区域触发 `onExternalDropFailed`

## 风险与回滚

- 风险：HTML5 DnD API 在不同浏览器中行为差异（主要是 Firefox 对 `dataTransfer.types` 的处理）
  - 缓解：`handleDragOver` 只做 `preventDefault()`，不依赖 `dataTransfer.types` 判断
- 风险：`gridPositionFinder` 在 `dragover` 高频事件中被频繁调用
  - 缓解：`gridPositionFinder` 本身是纯计算函数，不涉及 DOM 查询（container ref 已缓存），性能可控
- 回滚方式：`useExternalDrop.ts` 可独立删除，`TimeGridView.tsx` 去除两个事件处理器即可回退

## 实施记录

2026-06-06 已完成。

实施内容：

- `types/callbacks.type.ts` — 新增 `CalendarExternalDropInfo`、`CalendarExternalDropFailedInfo`、`CalendarExternalDropFailReason`、`CalendarExternalDropPolicySource` 类型；`CalendarCallbacks` 新增 `onExternalDrop` / `onExternalDropFailed`
- `types/options.type.ts` — `SchedulerOptions.allowExternalDrop?: boolean` 新增；`ResourceInfo.allowExternalDrop?: boolean` 新增
- `controller/scheduler.controller.ts` — 新增 `createExternalDropInfo()`、`isBlockedExternalDrop()`、`isExternalDropAllowedForResource()` 三个纯函数
- `hooks/TimeGrid/useExternalDrop.ts` — 新建，`useExternalDrop()` hook 处理 HTML5 `dragover` / `drop` 事件
- `components/timeGrid/TimeGridView.tsx` — 在列容器上接入 `onDragOver` / `onDrop`
- `stories/Calendar/Scheduler.stories.tsx` — 新增 `ExternalDnDMock` story（左侧可拖拽面板 + scheduler + 日志 + invalid 区域演示）

验证结果：

- [x] `node scripts/check-docs.mjs` ✅
- [x] `node scripts/check-arch.mjs` ✅（155 个文件，无分层违规）
- [x] `pnpm --filter swell-calendar exec tsc --noEmit` ✅
- [x] `pnpm --filter swell-calendar test` ✅（200 个测试全部通过）
- [x] `pnpm lint` ✅
