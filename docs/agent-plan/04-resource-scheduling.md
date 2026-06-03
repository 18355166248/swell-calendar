# 步骤 04：资源调度能力

> 参考样例：Mobiscroll React Scheduler Desktop Week View
> https://demo.mobiscroll.com/react/scheduler/desktop-week-view

本阶段对应 [plan.md](./plan.md) 的 `Phase 2`。目标是把资源模型从“平铺资源列”扩展为可显隐、可分组、可折叠、可共享事件、可资源级控制交互的完整调度能力。

## 当前状态

- 总状态：`[x] 已完成`

## 步骤清单

- [x] Step 24：接入 `visibleResourceIds`
- [x] Step 25：做 `children` / `parentId` 树归一化
- [x] Step 26：接入 group / collapse UI
- [x] Step 27：接入 shared events
- [x] Step 28：接入资源级交互限制
- [x] Step 29：接入 `dragBetweenResources`

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

- [x] 资源显隐、分组、折叠、shared events、资源级限制、跨资源拖动全部闭环

## 完成后更新

- [x] 将本文档”总状态”改为 `[x] 已完成`
- [x] 勾选已完成步骤
- [x] 回到 [implementation-steps.md](./implementation-steps.md) 更新对应阶段状态

## 当前落地说明

- `SchedulerOptions` 已接入 `visibleResourceIds`，优先级高于 `hidden`；`getVisibleResources` 在提供 `visibleResourceIds` 时优先使用它过滤
- `ResourceInfo` 已增加 `children`（树形结构）和 `collapsed`（初始折叠状态），新建 `controller/scheduler-resources.ts` 提供 `flattenResourceTree` / `buildTreeFromFlatList` / `normalizeResources` / `findResource` 等归一化工具
- 新建 `slices/resource.slice.ts` 管理 `collapsedResourceIds` 状态，新建 `components/scheduler/ResourceSidebar.tsx` 渲染资源层级面板；`Scheduler.tsx` 已集成 sidebar 和折叠过滤逻辑
- `TimeGridView.tsx` 的 `isSameResourceColumn` 已支持 `resourceIds` 数组匹配，共享事件在各资源列独立渲染
- `createUpdatedTimeGridEvent` 对共享事件（`resourceIds.length > 1`）在已有资源集内移动时保留 `resourceIds` 数组，只在拖到新资源列时覆盖
- `ResourceInfo` 已增加 `eventDragInTime` / `eventDragBetweenResources` / `eventResize` / `eventOverlap` 资源级交互限制，在 `shouldAcceptEventChange` 中插入资源级策略检查（Step 3），优先级为 event > resource > global
- `SchedulerOptions` 增加 `dragBetweenResources`（全局），`EventObject` 增加 `dragBetweenResources`（per-event），配合资源级 `eventDragBetweenResources` 形成三级跨资源拖动门禁
- 新增 Storybook: `VisibleResourceIds`、`ResourceVisibilityAndGrouping`、`SharedEvents`
