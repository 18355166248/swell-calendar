# 步骤 04：资源调度能力

> 参考样例：Mobiscroll React Scheduler Desktop Week View
> https://demo.mobiscroll.com/react/scheduler/desktop-week-view

本阶段对应 [plan.md](./plan.md) 的 `Phase 2`。目标是把资源模型从“平铺资源列”扩展为可显隐、可分组、可折叠、可共享事件、可资源级控制交互的完整调度能力。

## 当前状态

- 总状态：`[ ] 未开始`

## 步骤清单

- [ ] Step 24：接入 `visibleResourceIds`
- [ ] Step 25：做 `children` / `parentId` 树归一化
- [ ] Step 26：接入 group / collapse UI
- [ ] Step 27：接入 shared events
- [ ] Step 28：接入资源级交互限制
- [ ] Step 29：接入 `dragBetweenResources`

## 目标

- 支持 `visibleResourceIds`
- 支持 `children` / `parentId` 归一化
- 支持 group / collapse
- 支持 shared events
- 支持资源级交互限制
- 支持跨资源拖动开关

## Step 24：接入 `visibleResourceIds`

内容：

- 资源显隐主入口改为 `visibleResourceIds`
- 保持 `hidden` 兼容
- 优先级：`visibleResourceIds` 胜过 `hidden`

最小验证：

- 切换 visible ids 后列数变化正确

通过标准：

- 资源显隐生效
- 不丢滚动位置

## Step 25：做 `children` / `parentId` 树归一化

内容：

- 先只做数据归一化
- 同时支持：
  - 宿主传 `children`
  - 宿主传扁平 `parentId`

最小验证：

- 单测覆盖树转扁平、扁平转树

通过标准：

- 两种输入都能得到稳定树结构

## Step 26：接入 group / collapse UI

内容：

- `ResourceSidebar`
- `ResourceGroupHeader`
- 折叠/展开行为

最小验证：

- `Scheduler/ResourceVisibilityAndGrouping`

通过标准：

- 资源折叠后布局仍稳定

## Step 27：接入 shared events

内容：

- 让 `resourceIds` 正式参与 scheduler 布局
- 一个事件可以同时渲染到多个资源列

最小验证：

- `Scheduler/SharedEvents`

通过标准：

- shared event 在多个资源列都能正确显示

## Step 28：接入资源级交互限制

内容：

- `eventDragInTime`
- `eventDragBetweenResources`
- `eventResize`
- `eventOverlap`

最小验证：

- 单测覆盖资源级策略优先级

通过标准：

- 资源级策略正确落入统一 validation 链

## Step 29：接入 `dragBetweenResources`

内容：

- 先接全局
- 再接 per-event

最小验证：

- 关闭时不能跨资源列拖动
- 开启时可以拖动并回写正确目标资源

通过标准：

- 跨资源拖动和 shared events 不互相打架

## 阶段回归清单

每完成一步都回归：

- `Scheduler/ResourceVisibilityAndGrouping`
- `Scheduler/SharedEvents`
- `Timeline`

特别检查：

- timeline 的资源列行为不退化
- 旧 `hidden` / `parentId` 示例仍可运行

## 退出条件

- 资源显隐、分组、折叠、shared events、资源级限制、跨资源拖动全部闭环

## 完成后更新

- 将本文档“总状态”改为 `[-] 进行中` 或 `[x] 已完成`
- 勾选已完成步骤
- 回到 [implementation-steps.md](./implementation-steps.md) 更新对应阶段状态
