# 2026-06-07 timeline 重建为日粒度 Calendar Timeline

## 背景

参考样例：Mobiscroll React Timeline - Calendar timeline
https://demo.mobiscroll.com/react/timeline/calendar-timeline

原 `timeline` 是「小时条」结构：顶部轴把每天再切成 `hourEnd-hourStart` 个小时格（列 = 天 × 小时），
事件按压缩小时轴定位、不跨天连成横条。与 Mobiscroll 的 Calendar timeline（按天列的资源排程表）
结构完全不同，用户判定「完全不达标」。

## 目标

把 `timeline` 还原为 Mobiscroll Calendar timeline 的**日粒度资源排程**结构：

- 顶部轴：当月每一天作为列（双层表头：月份 + 周X/日号）
- 左侧：资源行
- 事件：跨多天的横条；同资源行内按天范围重叠的事件纵向分车道堆叠，行高自适应
- 今天列高亮、周末浅染

## 决策

- 时间轴粒度：**月 · 按天列**（Calendar timeline 默认形态）
- 取舍：**替换**旧「小时条」timeline（旧结构无外部依赖，直接移除）

## 影响范围

- 一级真源：
  - `packages/calendar/SPEC.md`（timeline 能力描述、TimelineOptions 字段注记）
  - `docs/agent-plan/plan.md` §4.5（解除「不为 timeline 新增 parity 目标」）
- 实现：
  - 新增 `controller/timeline-calendar.ts`（日粒度布局 + 车道分配）
  - 新增 `constants/timeline-const.ts`（布局常量 + 行高推导）
  - 重写 `components/view/Timeline.tsx`、`components/timeline/{TimelineHeader,TimelineGrid,TimelineEvent,ResourceList}.tsx`
  - 重写 `css/timeline/timeline.scss` 的 header / grid / event 段
  - 移除 `controller/timeline.controller.ts`（旧小时条布局，已无引用）
  - 重写 `stories/Calendar/Timeline.stories.tsx`（多日横条 + 重叠堆叠）

## 实现要点

- `getCalendarTimelineDays(renderDate)`：返回当月每一天
- `getCalendarTimelineRow(calendar, resourceId, days)`：过滤资源事件（含 `resourceIds` 共享）、
  计算起止天列索引（clamp + exceedLeft/Right）、按起始列排序后做车道分配（first-fit）
- 行高由 `getTimelineRowHeight(laneCount)` 推导，ResourceList 与 Grid 共用同一行高数组保持对齐
- 资源池回退：timeline 资源为空时回退 `scheduler.resources`（沿用既有行为）

## 验证

- `node scripts/check-docs.mjs` / `check-arch.mjs`
- `pnpm --filter swell-calendar exec tsc --noEmit`
- `pnpm --filter swell-calendar test`
- 新增 `controller/timeline-calendar.spec.ts`：天列生成、跨天索引、车道堆叠、越界 clamp、resourceIds 共享
- Storybook 实测（日历/视图/时间线）：当月 30 天列、多日横条（项目冲刺 5 天 / 客户驻场 8 天）、
  重叠车道堆叠、今天列高亮均正确

## 进度

- [x] 日粒度布局 controller + 常量 + 单测
- [x] 视图 / 组件 / 样式重写
- [x] 移除旧小时条 controller
- [x] stories 重写
- [x] SPEC / plan 同步
- [x] 拖拽交互：移动（含跨资源行）/ 左右 resize / 空白拖拽创建（跨天全天事件）/ 日期 tooltip
  - 新增 `controller/timeline-validation.ts`（务实子集校验 + 失败回调）
  - 新增 `controller/timeline-calendar.ts` 交互几何（dayIndex/resourceIndex from offset、computeMoved/Resized、buildCreatedAllday）
  - 新增 `hooks/Timeline/useTimelineEventDrag.ts`、`useTimelineCreate.ts`（复用 `useDrag` + `dnd` slice）
  - 新增 `components/timeline/TimelineInteractionContext.tsx`、`TimelineRow.tsx`、`TimelineDragTooltip.tsx`
  - 新增单测 `timeline-calendar.spec.ts`（几何 5 例）、`timeline-validation.spec.ts`（6 例）
  - Storybook 合成指针实测：move/create 拖拽幽灵横条 + 日期 tooltip 正确显示并在 mouseup 清除
- [x] ESC 取消（见 `docs/tasks/2026-06-08-drag-esc-cancel.md`：接通 useDrag 已声明却未连线的 onPressESCKey/cancelDrag 管线，timeline move/resize/create 拖拽接入清预览）
- [x] 修复 Storybook `Wrapper` seed-once 缺陷：`Layout/Wrapper.tsx` 原用模块级 `let start`
  只 seed 第一个挂载的 Wrapper 故事。Storybook manager 内切故事不整页刷新，标记停在 true，
  后续 Wrapper 故事（Day/Week/Month/Timeline）拿到未配置的新 store——timeline 表现为
  「暂无资源配置」。改为按实例 `useRef` 持有 store 并在创建时一次性 seed events/options
  （options 由 `createCalendarStore` 经 `createOptionsSlice` 归一化，等价旧 `setOptions`）。
  实测：manager 内 primary→with-events 无刷新切换后正常渲染 3 行 / 8 事件，无报错；
  week(42 事件/9 列) / day(9 事件/3 列) 直载正常
- [x] 精简 timeline stories：删除 `WithEvents`（多日横条与重叠）——它与 `Primary` 完全重复
  （同 `makeTimelineEvents()` 数据、同 `makeResources()`、同无回调 Wrapper，渲染一致且不可拖）。
  其「跨多天 + 重叠车道堆叠」职责并入 `Primary` 注释。最终 timeline 仅留两个故事：
  `基础视图`（静态渲染）+ `受控拖拽与 resize`（交互）
- [x] 受控拖拽演示故事：新增 `时间线--controlled-drag-resize`（`Timeline.stories.tsx`）。
  原 Primary / WithEvents 用 `Wrapper` 只 seed 事件、不接回调，timeline 又是宿主受控，
  导致直接拖拽「横条回弹、看似不能拖」。新故事用 `Calendar` + useState 持有 events、
  在 onEventUpdate/onEventCreate 写回，实测：move +2 列横条左移 160px、end-resize 横条加宽 160px、
  ESC 取消回弹，均正确
- [ ] 后续增量：overlap/invalid 校验、external/cross-instance DnD、shared events 跨资源行语义、视觉细节对照 demo 微调

## 风险与后续

- 旧 `timeline.{hourStart,hourEnd,rowHeight,colors,invalid,blockedTimes}` 字段保留在类型中但不再消费，
  避免破坏宿主；后续可在 MIGRATION 标记 deprecated
- 拖拽移动 / resize / 拖拽创建、跨天事件 tooltip、单元格密度（“+N more”）等交互为后续增量，
  本次先交付结构与静态渲染对齐
