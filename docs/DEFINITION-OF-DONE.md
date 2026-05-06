# Definition Of Done

一个开发任务只有在同时满足以下条件时，才算完成。

## 文档

- 存在对应的 `docs/tasks/*.md`
- 任务文档包含目标、范围、方案、验证、风险
- 如果 API 或行为变化，`packages/calendar/SPEC.md` 已同步
- 如果结构或工程规则变化，`docs/ARCHITECTURE.md` 或 `docs/WORKFLOW.md` 已同步

## 实现

- 代码符合分层约束
- 业务逻辑没有泄漏到组件层
- 没有新增 `console.log`
- 新增代码遵循现有命名与目录习惯

## 验证

- `node scripts/check-docs.mjs` 通过
- `node scripts/check-arch.mjs` 通过
- `pnpm lint` 通过
- 受影响范围需要时，`pnpm -r exec tsc --noEmit` 通过
- 受影响范围需要时，`pnpm test` 通过

## 可交接

- 后续维护者只读仓库内文档，就能理解本次改动的目的和边界
- 不依赖聊天记录、口头约定或 PR 临时描述
