# 步骤 03：模板收敛与交互闭环

> 参考样例：Mobiscroll React Scheduler Desktop Week View
> https://demo.mobiscroll.com/react/scheduler/desktop-week-view

本阶段对应 [plan.md](./plan.md) 的 `Phase 1A.3` 和 `Phase 1B`。目标是先收敛 scheduler 专属模板和基础回调，再分小步接入交互开关、失败回调、overlap 和 delete。

## 当前状态

- 总状态：`[-] 进行中`

## 步骤清单

- [x] Step 13：收敛 scheduler template slots
- [x] Step 14：接入 `onCellClick`
- [x] Step 15：接入 `onEventHover`
- [ ] Step 16：接入 scheduler 全局交互开关
- [ ] Step 17：接入已有 per-event gate
- [ ] Step 18：建立 failed callback 骨架
- [ ] Step 19：接入 `invalid` 失败原因
- [ ] Step 20：接入全局 overlap 策略
- [ ] Step 21：接入 per-event `overlap`
- [ ] Step 22：接入 `bufferBefore` / `bufferAfter`
- [ ] Step 23：扩展 delete action

## 目标

- 补 scheduler 专属 template slot。
- 接入 `onCellClick`、`onEventHover`。
- 接入全局交互开关和已有 per-event gate。
- 建立 failed callback 体系。
- 完成 overlap / buffer / delete。

## Step 13：收敛 scheduler template slots

内容：

- 在 `template.type`、`template.slice` 中补 scheduler 需要的 slots
- 第一批先支持 header 和 event 内容

最小验证：

- `Scheduler/Templates`

通过标准：

- 宿主可通过 template 替换 scheduler header / event 渲染

## Step 14：接入 `onCellClick`

内容：

- 只做空白 cell 点击意图
- 不和 range selection 一起重构

最小验证：

- 点击空白单元格能触发回调

通过标准：

- 点击与拖拽选择互不干扰

## Step 15：接入 `onEventHover`

内容：

- 只做最小 hover 事件派发
- 不引入复杂 hover 状态机

最小验证：

- hover story 可观察回调

通过标准：

- hover 不影响 click 和拖拽

## Step 16：接入 scheduler 全局交互开关

内容：

- `dragToCreate`
- `dragToMove`
- `dragToResize`
- `dragInTime`

先做：

- 全局开关

不要做：

- 不同时做 per-event overlap 或资源级规则

最小验证：

- 每个开关关闭时，对应交互失效

通过标准：

- 默认行为不变

## Step 17：接入已有 per-event gate

内容：

- `editable`
- `draggable`
- `resizable`

最小验证：

- 只读事件不能拖/resize
- 可编辑事件不受影响

通过标准：

- per-event gate 已进入 scheduler 交互链

## Step 18：建立 failed callback 骨架

内容：

- `onEventCreateFailed`
- `onEventUpdateFailed`
- `onEventDelete`

先做：

- payload 打通
- 最小 reason 支持

最小验证：

- 构造一个失败场景，确认回调有值

通过标准：

- 宿主可感知失败，不依赖内部静默忽略

## Step 19：接入 `invalid` 失败原因

内容：

- create / move / resize 命中 invalid 时触发 failed callback

最小验证：

- `Scheduler/FailedCallbacks`

通过标准：

- `reason=invalid` 正确分发

## Step 20：接入全局 overlap 策略

内容：

- `eventOverlap`
- 只在 scheduler 生效

最小验证：

- 禁止重叠场景被拦截
- 允许重叠时保持原行为

通过标准：

- overlap 有统一入口

## Step 21：接入 per-event `overlap`

内容：

- 事件级策略覆盖全局

最小验证：

- 混合 case：一个事件允许、一个事件不允许

通过标准：

- per-event 优先级正确

## Step 22：接入 `bufferBefore` / `bufferAfter`

内容：

- 仅让 buffer 参与冲突判定
- 不改变视觉高度和长度

最小验证：

- 单测覆盖边界分钟数

通过标准：

- buffer 对 overlap 判定生效

## Step 23：扩展 delete action

内容：

- `CalendarEventChangeAction` 增 `delete`
- delete 进入 callback 体系

最小验证：

- `Scheduler/Delete`

通过标准：

- 类型不破坏旧调用方

## 阶段回归清单

每完成一步都回归：

- `Scheduler/Templates`
- `Scheduler/ValidationPolicies`
- `Scheduler/FailedCallbacks`
- `Day`
- `Week`
- `Timeline`

## 退出条件

- template 和回调入口已齐
- 交互开关、per-event gate、failed callback、overlap、buffer、delete 已闭环
- 宿主只用受控 `events` + callbacks 就能完整接管交互结果

## 完成后更新

- 将本文档“总状态”改为 `[-] 进行中` 或 `[x] 已完成`
- 勾选已完成步骤
- 回到 [implementation-steps.md](./implementation-steps.md) 更新对应阶段状态

## 当前落地说明

- 已新增 scheduler 专属模板槽位：日期头、资源头、时间事件内容
- `TimeGrid` 点击空白 cell 时会派发 `onCellClick`，拖拽选择仍走 `onRangeSelect` / `onEventCreate`
- scheduler 时间事件已补 `onEventHover`，进入和离开都会回调 `hovering`
