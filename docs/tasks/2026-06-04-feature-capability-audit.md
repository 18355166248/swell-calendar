# 2026-06-04 feature capability audit

## 背景

当前仓库已经完成一轮文档收口，`scheduler` 的公开能力边界、phase 状态和智能体入口已经基本统一。

下一步需要重新回答两个问题：

- 当前功能能力实际做到哪了
- 是继续扩功能，还是先暂停做优化和收敛

本审计以 `Mobiscroll React Scheduler Desktop Week View` 对齐目标为主线，重点盘点：

- `scheduler`
- `timeline`
- `month`
- callbacks / 交互闭环
- policy / 校验链
- advanced scheduling

## 目标

- 给出一份可执行的功能审计清单
- 区分“已完成”“可用但有风险”“未开始”
- 标出继续开发前最该先补的缺口
- 为是否进入 Phase 3 提供判断依据

## 非目标

- 不在本任务中修改功能实现
- 不重写 `SPEC` 或路线图
- 不对外宣称新增能力

## 影响范围

- 文档：
  - `docs/tasks/2026-06-04-feature-capability-audit.md`
- 审计证据来源：
  - `packages/calendar/SPEC.md`
  - `docs/agent-plan/plan.md`
  - `packages/calendar/src/components/view/*`
  - `packages/calendar/src/controller/*`
  - `packages/calendar/src/stories/Calendar/*`

## 审计结论摘要

总体判断：

- `scheduler` 已进入“核心基线可用，适合继续做收敛，不适合直接冲高级能力”的阶段
- `timeline` 处于“事件可用、基础能力稳定，但不是近期 parity 主线”的阶段
- `month` 不是“没做”，而是“实现已有，但状态定义和边界描述不够稳定”的阶段
- `recurrence / timezone / external DnD / 跨实例拖拽` 仍应视为明确未开始

建议：

1. 先暂停进入 Phase 3
2. 先补 `scheduler` 的策略闭环缺口
3. 再重新定义 `month` 的真实支持边界

## 功能审计清单

### 1. Scheduler 基线

状态：`已完成，可继续收敛`

已确认能力：

- [x] 独立 scheduler 视图入口
- [x] 多资源列 + 顶部资源头
- [x] all-day lane
- [x] 多日 time 事件分段
- [x] create / move / resize / delete
- [x] overlap / buffer
- [x] `invalid` / `colors`
- [x] 模板插槽
- [x] failed callbacks
- [x] `visibleResourceIds`
- [x] 资源分组 / 折叠
- [x] shared events
- [x] 资源级交互限制
- [x] 跨资源拖动 gate

证据：

- `packages/calendar/src/components/view/Scheduler.tsx`
- `packages/calendar/src/controller/scheduler-layout.ts`
- `packages/calendar/src/controller/scheduler-validation.ts`
- `packages/calendar/src/stories/Calendar/Scheduler.stories.tsx`
- `packages/calendar/src/controller/scheduler-*.spec.ts`

结论：

- `scheduler` 已经不是 demo 底座，而是能支撑桌面端基础闭环的主线能力
- 后续重点应从“继续铺能力点”转向“公开承诺与策略实现的最后一层对齐”

### 2. Timeline

状态：`基础可用，保持不退化`

已确认能力：

- [x] 资源列表 + 横向时间轴
- [x] 时间事件渲染
- [x] `colors`
- [x] `invalid` / `blockedTimes`
- [x] `visibleResourceIds`

证据：

- `packages/calendar/src/components/view/Timeline.tsx`
- `packages/calendar/src/stories/Calendar/Timeline.stories.tsx`
- `packages/calendar/src/controller/scheduler.controller.spec.ts`

风险：

- [ ] timeline 当前更像“稳定副线”，不是 parity 主攻方向
- [ ] story 覆盖偏静态，交互验证明显少于 scheduler
- [ ] 共享 controller 继续演进时，timeline 需要作为固定回归锚点，而不是顺带验证

结论：

- 现在不需要给 timeline 继续加新目标
- 但所有 scheduler 共享算法改动，都应该把 timeline 当必回归视图

### 3. Month

状态：`可用，但边界不稳定`

已确认能力：

- [x] 月历矩阵
- [x] 月视图事件布局
- [x] `workweek` 相关实现已经进入代码路径

证据：

- `packages/calendar/src/components/view/Month.tsx`
- `packages/calendar/src/helpers/grid.ts`
- `packages/calendar/src/stories/Calendar/Month.stories.tsx`

风险：

- [ ] `SPEC` 仍写“workweek 待完善”，但实现已经按 `workweek` 过滤表头与日期矩阵，文档与实现状态不一致
- [ ] `getMonthDayNames()` 先偏移 `startDayOfWeek`，但标签仍取 `dayNames[index]`，存在表头文案错位风险
- [ ] month 目前缺少和 scheduler 同等级的能力盘点与测试密度

结论：

- `month` 不应继续处于“半开发、半承诺”状态
- 下一步要么明确它只是“事件可用”，要么补一轮最小闭环并更新 `SPEC`

### 4. Callbacks / 交互闭环

状态：`大体完成`

已确认能力：

- [x] `onEventClick`
- [x] `onCellClick`
- [x] `onEventHover`
- [x] `onPageChange`
- [x] `onEventCreateFailed`
- [x] `onEventUpdateFailed`
- [x] `onEventDelete`

