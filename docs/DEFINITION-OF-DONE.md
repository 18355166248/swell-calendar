# Definition Of Done

> 根目录 `AGENTS.md` 已提供日常协作所需的最小完成标准。本文件保留详细版清单，供自检与评审使用。

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

## 与 AGENTS.md 的关系

- 日常进入仓库时，先按 `AGENTS.md` 的最小完成标准执行
- 需要逐项自检、评审或补齐交付材料时，再展开本文件
- 如果本文件与一级真源冲突，以 `AGENTS.md` 指向的一级真源为准，并回收重复表述
