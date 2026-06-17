## 背景

S2 的 day 视图目前只有通用 `Topbar`，缺少类似 Mobiscroll mobile week view 的“顶部一周日期切换条”；同时引擎 day/week 表头的当天标题高亮链路失效，导致之前要求保留的标题高亮没有生效。

参考交互：

- [Mobiscroll mobile week view](https://demo.mobiscroll.com/react/scheduler/mobile-week-view)

## 目标

- 给 `apps/swell-calendar-s2` 的 day 视图补一条可点击的一周日期导航
- 当前 day 视图切换日期时，顶部日期条同步高亮当前显示日
- 修复 day/week 表头的当天标题高亮，让“只高亮标题、不铺整块背景”重新生效

## 非目标

- 不改公开 API / props
- 不重做 S2 通用 `Topbar`
- 不调整事件卡片布局和拖拽交互

## 影响范围

- 代码：
  - `apps/swell-calendar-s2/src/App.tsx`
  - `apps/swell-calendar-s2/src/shell.tsx`
  - `apps/swell-calendar-s2/src/styles/app.css`
  - `packages/calendar/src/helpers/dayName.ts`
  - `packages/calendar/src/components/dayGridCommon/DayName.tsx`
  - `packages/calendar/src/Template/default.tsx`
  - `packages/calendar/src/css/dayGrid/dayNames.scss`
- 文档：新增本任务单
- 运行时行为：
  - day 视图新增顶部一周日期切换条
  - day/week 表头恢复当天标题高亮

## 现状

- day 视图没有 week strip，只能依赖顶栏左右翻页或 MiniCalendar 跳转日期
- `getDayNames()` 当前把所有列都标成 `isToday: true`
- 默认 `weekDayName` 模板没有消费 `isToday`，所以标题高亮链路实际上未闭环

## 方案

- 在 S2 shell 中新增 day-only 的 `DayWeekStrip`，按周一为起点展示 7 天，点击后调用现有 `goToDate`
- 高亮逻辑区分两类：
  - S2 day strip：高亮当前显示日（`currentDate`）
  - 引擎 day/week header：高亮真实今天（`new DayjsTZDate()`）
- 修复 `getDayNames()` 的 `isToday` 计算，并为 day name 模板/样式补上 today class

## 文档变更

- [x] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [x] `pnpm --filter swell-calendar exec tsc --noEmit`
- [x] `pnpm --filter swell-calendar-s2 exec tsc --noEmit`
- [x] `pnpm --filter swell-calendar test -- packages/calendar/src/helpers/dayName.spec.ts`
- [ ] 本地打开 S2 day 视图，核对顶部 week strip 与标题高亮

## 风险与回滚

- 风险：day strip 与现有 topbar / subbar 在窄屏下可能出现拥挤
- 回滚方式：撤回新增 day strip 和 day-name today 样式，恢复原有布局

## 实施结果

实现完成后补充：

- 实际改动：新增 S2 day 视图顶部 `DayWeekStrip`，支持按周展示 7 天并点击切换；修复 `getDayNames()` 的 `isToday` 计算；补上 day/week 标题 today class 与样式链路。
- 与原计划的偏差：无功能偏差；视觉验收改为代码审查 + 本地 dev server 启动检查。
- 验证结果：`check-docs`、`check-arch`、两侧 `tsc --noEmit`、`helpers/dayName.spec.ts` 均通过；本地 dev server 可启动。
- 剩余问题：当前环境缺少 Playwright 浏览器二进制，未完成自动截图式视觉验收。
