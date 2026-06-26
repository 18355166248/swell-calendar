# swell-calendar Docs

> `docs/` 是当前仓库的人类与智能体协作入口。任何功能开发、重构、架构调整，都必须先在这里明确意图、范围和约束，再进入代码实现。

## 目标

- 把“脑子里的方案”变成版本化工件
- 让实现基于文档而不是基于口头上下文
- 让 review 时优先审查“要做什么、为什么这样做”，再审查“代码怎么写”
- 让智能体每次进入仓库时都能从固定入口读取当前规则

## 开发顺序

1. 先读 [WORKFLOW.md](./WORKFLOW.md)。
2. 再确认当前变更属于哪一类文档：
   - 功能/交互/API 变更：更新 [../packages/calendar/SPEC.md](../packages/calendar/SPEC.md)
   - 架构/分层/模块边界变更：更新 [ARCHITECTURE.md](./ARCHITECTURE.md)
   - 一次具体开发任务：新增 `docs/tasks/*.md`
   - 长期保留的技术决策：新增 `docs/adrs/*.md`
3. 文档提交后再改代码。
4. 提交前运行 `pnpm check`，并确保 `node scripts/check-docs.mjs` 通过。

## 一级真源

| 文档                                                         | 作用                                      |
| ------------------------------------------------------------ | ----------------------------------------- |
| [WORKFLOW.md](./WORKFLOW.md)                                 | 唯一开发流程真源                          |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                         | 唯一结构与分层真源                        |
| [../packages/calendar/SPEC.md](../packages/calendar/SPEC.md) | 唯一产品能力与公开 API 真源               |
| [MIGRATION.md](./MIGRATION.md)                               | 唯一兼容迁移真源                          |
| [agent-plan/plan.md](./agent-plan/plan.md)                   | 唯一 scheduler 路线图与 scope matrix 真源 |
| [DEFINITION-OF-DONE.md](./DEFINITION-OF-DONE.md)             | 完成标准                                  |

## 当前活跃工件

> **2026-06-26：** 重复事件宿主侧接线进行中（[任务单](tasks/2026-06-26-recurrence-host-wiring.md)）。

| 文档                                                                                       | 作用                                               |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| [adrs/ADR-2026-05-scheduler-parity-scope.md](./adrs/ADR-2026-05-scheduler-parity-scope.md) | scheduler 范围与设计原则 ADR（一级原则记录，保留） |

> 已完成的所有任务单（scheduler / month / S2 / 移动端 M0–M5 等）均已迁入 [archive/tasks/](./archive/tasks/)，结论沉淀在 `SPEC` / `agent-plan/plan.md` 等一级真源。移动端最终交付：响应式布局、四视图（Day/Multi-day/Agenda/Month）、触控输入（长按创建含临时卡片 + haptic、事件编辑态 move/resize）、浮层 sheet 化。

## 模板与归档

| 文档                                           | 作用             |
| ---------------------------------------------- | ---------------- |
| [tasks/TEMPLATE.md](./tasks/TEMPLATE.md)       | 单次开发任务模板 |
| [adrs/ADR-TEMPLATE.md](./adrs/ADR-TEMPLATE.md) | 架构决策记录模板 |
| [archive/README.md](./archive/README.md)       | 归档说明         |

## Scheduler 路线图

- 参考样例：Mobiscroll React Scheduler Desktop Week View
- https://demo.mobiscroll.com/react/scheduler/desktop-week-view
- 主计划：[agent-plan/plan.md](./agent-plan/plan.md)
- 实施索引（执行附件）：[agent-plan/implementation-steps.md](./agent-plan/implementation-steps.md)
- 任务文档（已归档）：[archive/tasks/2026-05-07-scheduler-mobiscroll-parity-roadmap.md](./archive/tasks/2026-05-07-scheduler-mobiscroll-parity-roadmap.md)

## 文档分层

- 一级真源：
  - `SPEC` / `ARCHITECTURE` / `WORKFLOW` / `MIGRATION` / `agent-plan/plan.md`
  - 这些文档负责回答“现在仓库的正式规则是什么”
- 执行附件：
  - `docs/agent-plan/01-05-*.md`
  - `docs/agent-plan/implementation-steps.md`
  - 这些文档只负责回答“这个路线图具体怎么分步执行”
- 活跃任务：
  - `docs/tasks/`
  - 只保留当前仍需要维护上下文的任务单
- 历史归档：
  - `docs/archive/tasks/`
  - 结论已沉淀进一级真源，只保留追溯价值

## 强制规则

- 改 `packages/calendar/src/`、`scripts/`、`.github/workflows/`、根 `package.json` 等实现文件时，必须同时修改至少一个 docs 工件。
- 只改格式、注释、测试数据这类纯实现细节，也需要在任务文档里注明“无规格变更，只做实现清理”。
- 没有对应文档变更的代码提交，视为上下文缺失。

## 推荐实践

- 小改动也建任务文档，标题可以直接写成 `YYYY-MM-DD-xxx.md`
- 方案不稳定时，先在任务文档里列方案比较，再落代码
- 如果发现现有规范不够清晰，先补文档，再继续实现
