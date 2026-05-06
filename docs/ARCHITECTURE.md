# Architecture Guide

> 本文档描述 `swell-calendar` 的稳定结构。代码实现必须服从这里定义的模块边界。

## 仓库分层

### 根目录

| 路径 | 职责 |
|------|------|
| `packages/calendar/` | 日历组件库主体 |
| `packages/eslint-config/` | 共享 lint 规则 |
| `packages/typescript-config/` | 共享 tsconfig |
| `scripts/` | 机械化检查与本地开发脚本 |
| `.githooks/` | 提交前门控 |
| `.github/workflows/` | CI 流水线 |
| `docs/` | 开发约束、任务和架构文档 |

### 组件库内部

以 `packages/calendar/src/` 为核心，依赖方向必须单向向前：

```text
types
→ constants
→ utils
→ time
→ model
→ store / slices / contexts
→ controller
→ helpers
→ hooks
→ Template
→ components
```

## 各层职责

| 层 | 目录 | 只做什么 |
|----|------|---------|
| 0 | `types/` | 类型定义，不放运行时代码 |
| 1 | `constants/` | 常量、枚举、错误码、固定配置 |
| 2 | `utils/` | 与业务无关的工具函数 |
| 3 | `time/` | 日期时间计算与封装 |
| 4 | `model/` | 事件数据模型、领域对象 |
| 5 | `store/` `slices/` `contexts/` | 状态组织与 store 装配 |
| 6 | `controller/` | 业务规则、布局算法、事件计算 |
| 7 | `helpers/` | 视图辅助转换 |
| 8 | `hooks/` | React 行为封装 |
| 9 | `Template/` | 可替换渲染模板 |
| 10 | `components/` | UI 组件与视图组合 |

## 模块边界

### Event Pipeline

```text
EventObject
→ EventModel
→ EventUIModel
→ components/events/*
```

规则：

- `EventObject` 是宿主输入，不直接在组件里原地修改
- 事件布局算法统一放在 `controller/`
- 渲染层只消费已计算好的 UI 数据

### Store Pipeline

```text
options/theme/events input
→ slices
→ contexts/calendarStore
→ hooks
→ components
```

规则：

- 状态初始化和组合放在 `contexts/`
- 业务状态迁移放在 `slices/`
- 组件不直接拼装 store 逻辑

## 变更落点规则

### 改事件行为时

- 先改 `packages/calendar/SPEC.md`
- 再判断改动落在 `controller/` 还是 `model/`
- 不要直接在 `components/` 里补条件分支

### 改交互时

- 交互编排优先落在 `hooks/`
- UI 呈现变化才进 `components/`

### 改公开 API 时

- 先改 `packages/calendar/SPEC.md`
- 如果是长期决策，再补 `docs/adrs/*.md`

### 改工程规则时

- 更新本文件或 `docs/WORKFLOW.md`
- 同步脚本门控：`scripts/`、`.githooks/`、CI

## 文档与代码的映射关系

| 变更类型 | 必须更新的文档 |
|----------|---------------|
| props / callbacks / options 变化 | `packages/calendar/SPEC.md` |
| 分层、模块职责、目录迁移 | `docs/ARCHITECTURE.md` |
| 任务目标、方案、验证 | `docs/tasks/*.md` |
| 需要长期保留的技术决策 | `docs/adrs/*.md` |

## 结构演进原则

- 优先扩展现有层，不轻易新增平级目录
- 如果一个文件承担了两个层的职责，优先拆分，而不是放宽规则
- 如果一项规则无法机械化执行，至少要能在文档中指出明确落点
