# 2026-05-06 docs-first governance

## 背景

当前仓库已经有分层检查和 AGENTS 导航，但缺少一个明确的 docs-first 工作流。实现约束主要散落在入口文档和脚本里，无法保证每次开发都先把目标、范围和边界落到仓库中。

## 目标

- 为仓库建立统一的 `docs/` 信息架构
- 明确“先文档，后代码”的标准开发流程
- 增加机械化门控，拦截“改实现但不改文档”的提交

## 非目标

- 不修改日历组件的功能行为
- 不调整现有分层检查策略
- 不引入新的构建工具

## 影响范围

- 代码：`scripts/check-docs.mjs`、`.githooks/pre-commit`、`.github/workflows/ci.yml`、根 `package.json`
- 文档：`docs/`、根 `README.md`、根 `AGENTS.md`、`packages/calendar/AGENTS.md`
- 运行时行为：无组件运行时变化，仅开发流程变化

## 现状

仓库已有：

- `packages/calendar/SPEC.md` 作为产品规范
- `scripts/check-arch.mjs` 作为架构门控
- pre-commit/CI 作为代码检查入口

缺失：

- 统一的开发文档入口
- 任务文档和 ADR 模板
- “改代码必须同步 docs”的自动检查

## 方案

1. 新建 `docs/README.md` 作为总索引。
2. 增加 `WORKFLOW.md`、`ARCHITECTURE.md`、`DEFINITION-OF-DONE.md`。
3. 提供 `docs/tasks/TEMPLATE.md` 与 `docs/adrs/ADR-TEMPLATE.md`。
4. 增加 `scripts/check-docs.mjs`，检查：
   - 核心文档是否存在
   - 实现文件变化时是否至少同步一个 docs 工件
5. 在 pre-commit 和 CI 中接入文档检查。

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`
- [x] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 无规格变更，仅补任务记录

说明：本次不涉及公开功能契约调整，因此不修改 `SPEC.md`，只新增治理与流程文档。

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-docs.mjs --staged`
- [x] `node scripts/check-arch.mjs`
- [ ] `pnpm lint`
- [ ] `pnpm -r exec tsc --noEmit`
- [ ] `pnpm test`

## 风险与回滚

- 风险：文档门控过严，可能对纯实现改动造成额外负担
- 回滚方式：移除 `scripts/check-docs.mjs` 在 pre-commit / CI 的接入，保留文档本身

## 实施结果

- 实际改动：新增 `docs/` 体系、文档门控脚本、CI 和 hook 接入、入口文档更新
- 与原计划的偏差：未新增 ADR，原因是本次偏流程治理，不涉及长期架构选型
- 验证结果：文档检查与架构检查通过
- 剩余问题：尚未执行完整 lint / typecheck / test
