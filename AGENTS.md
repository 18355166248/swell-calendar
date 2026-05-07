# swell-calendar — 智能体导航入口

> React 日历组件库，支持日/周/月视图，提供拖拽、时间选择、主题等功能。

## 仓库结构

| 目录 | 内容 |
|------|------|
| `docs/` | 开发约束、任务文档、ADR、完成标准 |
| `packages/calendar/` | 核心组件库（主体） |
| `packages/eslint-config/` | 共享 ESLint 配置 |
| `packages/typescript-config/` | 共享 tsconfig |
| `apps/docs/` | Storybook 文档（存放于 packages/calendar/src/stories/） |
| `scripts/` | 工程脚本（架构检查、node 版本切换） |
| `.githooks/` | 本地 Git hooks |
| `.github/workflows/` | CI 流水线 |

## 分层架构（依赖单向向前）

```
[0] types/          类型定义（最基础，不导入其他层）
[1] constants/      常量（可导入 types）
[2] utils/          通用工具（可导入 0-1 层）
[3] time/           时间处理（可导入 0-2 层）
[4] model/          数据模型（可导入 0-3 层）
[5] store/ slices/ contexts/   状态管理（可导入 0-4 层）
[6] controller/     业务控制（可导入 0-5 层）
[7] helpers/        视图辅助（可导入 0-6 层）
[8] hooks/          React Hooks（可导入 0-7 层）
[9] Template/       模板渲染（可导入 0-8 层）
[10] components/    UI 组件（可导入所有层）
```

**违反分层方向 = lint 错误，CI 阻止合并。**
详见 `scripts/check-arch.mjs` 和 `packages/calendar/AGENTS.md`。

## 核心入口

- docs 入口：`docs/README.md`
- 开发流程：`docs/WORKFLOW.md`
- 架构规则：`docs/ARCHITECTURE.md`
- 根 API：`packages/calendar/src/components/Calendar.tsx`
- 日视图：`packages/calendar/src/components/view/Day.tsx`
- 周视图：`packages/calendar/src/components/view/Week.tsx`
- 月视图：`packages/calendar/src/components/view/Month.tsx`（开发中）

## 开发准入规则

**先文档，后代码。**

- 新功能 / 重构 / API 变更前，先在 `docs/tasks/` 建任务文档
- 规格变化先改 `packages/calendar/SPEC.md`
- 架构变化先改 `docs/ARCHITECTURE.md`
- 没有 docs 变更的实现提交，会被 `scripts/check-docs.mjs` 和 pre-commit 拦截

## 机械化检查

```bash
# docs-first 检查
node scripts/check-docs.mjs

# 架构分层约束
node scripts/check-arch.mjs

# Lint（含架构约束规则）
pnpm lint

# 类型检查
pnpm --filter swell-calendar exec tsc --noEmit

# Calendar 测试
pnpm --filter swell-calendar test

# 所有检查（pre-commit 跑这个）
pnpm check
```

启用本地 hook：`git config core.hooksPath .githooks`

安装依赖后，根 `prepare` 脚本会自动执行一次上述配置。

当前 pre-commit 会在每次 `git commit` 时执行：

- `node scripts/check-docs.mjs --staged`
- `node scripts/check-arch.mjs`
- 对 staged 的 `packages/calendar` 代码文件执行 `eslint --max-warnings 0`
- 对 staged 的可格式化文件执行 `prettier --check`
- `pnpm --filter swell-calendar exec tsc --noEmit`
- 执行 `pnpm --filter swell-calendar test`

当前 pre-push 会在每次 `git push` 时执行：

- `pnpm --filter swell-calendar exec tsc --noEmit`
- `pnpm --filter swell-calendar test`

说明：全量 `pnpm lint` 仍会受到仓库历史 warnings 影响，因此提交门禁先采用 staged-file lint，优先保证新增改动干净。

CI 兜底：`.github/workflows/ci.yml` 在每次 push/PR 时跑全量检查。

## 不要做的事

- 不要绕过分层约束（反向导入）
- 不要在组件里写业务逻辑（放 controller/）
- 不要用 `console.log`（lint 报错）
- 不要在底层（types/constants/utils）导入 React

## 下一步

- 了解开发流程：`docs/WORKFLOW.md`
- 了解完成标准：`docs/DEFINITION-OF-DONE.md`
- 了解组件库设计：`packages/calendar/SPEC.md`
- 了解详细架构：`packages/calendar/AGENTS.md`
- 了解状态管理：`packages/calendar/src/contexts/`
