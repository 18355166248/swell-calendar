# 2026-05-07 scheduler mobiscroll parity roadmap

## 背景

当前 `swell-calendar` 已经完成了 `scheduler/timeline` 的基础拆分，并具备：

- 资源列基础展示
- 区间选择与创建意图回调
- 事件移动与 resize 意图回调
- 基础 `blockedTimes` 校验与遮罩

但整体能力仍停留在“底座可用”，还不能支撑对齐商用 scheduler 的桌面端核心体验。

本任务的主参考样例为：

参考样例：Mobiscroll React Scheduler Desktop Week View
https://demo.mobiscroll.com/react/scheduler/desktop-week-view

本任务对齐的是桌面端 `scheduler` 的产品行为、布局和交互闭环，不追求 Mobiscroll 的 API 兼容，也不复刻其内建弹窗 UI。

## 目标

- 建立桌面端 `scheduler` 的可执行路线图
- 明确 phase 边界、API 收敛、架构落点和迁移策略
- 为后续逐步开发提供可验证、可回退的文档基线

## 非目标

- 不在本任务中实现完整功能
- 不将 `agenda`、移动端适配纳入近期范围
- 不引入内建业务弹窗、远端同步或数据获取逻辑
- 不将 `connections`、`eventList`、虚拟化、打印和 a11y 纳入近期实现

## 影响范围

- 文档：
  - `docs/agent-plan/plan.md`
  - `docs/agent-plan/implementation-steps.md`
  - `packages/calendar/SPEC.md`
  - `docs/ARCHITECTURE.md`
  - `docs/MIGRATION.md`
  - `docs/adrs/ADR-2026-05-scheduler-parity-scope.md`
- 后续代码：
  - `types/`
  - `controller/`
  - `hooks/`
  - `components/scheduler/`

## 路线图引用

本任务不复制完整 phase 内容，统一以以下文档为单一事实来源：

- 总路线图：[../../agent-plan/plan.md](../../agent-plan/plan.md)
- 实施步骤索引：[../../agent-plan/implementation-steps.md](../../agent-plan/implementation-steps.md)

## Phase 拆分

### Phase 0：Docs & API Freeze

- 补齐任务文档、ADR、MIGRATION、README 入口
- 在 `SPEC`、`ARCHITECTURE` 中固定主参考样例、phase 边界和核心设计原则

退出条件：

- 只看 docs 即可回答主参考是谁、当前范围是什么、谁拥有事件数据、哪些能力后置

### Phase 1A：命名与布局基线

- `blockedTimes -> invalid`
- `isAllday -> allDay`
- scheduler 独立 layout pipeline
- all-day lane
- 多日分段
- `colors`
- tooltip

退出条件：

- scheduler 具备独立布局链路，且与 week/day/timeline 不退化

### Phase 1B：交互闭环

- template slots
- `onCellClick`
- `onEventHover`
- 全局与 per-event gate
- failed callbacks
- overlap / buffer / delete

退出条件：

- 宿主只用受控 `events` + callbacks 即可接管交互结果

### Phase 2：资源调度

- `visibleResourceIds`
- `children` / `parentId`
- group / collapse
- shared events
- 资源级交互限制
- 跨资源拖动

退出条件：

- 资源显隐、分组、共享事件和资源级策略已闭环

### Phase 3：高级调度

- recurrence
- recurring exceptions
- timezone
- external DnD
- 跨实例拖动

退出条件：

- 高级调度能力不破坏宿主受控数据流

## 验收标准

每个 phase 的验收必须同时覆盖：

- 单元测试
- Storybook 场景
- 共享视图回归：`Day` / `Week` / `Timeline`
- 文档同步更新

## 风险与回滚

- 风险：共享逻辑修改容易拖累 `Week` 和 `Timeline`
- 风险：命名迁移若分散到多个入口，会导致兼容期行为不一致
- 风险：scheduler 若继续绑定 `getWeekViewEvents(...).time`，后续 all-day 和多日分段会持续受限

回滚原则：

- 每步尽量单独提交
- 先 controller / types，后 hooks / components
- 任何一步若影响共享视图，可先回退该步，不影响整体路线图文档

## 当前状态

- [x] 路线图建立
- [-] 代码与文档进入收敛期
- [x] Phase 1A 基线能力已进入实现
- [x] Phase 1B 交互闭环已进入实现
- [x] Phase 2 资源调度基线已进入实现
- [x] Phase 3 完成（Step 30-35 全部落地）

说明：

- 当前代码已具备 all-day lane、多日分段、overlap policy、failed callbacks、资源显隐/分组/共享事件、recurrence 展开、timezone 转换、external DnD、跨实例拖动等能力
- 当前主要风险不再是“底座没有做出来”，而是“规格、phase 状态与实现状态需要持续对齐”
- 编辑作用域（本次/本次及以后/全部）已完成接入，后续重点转为 Phase 3 高级体验收口
