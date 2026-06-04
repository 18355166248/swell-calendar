# Docs-First Workflow

> 本仓库默认开发流程不是“先写代码再补说明”，而是“先写约束，再写实现”。

## 适用范围

- 新功能
- 交互行为调整
- API / props / 事件回调变更
- 状态管理与数据流调整
- 分层迁移、目录拆分、模块重构
- 工程脚本、CI、lint 规则调整

## 标准流程

### 1. 定义任务

先在 `docs/tasks/` 新建任务文档，至少写清楚：

- 背景
- 目标
- 非目标
- 影响范围
- 验证方式

如果任务只涉及实现清理，也要明确写出“无规格变更”。

说明：

- `docs/tasks/` 只放当前仍需维护上下文的活跃任务
- 已完成且结论已沉淀进一级真源的任务文档，迁入 `docs/archive/tasks/`

### 2. 更新源头约束

按变更类型同步更新源头文档：

- 产品能力、API、行为边界变化：更新 `packages/calendar/SPEC.md`
- 架构、分层、模块职责变化：更新 `docs/ARCHITECTURE.md`
- 长期保留的技术决策：新增 `docs/adrs/*.md`

规则：**实现不能先于约束落地。**

如果任务属于复杂产品能力演进，例如：

- 付费组件能力对齐
- 多阶段 API 收敛
- 跨视图共享能力重构

则在进入实现前，必须先补一份 feature matrix 或等价能力矩阵文档，至少写清：

- 参考对象是谁
- 近期范围是什么
- 哪些能力后置
- 每个阶段的退出条件

### 3. 实现代码

写代码时遵循：

- 业务规则进入 `controller/`
- 状态进入 `store/ slices/ contexts/`
- 组件只负责渲染和交互编排
- 不逆向穿透分层

### 4. 验证

至少执行：

```bash
node scripts/check-docs.mjs
node scripts/check-arch.mjs
pnpm lint
pnpm --filter swell-calendar exec tsc --noEmit
pnpm --filter swell-calendar test
```

说明：

- `pnpm check` 是全量基线检查，但当前仓库仍存在历史 lint warnings，可能在无关文件上失败。
- 安装依赖后，根 `prepare` 会自动执行 `git config core.hooksPath .githooks`，让提交门禁生效。
- `.githooks/pre-commit` 会在每次 `git commit` 时自动执行：
  - `check-docs`
  - `check-arch`
  - 对 staged 的 `packages/calendar` 代码文件执行 `eslint --max-warnings 0`
  - 对 staged 的可格式化文件执行 `prettier --check`
  - `pnpm --filter swell-calendar exec tsc --noEmit`
  - `pnpm --filter swell-calendar test`
- `.githooks/pre-push` 会在每次 `git push` 时自动执行：
  - `pnpm --filter swell-calendar exec tsc --noEmit`
  - `pnpm --filter swell-calendar test`
- 这样做的目的，是先保证“新增改动不能带入 lint / type / test 问题”，再逐步清理历史 lint 基线。

### 5. 回写结果

实现完成后，回到任务文档补齐：

- 最终方案
- 偏离原计划的点
- 验证结果
- 剩余风险

## 评审顺序

review 先看文档，再看代码：

1. 任务目标是否清晰
2. 规格与边界是否准确
3. 架构落点是否合理
4. 实现是否符合文档
5. 验证是否足够

复杂能力任务额外确认：

6. feature matrix 是否存在且与实现范围一致
7. 一级真源与执行附件是否混写了同一事实

## 禁止事项

- 没有任务文档直接改实现
- API 已变但 `SPEC.md` 未更新
- 架构已变但 `ARCHITECTURE.md` 未更新
- 用 PR 描述代替仓库内文档

## 任务文件命名

- 建议：`docs/tasks/YYYY-MM-DD-short-topic.md`
- 例如：`docs/tasks/2026-05-06-month-view-event-layout.md`

## 什么时候可以不写 ADR

以下情况通常不需要 ADR：

- 纯 bug fix
- 变量/函数重命名
- 不改变结构的局部重构
- 测试补充

以下情况建议写 ADR：

- 改状态模型
- 改公开 API
- 改分层边界
- 引入新运行时依赖或新工程机制
