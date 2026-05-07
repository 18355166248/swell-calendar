# ADR-2026-05 Scheduler Parity Scope

## 标题

采用“行为对齐 + 宿主受控”的方式推进桌面端 scheduler 路线图。

## 状态

- Accepted

## 背景

当前 `swell-calendar` 已经具备 `day/week/timeline/scheduler` 的基础能力，但 `scheduler` 仍停留在基础 time-grid + 资源列阶段，无法承接商用 scheduler 常见的桌面端能力。

本次路线图采用以下主参考样例：

参考样例：Mobiscroll React Scheduler Desktop Week View
https://demo.mobiscroll.com/react/scheduler/desktop-week-view

该参考适合指导产品行为、布局和交互闭环，但不适合作为本库的 API 兼容规范。

## 决策

### 1. 采用行为对齐，而非 API 兼容

- 对齐目标是用户可见的布局、交互路径和能力矩阵
- 不要求与 Mobiscroll 保持同名字段或完全一致的宿主接口
- 本库保留自身 React 组件库的 API 风格和分层结构

### 2. `scheduler` 与 `timeline` 维持独立视图

- 允许共享 `time/`、`model/`、`controller/` 的底层算法
- 不允许在 `components/` 层互相耦合
- `timeline` 本轮只保证不退化，不承担 parity 目标

### 3. 数据所有权采用宿主受控

- 组件内部只产生交互意图和同步校验结果
- 最终事件数据始终以宿主传入的 `props.events` 为真值
- 不引入独立乐观状态机
- failed callbacks 只表示本库同步规则校验失败，不表示宿主网络失败

### 4. 命名收敛按兼容窗口推进

- `blockedTimes -> invalid`
- `isAllday -> allDay`
- 后续才考虑 `parentId -> children`、`hidden -> visibleResourceIds`

原则：

- 不引入 runtime `console.warn`
- 兼容期提醒通过类型 deprecated 标记和 `docs/MIGRATION.md`

## 备选方案

- 方案 A：直接复刻 Mobiscroll API
  - 优点：对照文档简单
  - 缺点：不符合当前仓库结构，迁移成本高
- 方案 B：组件内部维护乐观数据源
  - 优点：宿主接入更轻
  - 缺点：状态复杂度明显上升，失败回滚和共享视图同步成本高

## 影响

- 对开发流程的影响：
  - 先文档、后实现
  - 每个 phase 都需要 Storybook 和回归验证
- 对 API 的影响：
  - 引入 `invalid`、`allDay`
  - 后续逐步增加 scheduler 特有配置和失败回调
- 对架构的影响：
  - scheduler 需要独立 layout pipeline
  - overlap / invalid / recurrence 等策略继续下沉到 `controller/`

## 后续动作

- 同步更新 `packages/calendar/SPEC.md`
- 同步更新 `docs/ARCHITECTURE.md`
- 新增 `docs/tasks/2026-05-07-scheduler-mobiscroll-parity-roadmap.md`
- 新增并维护 `docs/MIGRATION.md`
