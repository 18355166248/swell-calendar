# 2026-06-26 recurrence 日视图点击修复

## 背景

日视图中用户创建的重复事件实例（例如标题为 `111` 的卡片）可见但点击后无法稳定打开详情/编辑入口。普通事件不受影响。

## 目标

- 修复 day/week time-grid 中 recurrence 展开实例的轻点点击链路。
- 保持已有 recurrence 展开、拖拽、resize 与编辑作用域 API 不变。

## 非目标

- 不调整公开 API。
- 不改变 recurrence 规则计算与 exceptions 语义。
- 不重构 time-grid 拖拽状态机。

## 方案

recurrence 实例每次 render 都会重新 `new EventModel(inst)`，默认内部 `cid` 会变化；而 `TimeEvent` 的 React key 与拖拽 item type 都依赖 `cid`。轻点卡片时 pointerdown 会初始化拖拽状态并触发重渲染，重复实例因 key 变化被卸载，导致 pointerup 监听丢失，最终不会触发 `onEventClick`。

修复方式：

- recurrence 展开实例按稳定实例 id 生成内部 `__cid`。
- `EventModel` 初始化时尊重内部 `__cid`，让展开实例跨 render 保持相同 `cid`。

## 验证

- `node scripts/check-docs.mjs`：通过
- `node scripts/check-arch.mjs`：通过
- `./node_modules/.bin/tsc --noEmit -p packages/calendar/tsconfig.json`：通过
- `packages/calendar/node_modules/.bin/vitest run src/controller/scheduler-recurrence.spec.ts`：通过（16 tests；沙箱内 Vite WebSocket 监听 `0.0.0.0:24678` 报 EPERM，但测试进程最终通过）
- in-app browser：刷新 `/app/calendar/day` 后，点击标题为 `111` 的 recurrence 日视图卡片可打开详情弹层；点击「编辑」后进入编辑表单并回填标题 `111`

## 风险

- 稳定 `__cid` 是内部字段，不作为公开宿主 API 使用。
- hash 碰撞概率很低；若未来需要完全消除，可把 recurrence 实例缓存上移到 controller 层。
