# 2026-06-04 docs information architecture cleanup

## 背景

当前仓库文档数量已经开始影响维护效率。相同事实同时出现在 `SPEC`、`plan`、phase 子文档、任务单和入口文档中，导致：

- 一级真源与执行附件边界不清
- 已沉淀的历史任务仍占据活跃目录
- 新进入仓库的维护者很难快速判断“先看哪几份”

## 目标

- 收紧文档信息架构，只保留少数一级真源
- 将已沉淀的旧任务文档迁入归档目录
- 让 `docs/README.md`、`docs/AGENTS.md` 明确文档分层与阅读顺序
- 将 `agent-plan` 子文档降级为执行附件，不再与 `SPEC/plan` 并列争夺事实源
- 统一智能体入口，让 `AGENTS.md` 成为唯一维护入口，`CLAUDE.md` / `CLAUD.md` 只做转发

## 非目标

- 不删除仍承载当前事实源职责的文档
- 不修改代码实现
- 不重写 `check-docs` 规则

## 影响范围

- 文档：
  - `docs/README.md`
  - `docs/AGENTS.md`
  - `docs/WORKFLOW.md`
  - `docs/agent-plan/*.md`
  - `docs/archive/tasks/*`
- 文件结构：
  - `docs/tasks/` → `docs/archive/tasks/`

## 方案

1. 保留一级真源：`SPEC`、`ARCHITECTURE`、`WORKFLOW`、`MIGRATION`、`agent-plan/plan.md`
2. 将旧任务单归档到 `docs/archive/tasks/`
3. 更新入口文档，只暴露一级真源、当前活跃任务和归档入口
4. 在 `agent-plan` 子文档中明确其为执行附件

## 文档变更

- [x] 更新 `docs/README.md`
- [x] 更新 `docs/WORKFLOW.md`
- [x] 更新 `docs/AGENTS.md`
- [x] 更新 `docs/agent-plan/*.md`

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`

## 风险与回滚

- 风险：引用路径清理不完整会让入口文档失效
- 回滚方式：按归档批次恢复任务文档位置，并回退入口文档

## 实施结果

- 实际改动：
  - 新增 `docs/archive/README.md`，明确归档目录职责
  - 将以下历史任务单迁入 `docs/archive/tasks/`：
    - `2026-05-06-docs-first-governance.md`
    - `2026-05-06-scheduler-v2-foundation.md`
    - `2026-05-07-pre-commit-test-gates.md`
    - `2026-05-07-vitest-test-foundation.md`
    - `2026-06-03-storybook-interaction-tests.md`
  - 更新 `docs/README.md`，按“一级真源 / 当前活跃工件 / 模板与归档”重组入口
  - 更新 `docs/AGENTS.md`、`docs/WORKFLOW.md`，明确活跃任务与归档任务边界
  - 为 `docs/agent-plan/*.md` 补充“执行附件”定位，避免与 `plan.md` / `SPEC.md` 并列争夺事实源
  - 重写根 `AGENTS.md` 为唯一维护入口，新增 `CLAUDE.md` 与 `CLAUD.md` 轻量转发说明
- 与原计划的偏差：
  - 未修改 `check-docs` 规则；本轮只调整信息架构，不改门禁机制
- 验证结果：
  - `node scripts/check-docs.mjs` 通过
- 剩余问题：
  - `docs/agent-plan/plan.md` 仍保留对 `2026-05-06-scheduler-v2-foundation` 的历史衔接说明，但这属于历史上下文，不再作为活跃任务入口
