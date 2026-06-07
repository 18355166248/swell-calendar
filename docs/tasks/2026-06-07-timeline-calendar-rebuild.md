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
- [ ] 后续视觉细节对照 demo 截图微调（hover/拖拽创建/“+N more”等交互为后续增量）

## 风险与后续

- 旧 `timeline.{hourStart,hourEnd,rowHeight,colors,invalid,blockedTimes}` 字段保留在类型中但不再消费，
  避免破坏宿主；后续可在 MIGRATION 标记 deprecated
- 拖拽移动 / resize / 拖拽创建、跨天事件 tooltip、单元格密度（“+N more”）等交互为后续增量，
  本次先交付结构与静态渲染对齐
