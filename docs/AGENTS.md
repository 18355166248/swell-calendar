# docs/ — 智能体导航

> 本目录存放“先于代码存在”的开发约束。需要实现功能前，优先读取这里。

## 阅读顺序

1. `README.md` — 文档地图和 docs-first 原则
2. `WORKFLOW.md` — 标准开发流程
3. `ARCHITECTURE.md` — 架构和变更落点
4. `DEFINITION-OF-DONE.md` — 完成标准

## 子目录用途

- `tasks/`：单次开发任务文档
- `adrs/`：长期保留的架构决策

## 规则

- 开发前先补/改文档，再写代码
- 改实现但不改 docs，会被 `scripts/check-docs.mjs` 拦截
