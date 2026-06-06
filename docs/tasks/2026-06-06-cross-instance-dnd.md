# 2026-06-06 Phase 3 Step 35 — 跨实例拖动

## 背景

Step 34 已完成 external DnD，支持从组件外部拖入 scheduler。本步实现跨实例拖动：事件可在同一页面的多个 Calendar 实例之间拖动。

核心约束：每个 Calendar 实例的 Zustand store 完全隔离，无共享状态、无共享 Context。跨实例通信只能通过模块级单例桥接。

## 目标

- 新建 `controller/cross-instance-bridge.ts`：模块级 publish/subscribe 单例
- 新增 `onCrossInstanceDragEnd` 回调（源实例：拖拽结束在日历外部时触发）
- 新增 `onCrossInstanceDrop` 回调（目标实例：接收到跨实例 drop 时触发）
- Scheduler 组件同时充当 source（检测拖出）和 target（接收跨实例 drop）
- 新增 `Scheduler/CrossInstanceDnD` Storybook 验证

## 非目标

- 不引入全局注册表或实例 ID 系统
- 不实现拖拽预览阴影跨实例同步（复杂度高，后置）
- 不处理跨实例 resize（仅 move）
- 不接入 week/day/timeline（本轮仅 scheduler）
- 不修改 `useDrag` / `useTimeGridEventMove` 内部逻辑

## 方案

### 架构

```
源实例 drag end (cursor outside)
  → useCrossInstanceDragSource hook 检测
  → crossInstanceBridge.publish(data)
  → 所有订阅者收到
  → 目标实例 useCrossInstanceDropTarget hook 检查 cursor 是否在自身容器内
  → 如果是：计算 drop 位置 → onCrossInstanceDrop 回调
```

### 1. `controller/cross-instance-bridge.ts`（新建）

模块级单例，维护订阅者列表。

```ts
interface CrossInstanceDragData {
  event: EventObject;
  cursorX: number;
  cursorY: number;
}

type Subscriber = (data: CrossInstanceDragData) => void;

// 模块级变量，所有 Calendar 实例共享
let subscribers = new Set<Subscriber>();

export const crossInstanceBridge = {
  subscribe(cb: Subscriber): () => void,
  publish(data: CrossInstanceDragData): void,
};
```

### 2. 回调类型

```ts
// 源实例触发
onCrossInstanceDragEnd?: (info: { event: EventObjectWithDefaultValues }) => void;

// 目标实例触发
onCrossInstanceDrop?: (info: {
  event: EventObject;
  date: DayjsTZDate;
  start: DayjsTZDate;
  end: DayjsTZDate;
  resourceId?: string;
  resourceName?: string;
}) => void;
```

### 3. 源侧：Scheduler 组件内 hook

在 Scheduler 内使用 `useTransientUpdatesCalendar` 监听 DnD 状态变化：
- 当检测到 `DRAGGING → IDLE` 转变且最后已知 cursor 在容器外部时
- 触发 `onCrossInstanceDragEnd` 回调
- 通过 bridge 发布事件数据

### 4. 目标侧：Scheduler 组件内 hook

在 Scheduler 内订阅 bridge：
- 收到跨实例数据后，用 `document.elementsFromPoint(x, y)` 检查 cursor 是否在本容器内
- 如果是，用 `gridPositionFinder` 计算 drop 位置
- 触发 `onCrossInstanceDrop` 回调

### 5. Storybook — `Scheduler/CrossInstanceDnD`

两个并排 Scheduler，共享事件池。从一个拖出事件到另一个，宿主通过回调管理事件的删除和添加。

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] `pnpm --filter swell-calendar exec tsc --noEmit`
- [ ] `pnpm --filter swell-calendar test`
- [ ] `pnpm lint`
- [ ] Storybook 手动对照：从 Scheduler A 拖出事件到 Scheduler B，B 收到 onCrossInstanceDrop

## 风险与回滚

- 风险：`useTransientUpdatesCalendar` 监听全 store 变化，可能在高频拖拽中产生大量回调
  - 缓解：仅在 DRAGGING → IDLE 转变时触发动作，中间状态只更新 ref
- 风险：bridge 单例在 SSR 环境下可能跨请求共享
  - 缓解：当前项目面向浏览器端，SSR 不在范围内
- 回滚方式：bridge 模块可独立删除，Scheduler 改动仅去除 hook 调用即可回退

## 实施记录

2026-06-06 已完成。

实施内容：

- `controller/cross-instance-bridge.ts` — 新建，模块级 publish/subscribe 单例桥接器
- `hooks/TimeGrid/useCrossInstanceDnD.ts` — 新建，源侧（检测 DRAGGING→IDLE + cursor 在容器外 → 发布）+ 目标侧（订阅 bridge + 计算 drop 位置）
- `types/callbacks.type.ts` — 新增 `CalendarCrossInstanceDragEndInfo`、`CalendarCrossInstanceDropInfo` 类型；`CalendarCallbacks` 新增 `onCrossInstanceDragEnd` / `onCrossInstanceDrop`
- `components/timeGrid/TimeGridView.tsx` — 新增 `timeGridContainer` ref，接入 `useCrossInstanceDnD`
- `stories/Calendar/Scheduler.stories.tsx` — 新增 `CrossInstanceDnD` story（双 Scheduler 并排，拖出/拖入演示）

验证结果：

- [x] `node scripts/check-docs.mjs` ✅
- [x] `node scripts/check-arch.mjs` ✅
- [x] `pnpm --filter swell-calendar exec tsc --noEmit` ✅
- [x] `pnpm --filter swell-calendar test` ✅（200 个测试全部通过）
- [x] `pnpm lint` ✅
