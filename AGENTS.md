# swell-calendar — Canonical Agent Entry

> 本文件是 Codex / Claude 进入仓库时的唯一维护入口。其他入口文件只做转发，不再维护独立规则。

## 先读什么

1. 本文件
2. [docs/README.md](./docs/README.md)
3. 按任务类型展开一级真源：
   - 功能 / API / 能力边界： [packages/calendar/SPEC.md](./packages/calendar/SPEC.md)
   - 架构 / 分层 / 落点： [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
   - 开发流程 / 文档门禁： [docs/WORKFLOW.md](./docs/WORKFLOW.md)
   - 迁移兼容： [docs/MIGRATION.md](./docs/MIGRATION.md)
   - scheduler 路线图与 scope： [docs/agent-plan/plan.md](./docs/agent-plan/plan.md)

## 一级真源

- `packages/calendar/SPEC.md`
  - 唯一产品能力与公开 API 真源
- `docs/ARCHITECTURE.md`
  - 唯一结构与分层真源
- `docs/WORKFLOW.md`
  - 唯一 docs-first 流程真源
- `docs/MIGRATION.md`
  - 唯一兼容迁移真源
- `docs/agent-plan/plan.md`
  - 唯一 scheduler 路线图与 scope matrix 真源

规则：

- 如果执行附件、任务单、stories 或聊天上下文与一级真源冲突，以一级真源为准
- 需要修改事实边界时，先改一级真源，再改执行附件

## 执行附件与归档

- `docs/agent-plan/01-05-*.md`
- `docs/agent-plan/implementation-steps.md`
  - 只回答“如何分步执行”，不再承担事实源职责
- `docs/tasks/`
  - 当前活跃任务
- `docs/archive/tasks/`
  - 已沉淀历史任务，仅供追溯

## 开发准入

**先文档，后代码。**

- 新功能 / 重构 / API 变更前，先在 `docs/tasks/` 建任务文档
- 规格变化先改 `packages/calendar/SPEC.md`
- 架构变化先改 `docs/ARCHITECTURE.md`
- 路线图 / scope 变化先改 `docs/agent-plan/plan.md`
- 没有 docs 变更的实现提交，会被 `scripts/check-docs.mjs` 和 pre-commit 拦截

## 分层架构

```text
[0] types
[1] constants
[2] utils
[3] time
[4] model
[5] store / slices / contexts
[6] controller
[7] helpers
[8] hooks
[9] Template
[10] components
```

硬规则：

- 依赖只能单向向前
- 不在 `components/` 写业务逻辑，放 `controller/`
- 不在 `types/constants/utils/time/model` 导入 React
- 不用 `console.log`

详见 [packages/calendar/AGENTS.md](./packages/calendar/AGENTS.md) 和 `scripts/check-arch.mjs`。

## 常用入口

- 根组件 API： [packages/calendar/src/components/Calendar.tsx](./packages/calendar/src/components/Calendar.tsx)
- 日视图： [packages/calendar/src/components/view/Day.tsx](./packages/calendar/src/components/view/Day.tsx)
- 周视图： [packages/calendar/src/components/view/Week.tsx](./packages/calendar/src/components/view/Week.tsx)
- 月视图： [packages/calendar/src/components/view/Month.tsx](./packages/calendar/src/components/view/Month.tsx)
- scheduler： [packages/calendar/src/components/view/Scheduler.tsx](./packages/calendar/src/components/view/Scheduler.tsx)
- timeline： [packages/calendar/src/components/view/Timeline.tsx](./packages/calendar/src/components/view/Timeline.tsx)

## 机械化检查

```bash
node scripts/check-docs.mjs
node scripts/check-arch.mjs
pnpm --filter swell-calendar exec tsc --noEmit
pnpm --filter swell-calendar test
pnpm check
```

说明：

- `pnpm lint` 全量仍可能受历史 warnings 影响
- 提交门禁优先保证新增改动干净
- `prepare` 会自动配置 `.githooks`

## 对智能体的要求

- 不要在多个入口文件里重复维护规则
- 修改协作规则时，优先更新本文件，再按需更新引用它的入口
- 如果为 Claude / Codex / 其他助手新增入口文件，只写“先读 AGENTS.md”的转发说明，不复制规则正文
