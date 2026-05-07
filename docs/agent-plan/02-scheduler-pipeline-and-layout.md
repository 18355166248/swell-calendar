# 步骤 02：Scheduler 数据链路与布局基线

> 参考样例：Mobiscroll React Scheduler Desktop Week View
> https://demo.mobiscroll.com/react/scheduler/desktop-week-view

本阶段对应 [plan.md](./plan.md) 的 `Phase 1A.2`。目标是把 scheduler 从 week 的最终事件输出中拆出来，建立独立 layout pipeline，再逐步接入 all-day lane、多日分段、`colors`、tooltip 和排序。

## 当前状态

- 总状态：`[-] 进行中`

## 步骤清单

- [x] Step 6：建立 scheduler 独立 layout pipeline 骨架
- [ ] Step 7：给 scheduler layout 增最小单测骨架
- [ ] Step 8：接入 scheduler all-day lane 骨架
- [ ] Step 9：接入多日事件分段算法
- [ ] Step 10：接入 `colors`
- [ ] Step 11：接入拖拽时间 tooltip
- [ ] Step 12：接入 `EventObject.order`

## 目标

- scheduler 不再直接依赖 `getWeekViewEvents(...).time` 的最终结果。
- 建立独立的 `controller/scheduler-layout.ts`。
- 接入 all-day lane、多日事件分段、`colors`、拖拽时间 tooltip、`order`。

## Step 6：建立 scheduler 独立 layout pipeline 骨架

内容：

- 保留 week 现有数据链路不变
- scheduler 改为“共享基础时间范围筛选 + 独立 layout pipeline”
- 新建 `controller/scheduler-layout.ts`
- 先只打通最基础的单日单资源时间事件输入输出

不要做：

- 不在这一步加入 all-day 或跨日能力

最小验证：

- `Scheduler` 仍能渲染基础时间事件
- `Week` 表现完全不变

通过标准：

- scheduler 已有独立 layout 入口
- week 仍复用旧 pipeline

## Step 7：给 scheduler layout 增最小单测骨架

内容：

- 为 `controller/scheduler-layout.ts` 新建测试文件
- 先覆盖单日、单资源、单事件

最小验证：

- `pnpm test`

通过标准：

- 后续所有 scheduler 布局改动都有测试落点

## Step 8：接入 scheduler all-day lane 骨架

内容：

- 新建 `components/scheduler/SchedulerAllDayLane.tsx`
- 先支持单日全天事件展示
- 只做基本渲染，不做多日分段

最小验证：

- 新增 `Scheduler/AllDayAndMultiDay` story 初版

通过标准：

- scheduler 顶部出现 all-day lane
- 全天事件能进 lane

## Step 9：接入多日事件分段算法

内容：

- 在 `controller/scheduler-layout.ts` 中实现多日分段
- 按资源分别分段，不做跨资源连续块
- 不在 week 旧 pipeline 中硬塞新逻辑

最小验证：

- 单测覆盖 2 天、3 天、多资源分段
- Storybook 中能看到正确分段

通过标准：

- 多日事件在 scheduler 中按资源和日期列正确展开

## Step 10：接入 `colors`

内容：

- 实现背景染色层
- 层级固定：`colors` 在下，`invalid` 在上
- 只负责视觉表达，不影响编辑性判断

最小验证：

- `Scheduler/InvalidAndColors`

通过标准：

- `colors` 和 `invalid` 同时存在时视觉层级正确

## Step 11：接入拖拽时间 tooltip

内容：

- 新建 `components/scheduler/DragTimeTooltip.tsx`
- 先支持 move / resize 的时间展示
- 不扩展成复杂 hover 卡片

最小验证：

- 手动拖动和 resize 验证

通过标准：

- 拖拽过程中时间提示可见
- 不影响拖拽结果

## Step 12：接入 `EventObject.order`

内容：

- 在 scheduler 同槽位事件中支持排序
- 尽量局部生效，不改变 week / day 的旧排序逻辑

最小验证：

- 单测覆盖 `order` 排序
- Storybook 构造两个重叠事件验证顺序

通过标准：

- scheduler 中同槽位事件顺序稳定可控

## 阶段回归清单

每完成一步都回归：

- `Scheduler`
- `Day`
- `Week`
- `Timeline`

特别检查：

- week/day 的全天区不退化
- timeline 的 invalid 遮罩不退化

## 退出条件

- scheduler 已有独立 layout pipeline
- all-day lane、多日分段、`colors`、tooltip、`order` 全部落地
- 与 Mobiscroll 主参考样例的桌面 week scheduler 布局接近

## 完成后更新

- 将本文档“总状态”改为 `[-] 进行中` 或 `[x] 已完成`
- 勾选已完成步骤
- 回到 [implementation-steps.md](./implementation-steps.md) 更新对应阶段状态
