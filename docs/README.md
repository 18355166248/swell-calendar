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

## 文档地图

| 文档 | 作用 |
|------|------|
| [WORKFLOW.md](./WORKFLOW.md) | 定义 docs-first 开发流程和每一步的产出 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 定义仓库边界、模块职责、变更落点 |
| [../packages/calendar/SPEC.md](../packages/calendar/SPEC.md) | 组件库产品规范、能力边界、API 契约 |
| [DEFINITION-OF-DONE.md](./DEFINITION-OF-DONE.md) | 任务完成标准 |
| [tasks/TEMPLATE.md](./tasks/TEMPLATE.md) | 单次开发任务模板 |
| [adrs/ADR-TEMPLATE.md](./adrs/ADR-TEMPLATE.md) | 架构决策记录模板 |

## 文档分类规则

- `docs/tasks/`
  记录一次开发任务的目标、范围、方案、验证与回滚点。偏短期，任务完成后保留，作为后续维护上下文。
- `docs/adrs/`
  记录需要长期保留的技术决策。偏长期，用于解释“为什么仓库现在是这样”。
- `packages/calendar/SPEC.md`
  是产品约束，不写实现细节；如果功能契约变化，这里必须先变。

## 强制规则

- 改 `packages/calendar/src/`、`scripts/`、`.github/workflows/`、根 `package.json` 等实现文件时，必须同时修改至少一个 docs 工件。
- 只改格式、注释、测试数据这类纯实现细节，也需要在任务文档里注明“无规格变更，只做实现清理”。
- 没有对应文档变更的代码提交，视为上下文缺失。

## 推荐实践

- 小改动也建任务文档，标题可以直接写成 `YYYY-MM-DD-xxx.md`
- 方案不稳定时，先在任务文档里列方案比较，再落代码
- 如果发现现有规范不够清晰，先补文档，再继续实现
