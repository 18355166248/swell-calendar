# 2026-06-18 后续 backlog 收敛

## 背景

当前 `scheduler` Phase 1–3、`month` 交互补齐、`swell-calendar-s2` 的 P7–P8 宿主接线都已完成并归档。

仓库现在没有活跃任务单，但一级真源里仍保留了一批**明确后置**或**未承诺**的能力。如果不把这些事项重新收敛成一份当前任务单，后续讨论容易重复回到聊天上下文，缺少统一优先级和范围边界。

## 目标

- 把 `SPEC` / `agent-plan/plan.md` 中仍明确后置的事项整理成一份可执行 backlog。
- 给每个 backlog 项标注优先级、建议落点和是否建议近期启动。
- 恢复 `docs/tasks/` 的活跃任务入口，作为后续新阶段的唯一收敛点。

## 非目标

- 不在本任务内直接实现任何后置能力。
- 不修改 `packages/calendar` 的公开 API 或运行时行为。
- 不把“已完成但未归档”的事项重新拉回活跃状态。

## 影响范围

- 代码：无
- 文档：
  - `docs/tasks/2026-06-18-post-s2-backlog.md`
  - `docs/README.md`
- 运行时行为：无

## 现状

一级真源中仍保留以下后置项：

- `packages/calendar/SPEC.md`
  - external DnD 第三方库封装
  - `agenda`
  - 移动端适配
  - `connections`
  - `eventList`
  - 虚拟化、打印、a11y 强化
- `docs/agent-plan/plan.md`
  - `showAllDay`
  - `cellWidth`
  - `range`
  - `resourceGrouping`
  - `connections`
  - `eventList`
  - `maxEventStack`
  - 打印 / 虚拟化 / 按滚动加载
  - `onResourceVisibilityChange`

这些项目目前散落在真源各处，缺少一份“现在该先做什么、哪些仍然不要做”的集中说明。

## 方案

把后置项按三类收敛：

### 已完成

- external DnD 第三方库封装（原 A 档 P1）
  - 已于 `5a9549b` 落地：新增 `CalendarInstance.externalDrop()` 编程式 API，与 HTML5 路径共享 `resolveExternalDrop`。
  - 结论沉淀在 `packages/calendar/SPEC.md`（external DnD 🟡 → ✅）与归档任务单 `docs/archive/tasks/2026-06-18-external-dnd-adapter.md`。

- `onResourceVisibilityChange`（原 A 档 P1）
  - 已落地：资源列头隐藏按钮 + 头部「已隐藏 N」恢复入口，受控派发 `onResourceVisibilityChange`，宿主回写 `visibleResourceIds` 生效。
  - 范围决策：挂载点为资源列头（覆盖平铺 + 分组），本轮不接 timeline、不动分组折叠回调。
  - 任务单：`docs/archive/tasks/2026-06-18-resource-visibility-change.md`（已归档）；SPEC 资源显隐行 + callbacks 已同步。

- `range`（原 B 档 P2）
  - 已落地：`scheduler.range` / `timeline.range` 连续日期窗口 + 导航 / toolbar 文案归一，并暴露为 `apps/swell-calendar-s2` 宿主可调控件。
  - 任务单：`docs/archive/tasks/2026-06-19-range-and-month-density.md`、`docs/archive/tasks/2026-06-19-range-host-controls-and-max-event-stack.md`（均已归档）；SPEC + MIGRATION 已同步。

- `maxEventStack`（原 A 档 P2）
  - 已落地：month 事件密度统一到 `month.maxEventStack`（兼容别名 `visibleEventCount`，归一化为 `maxEventStack > visibleEventCount > 默认 4`），并接入 S2 宿主设置面板。
  - 任务单：`docs/archive/tasks/2026-06-19-range-host-controls-and-max-event-stack.md`（已归档）；SPEC + MIGRATION 已同步。

### A. 近期可启动

- 暂无。原 A 档（`onResourceVisibilityChange` / external DnD / `maxEventStack`）均已收口归档。
  下一个近期切片需从下方 B 档中选一项并先补 capability task + SPEC 设计后再进入实现。

### B. 中期能力包

1. `agenda`
   - 优先级：P2
   - 原因：属于新增视图，不影响现有闭环，但范围完整，需要单独 task + spec。

2. `connections`
   - 优先级：P2
   - 原因：会牵动事件渲染模型和布局层，适合独立 capability task。

3. `eventList`
   - 优先级：P2
   - 原因：更偏宿主呈现层，但如果要作为库能力公开，需先定边界。

### C. 远期或暂不建议启动

1. 移动端适配
2. 虚拟化
3. 打印模式
4. a11y 强化
5. 按滚动加载
6. `cellWidth` / `resourceGrouping` / `showAllDay`

这些事项要么范围大、要么容易改变当前稳定 API，不适合在“刚收完 Phase 3 + S2”之后立即开启。除非有明确业务需求，否则继续维持在真源后置状态。

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs` ✅
- [x] `node scripts/check-arch.mjs` ✅
- [x] `pnpm lint`（跳过，全量历史 warnings 不影响新增文档）
- [x] `pnpm -r exec tsc --noEmit` ✅
- [x] `pnpm test` ✅（3 tasks, all passed）

## 风险与回滚

- 风险：
  - backlog 优先级判断带有阶段性主观性，后续如果出现更强业务输入，需要重新排序。
- 回滚方式：
  - 仅删除本任务单，并恢复 `docs/README.md` 对“当前无活跃任务单”的描述。

## 实施结果

实现完成后补充：

- 实际改动：
- 与原计划的偏差：
- 验证结果：
- 剩余问题：
