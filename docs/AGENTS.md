# docs/ — 智能体导航

> 本目录存放“先于代码存在”的开发约束。需要实现功能前，优先读取这里。

## 阅读顺序

1. `README.md` — 文档地图和 docs-first 原则
2. `WORKFLOW.md` — 标准开发流程
3. `ARCHITECTURE.md` — 架构和变更落点
4. `DEFINITION-OF-DONE.md` — 完成标准

## 子目录用途

- `tasks/`：当前活跃任务文档
- `archive/tasks/`：已沉淀的历史任务归档
- `adrs/`：长期保留的架构决策
- `agent-plan/`：路线图主计划 + 执行附件

## 规则

- 开发前先补/改文档，再写代码
- 改实现但不改 docs，会被 `scripts/check-docs.mjs` 拦截
- 读路线图时，优先 `agent-plan/plan.md`；phase 子文档只作为执行附件
