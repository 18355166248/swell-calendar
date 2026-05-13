# Scheduler 实施步骤索引

> 参考样例：Mobiscroll React Scheduler Desktop Week View
> https://demo.mobiscroll.com/react/scheduler/desktop-week-view

本文档把 [plan.md](./plan.md) 的 phase 路线图拆成更细的开发步骤，目标是让每一步都可以独立验证、独立回退，尽量降低共享逻辑改动带来的回归风险。

## 状态约定

- `[ ]` 未开始
- `[-]` 进行中
- `[x]` 已完成

## 总体状态

| 文档 | 范围 | 状态 |
|------|------|------|
| `01-docs-and-normalization.md` | 文档落地、`invalid`、`allDay` | `[x]` |
| `02-scheduler-pipeline-and-layout.md` | scheduler pipeline、all-day、多日分段、`colors` | `[x]` |
| `03-template-and-interaction.md` | template、回调、交互闭环 | `[-]` |
| `04-resource-scheduling.md` | 资源显隐、分组、shared events | `[ ]` |
| `05-advanced-scheduling.md` | recurrence、timezone、DnD | `[ ]` |

## 使用方式

- 先读 [plan.md](./plan.md)，确认总体目标、边界、phase 和 API 决策。
- 再按下面的步骤文档顺序推进，不要跨阶段并包开发。
- 每完成一步，都按该文档里的“最小验证”执行，再进入下一步。
- 任何涉及共享逻辑的改动，都必须额外回归 `Day`、`Week`、`Timeline`。

## 文档清单

1. [01-docs-and-normalization.md](./01-docs-and-normalization.md)
   - 文档落地、`invalid` 命名收敛、`allDay` 归一化。
2. [02-scheduler-pipeline-and-layout.md](./02-scheduler-pipeline-and-layout.md)
   - scheduler 独立数据链路、all-day lane、多日分段、`colors`、tooltip、排序。
3. [03-template-and-interaction.md](./03-template-and-interaction.md)
   - template slot、cell click、hover、交互开关、失败回调、overlap、buffer、delete。
4. [04-resource-scheduling.md](./04-resource-scheduling.md)
   - 资源显隐、树结构、折叠、shared events、资源级交互限制、跨资源拖动。
5. [05-advanced-scheduling.md](./05-advanced-scheduling.md)
   - recurrence、exceptions、timezone、external DnD、跨实例拖动。

## 执行顺序

建议严格按以下顺序执行：

1. `01-docs-and-normalization.md`
2. `02-scheduler-pipeline-and-layout.md`
3. `03-template-and-interaction.md`
4. `04-resource-scheduling.md`
5. `05-advanced-scheduling.md`

## 里程碑清单

- [x] 阶段 01 完成：文档、命名与共享判定入口收敛
- [x] 阶段 02 完成：scheduler 独立布局链路建立
- [-] 阶段 03 进行中：模板与交互闭环推进中
- [ ] 阶段 04 完成：资源调度能力完成
- [ ] 阶段 05 完成：高级调度能力完成

## 每步固定验证

每完成一个步骤，都固定执行：

1. `pnpm -r exec tsc --noEmit`
2. `pnpm lint`
3. 受影响 Storybook 场景手动回归
4. 如果改了共享逻辑，额外回归 `Day` / `Week` / `Timeline`
5. 如果改了 docs 或 phase 边界，执行 `node scripts/check-docs.mjs`

## 不在本轮

以下能力仍然只保留在 [plan.md](./plan.md) 的远期 backlog，不进入本组实施文档：

- agenda
- 移动端适配
- `connections`
- `eventList`
- print mode
- virtualization
- 大数据滚动优化
- keyboard a11y
