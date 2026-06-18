# 2026-06-18 External DnD 编程式 Drop 适配

## 背景

Phase 3 Step 34 已完成基于 HTML5 Drag and Drop API 的外部拖入能力（`allowExternalDrop` + `onExternalDrop` / `onExternalDropFailed`），但当前 `useExternalDrop` hook 完全绑定 HTML5 `dragover` / `drop` 事件。宿主如果使用第三方 DnD 库（dnd-kit、react-beautiful-dnd 等），这些原生事件不会触发，外部拖入能力无法消费。

需要提供一层**编程式 drop API**，让宿主通过 imperative handle 传入坐标和自定义数据，由库内部完成位置计算、校验和 intent 产出，与 HTML5 路径共享同一套 controller 层逻辑。

## 目标

- 新增 `CalendarInstance.externalDrop()` imperative 方法，宿主可从任意 DnD 库的回调中调用
- 将 `useExternalDrop` 内部的校验逻辑提取为 controller 纯函数 `resolveExternalDrop`，两条路径共享
- 泛化 `CalendarExternalDropInfo` / `CalendarExternalDropFailedInfo`，新增 `data?: unknown` 字段，`dataTransfer` 改为可选
- SPEC 中 external DnD 状态从 🟡 升级为 ✅

## 非目标

- 不安装任何第三方 DnD 库作为 peerDependency
- 不为特定 DnD 库编写适配器插件
- 不修改现有 HTML5 路径行为
- 不扩展到 month / week / day 视图（仅 scheduler）
- 不做拖拽过程中的实时跟随预览（第三方库由宿主侧自行管理拖拽视觉效果）

## 影响范围

- 代码：
  - `packages/calendar/src/types/callbacks.type.ts`（`dataTransfer` 可选化 + 新增 `data`）
  - `packages/calendar/src/types/api.type.ts`（`CalendarInstance` 新增 `externalDrop` + 新类型导出）
  - `packages/calendar/src/controller/scheduler.controller.ts`（新增 `resolveExternalDrop`）
  - `packages/calendar/src/hooks/TimeGrid/useExternalDrop.ts`（内部复用 `resolveExternalDrop`）
  - `packages/calendar/src/components/Calendar.tsx`（`useImperativeHandle` 接入 `externalDrop`）
  - `packages/calendar/src/index.ts`（导出新类型）
- 文档：
  - `packages/calendar/SPEC.md`（external DnD 状态升级）
  - `docs/tasks/2026-06-18-external-dnd-adapter.md`（本文件）
- 运行时行为：HTML5 路径无变化；新增 imperative API 路径

## 现状

- `useExternalDrop` hook 监听 HTML5 `dragover` / `dragleave` / `drop` 事件
- 校验函数 `isBlockedExternalDrop` / `isExternalDropAllowedForResource` / `createExternalDropInfo` 已在 `controller/scheduler.controller.ts`
- `CalendarInstance` 已有 imperative API（`getDate`/`setDate`/`setEvents` 等）
- `CalendarExternalDropInfo.dataTransfer` 类型为 `DataTransfer`（必填），仅适用 HTML5 路径
- SPEC 标记 external DnD 为 🟡：`第三方库封装仍未接入`

## 方案

### 1. 泛化 drop payload

`CalendarExternalDropInfo` 和 `CalendarExternalDropFailedInfo` 的 `dataTransfer` 改为可选，新增 `data?: unknown`：

- HTML5 路径：继续传递 `dataTransfer`，`data` 为 `undefined`
- 编程式路径：不传递 `dataTransfer`，通过 `data` 携带宿主自定义数据
- 两条路径互斥，宿主可根据哪个字段存在判断来源

### 2. controller 层新增 `resolveExternalDrop`

提取纯计算函数，不触发回调，不做 DOM 操作：

```
输入: { position, gridPositionFinder, timeGridData, options, data? }
输出: { result, info?, rejection?, preview? }
```

校验链（与 useExternalDrop 一致）：
1. 位置解析 → 无效位置返回 rejected（无 rejection detail）
2. 资源级 / 全局 allowExternalDrop gate
3. invalid 区间检查
4. 通过 → 构建 `CalendarExternalDropInfo`

### 3. CalendarInstance 新增 externalDrop

宿主调用方式：

```ts
const result = calendarRef.current.externalDrop({
  clientX: 500,
  clientY: 300,
  data: { taskId: 'abc', title: '需求评审' },
});
if (result.result === 'allowed' && result.info) {
  // 根据 result.info 创建新事件
}
```