证据：

- `packages/calendar/src/types/callbacks.type.ts`
- `packages/calendar/src/components/timeGrid/TimeGridView.tsx`
- `packages/calendar/src/components/events/TimeEvent.tsx`
- `packages/calendar/src/components/timeline/TimelineEvent.tsx`
- `packages/calendar/src/stories/Calendar/Scheduler.stories.tsx`

风险：

- [ ] callback 类型和触发点已经比较完整，但不同视图的交互语义仍以 scheduler 最完整
- [ ] timeline / month 的 callback 行为回归覆盖明显少于 scheduler

结论：

- callback 主链已经够用
- 当前优先级不在“再加 callback”，而在“确保公开 callback 在各视图上的语义一致”

### 5. Policy / 校验链

状态：`已完成主链，但仍有闭环缺口`

已确认能力：

- [x] view-level gate：`dragToCreate / dragToMove / dragToResize / dragInTime`
- [x] per-event gate：`editable / draggable / resizable / overlap`
- [x] resource-level gate：`eventDragInTime / eventResize / eventOverlap`
- [x] cross-resource gate：`dragBetweenResources`
- [x] invalid / overlap / policy 失败回调

证据：

- `packages/calendar/src/controller/scheduler-validation.ts`
- `packages/calendar/src/controller/scheduler-validation.spec.ts`
- `packages/calendar/src/controller/scheduler-overlap.spec.ts`
- `packages/calendar/src/controller/scheduler-buffer.spec.ts`

风险：

- [ ] shared event 的资源级策略当前主要按第一个 `resourceId` / `resourceIds[0]` 判定，和“一个事件属于多个资源列”的语义还有缝
- [ ] shared events 已在 story 和 `SPEC` 中作为公开能力出现，但资源策略是否按所有资源一致生效，当前实现证据不足

结论：

- 这是当前最值得优先收敛的功能点
- 在这层补齐之前，不建议继续往 recurrence / timezone 推进

### 6. Advanced Scheduling

状态：`未开始`

未完成能力：

- [ ] recurrence 展开
- [ ] recurring exceptions
- [ ] timezone 驱动渲染 / 编辑语义
- [ ] external DnD
- [ ] 跨实例拖拽

证据：

- `packages/calendar/SPEC.md`
- `docs/agent-plan/plan.md`
- `packages/calendar/src/types/events.type.ts`
- `packages/calendar/src/model/eventModel.ts`

说明：

- 当前这些能力仍属于“字段存在或底层时间库可用”
- 不应据此对外视为已支持

结论：

- Phase 3 现在不具备启动条件

## 建议动作

### 建议 1：先做 scheduler 策略闭环

优先级：`P0`

动作：

- 校对 shared events 在资源级 gate / overlap / dragBetweenResources 下的真实策略
- 决定是“只按主资源判定”，还是“按命中资源判定”，还是“按所有关联资源取最严策略”
- 把策略写进 `SPEC`，再补测试

### 建议 2：重定义 month 的真实支持状态

优先级：`P1`

动作：

- 确认 month 的 `workweek` 是否已算支持
- 如果支持，更新 `SPEC`
- 如果不支持，收紧实现或补测试，避免继续处于漂移状态
- 顺手验证 `startDayOfWeek` 下的表头文案映射

### 建议 3：继续把 timeline 当回归锚点，而不是扩功能目标

优先级：`P1`

动作：

- scheduler 共享算法变更时，固定回归 timeline
- 不在本轮为 timeline 新增 parity 目标

### 建议 4：暂缓进入 Phase 3

优先级：`P0`

理由：

- 公开能力的最后一层策略定义还没完全收口
- month 的边界还不稳定
- timeline 的副线回归体系还需要继续维持

## 是否建议暂停开发

结论：`建议暂停高级能力开发，但不建议整体停工`

更准确地说：

- 不要继续开发 `recurrence / timezone / external DnD`
- 可以继续做“收敛型开发”：
  - 补 shared events 策略闭环
  - 校正 month 状态与实现
  - 增补缺口测试

## 验证计划

- [x] `node scripts/check-docs.mjs`

## 实施结果

- 实际改动：
  - 审计报告本身为文档任务，无代码改动
  - 审计驱动了下游收敛任务：
    - `2026-06-04-shared-event-policy-closure.md`：补 shared events 资源级策略闭环（P0）
    - `2026-06-04-month-boundary-and-workweek-closure.md`：校正 month 状态与 `workweek` 闭环（P1）
    - `2026-06-04-scheduler-scope-freeze.md`：规格 / 路线图 / 迁移文档对齐（P0/P1）
  - 审计中标记的 4 项建议全部闭环：
    1. ✅ P0 — shared events 策略闭环
    2. ✅ P1 — month 状态重定义
    3. ✅ P1 — timeline 作为回归锚点，未新增 parity 目标
    4. ✅ P0 — Phase 3 暂缓，未启动 recurrence / timezone / external DnD
- 验证结果：
  - `node scripts/check-docs.mjs` 通过
- 剩余问题：
  - month 的 story / 测试密度仍低于 scheduler，后续若继续扩 month 应先补更完整的回归面
  - timeline 的 story 覆盖偏静态，交互验证明显少于 scheduler
