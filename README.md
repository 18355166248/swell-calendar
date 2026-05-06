# swell-calendar

> React 日历组件库，支持日 / 周 / 月视图、拖拽、时间选择、主题和模板定制。

## 开发原则

当前仓库采用 `docs-first` 开发方式：

1. 先在 `docs/` 明确任务、范围和约束
2. 再更新 `packages/calendar/SPEC.md` 或架构文档
3. 最后实现代码

没有文档上下文的代码变更，不视为完整开发。

## 入口文档

- [docs/README.md](./docs/README.md) — 开发文档总索引
- [docs/WORKFLOW.md](./docs/WORKFLOW.md) — 标准开发流程
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — 架构与模块边界
- [packages/calendar/SPEC.md](./packages/calendar/SPEC.md) — 组件库功能规范

## 检查命令

```bash
node scripts/check-docs.mjs
node scripts/check-arch.mjs
pnpm check
```
