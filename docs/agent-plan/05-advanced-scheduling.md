# 步骤 05：高级调度能力

> 参考样例：Mobiscroll React Scheduler Desktop Week View
> https://demo.mobiscroll.com/react/scheduler/desktop-week-view

本阶段对应 [plan.md](./plan.md) 的 `Phase 3`。目标是把 recurrence、exceptions、timezone、external DnD、跨实例拖动拆成可独立验证的能力，而不是一次性并包。

## 当前状态

- 总状态：`[ ] 未开始`

## 步骤清单

- [ ] Step 30：补 recurrence 相关类型
- [ ] Step 31：实现 recurrence 视口内展开
- [ ] Step 32：接入 recurring exceptions
- [ ] Step 33：接入 timezone
- [ ] Step 34：接入 external DnD
- [ ] Step 35：接入跨实例拖动

## 目标

- 先补齐高级数据结构
- 再做 recurrence 视口内展开
- 再做 exceptions
- 再做 timezone
- 最后做 external DnD / 跨实例拖动

## Step 30：补 recurrence 相关类型

内容：

- `recurringException`
- `recurringExceptionRule`

最小验证：

- `pnpm -r exec tsc --noEmit`

通过标准：

- 旧事件模型不受影响

## Step 31：实现 recurrence 视口内展开

内容：

- 只在当前可视窗口内展开
- 先覆盖 daily / weekly / monthly 基础规则

最小验证：

- 单测覆盖三类基础 recurrence

通过标准：

- 不会把整个历史/未来无限展开

## Step 32：接入 recurring exceptions

内容：

- 支持跳过实例
- 支持替换实例

最小验证：

- 单测覆盖 exception 优先级

通过标准：

- recurrence 和 exceptions 可协同工作

## Step 33：接入 timezone

内容：

- 支持“数据时区 + 显示时区”转换
- 不改未配置 timezone 的默认行为

最小验证：

- `Scheduler/Timezone`

通过标准：

- 非 timezone 事件渲染结果不变

## Step 34：接入 external DnD

内容：

- 先提供 hooks / intent
- 不做第三方库封装

最小验证：

- `Scheduler/ExternalDnDMock`

通过标准：

- 宿主可以拿到外部 drop intent

## Step 35：接入跨实例拖动

内容：

- 事件可在多个 calendar 实例间拖动
- 回调携带完整上下文

最小验证：

- mock 场景验证 source / target / event payload

通过标准：

- 高级调度能力不破坏宿主受控数据流

## 阶段回归清单

每完成一步都回归：

- `Scheduler/Recurrence`
- `Scheduler/Timezone`
- `Scheduler/ExternalDnDMock`
- `Day`
- `Week`
- `Timeline`

## 退出条件

- recurrence、exceptions、timezone、external DnD、跨实例拖动全部完成
- 不要求内建弹窗编辑器
- 不引入 agenda、移动端或远期 backlog 能力

## 完成后更新

- 将本文档“总状态”改为 `[-] 进行中` 或 `[x] 已完成`
- 勾选已完成步骤
- 回到 [implementation-steps.md](./implementation-steps.md) 更新对应阶段状态
