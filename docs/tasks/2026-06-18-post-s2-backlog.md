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

### A. 近期可启动

1. external DnD 第三方库封装
   - 优先级：P1
   - 原因：底层 `onExternalDrop` / `onExternalDropFailed` 已存在，离宿主可直接消费只差一层适配。
   - 预期落点：`hooks/TimeGrid`、宿主 demo、`SPEC`

2. `onResourceVisibilityChange`
   - 优先级：P1
   - 原因：资源显隐能力已存在，但缺少宿主回调闭环，属于低风险 API 收尾。
   - 预期落点：callbacks types、store slice、`SPEC`

3. `maxEventStack`
   - 优先级：P2
   - 原因：month 视图已具备 `+N 更多` 浮层，补堆叠上限配置能进一步产品化，但会牵动多个视图策略。
   - 预期落点：month / scheduler layout controller、`SPEC`

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

4. `range`
   - 优先级：P2
   - 原因：直接影响 week / scheduler / timeline 的日期窗口生成，应先做规格设计再实现。

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