实现方式：
- Calendar.tsx 的 `useImperativeHandle` 新增 `externalDrop` 方法
- 内部从 store 获取 `gridPositionFinder`、`timeGridData`、`options`
- 调用 `resolveExternalDrop` 返回结果
- 如果 scheduler 视图未激活或 `allowExternalDrop` 未开启，返回 `{ result: 'rejected' }`

### 4. useExternalDrop 内部复用

`useExternalDrop` 的 `handleDragOver` 和 `handleDrop` 内部改为调用 `resolveExternalDrop`：
- `handleDragOver`：调用 `resolveExternalDrop` 拿 `preview`，驱动 `onPreviewChange`
- `handleDrop`：调用 `resolveExternalDrop` 拿结果，通过 `result` 决定触发 `onExternalDrop` 或 `onExternalDropFailed`

行为完全不变，只是实现从"内联逻辑"改为"调用 controller 函数"。

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`（external DnD 状态 + API 说明）
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [ ] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs`（15 个变更文件通过）
- [x] `node scripts/check-arch.mjs`（191 文件无分层违规）
- [x] `pnpm lint`（0 error / 0 warning）
- [x] `pnpm --filter swell-calendar exec tsc --noEmit`（无报错）
- [x] `pnpm --filter swell-calendar test`（36 文件 / 345 用例全通过）
- [x] 现有 `useExternalDrop.spec.tsx` 测试全部通过
- [x] 新增 `resolveExternalDrop` 单测覆盖 allowed / policy / invalid 三条路径

## 风险与回滚

- 风险：`dataTransfer` 可选化可能影响宿主已有代码（TypeScript 类型收窄）
  - 缓解：`dataTransfer` 仍保留在 HTML5 路径，只是类型从必填改为可选；宿主代码如果只使用 HTML5 路径无需改动
- 风险：`resolveExternalDrop` 依赖 `gridPositionFinder` / `timeGridData`，在 imperative 调用时可能尚未就绪
  - 缓解：scheduler 视图渲染后 store 中必然有这些值；如果尚未就绪返回 `{ result: 'rejected' }`
- 回滚方式：删除 `resolveExternalDrop`、移除 `CalendarInstance.externalDrop`、恢复 `useExternalDrop` 内联逻辑即可

## 实施结果

- 实际改动：
  - `types/callbacks.type.ts`：`CalendarExternalDropInfo` / `CalendarExternalDropFailedInfo` 的 `dataTransfer` 可选化，新增 `data?: unknown`
  - `types/api.type.ts`：新增 `ExternalDropPosition` / `ExternalDropResult`，`CalendarInstance` 新增 `externalDrop` 方法
  - `controller/scheduler.controller.ts`：新增纯函数 `resolveExternalDrop` 及内部 `buildExternalDropInfo` / `buildExternalDropRejection`
  - `hooks/TimeGrid/useExternalDrop.ts`：`handleDragOver` / `handleDrop` 改为复用 `resolveExternalDrop`，删除内联校验
  - `types/externalDrop.type.ts` + `slices/externalDrop.slice.ts`（新增）：持有由 TimeGridView 注册的 resolver；`store.type.ts` 合入 `ExternalDropSlice`，`contexts/calendarStore.ts` 接入切片
  - `components/timeGrid/TimeGridView.tsx`：`useEffect` 注册/清空 resolver（闭包捕获当前 `gridPositionFinder` / `timeGridData` / `options`）
  - `components/Calendar.tsx`：`createCalendarInstance` 新增 `externalDrop`，从 store 读取 resolver，未就绪返回 `{ result: 'rejected' }`
  - `index.ts`：导出 `ExternalDropPosition` / `ExternalDropResult` 及四个 external drop info 类型
  - `SPEC.md`：external DnD 状态 🟡 → ✅，补充命令式 API 说明
  - 新增 `controller/resolveExternalDrop.spec.ts`
- 与原计划的偏差：
  - 原方案设想 `externalDrop` 在 `useImperativeHandle` 内直接从 store 取 `gridPositionFinder` / `timeGridData` / `options`。但 `gridPositionFinder` 依赖 TimeGridView 的列容器 DOM ref，不存在于 store，故改为「TimeGridView 在 store 注册 resolver、Calendar 实例调用 resolver」的方式，由切片承载运行时函数引用。
  - story `Scheduler.shared.tsx` 因 `dataTransfer` 可选化补了一处 `?.` 空值保护（计划外但属类型收窄的必要适配）。
- 验证结果：见上方验证计划，全部通过。
- 剩余问题：
  - 已删除不再被引用的旧 HTML5 专用构造函数 `createExternalDropInfo`（由 `buildExternalDropInfo` 取代），`createCrossInstanceDropInfo` 注释引用同步更新。当前无已知剩余问题。
