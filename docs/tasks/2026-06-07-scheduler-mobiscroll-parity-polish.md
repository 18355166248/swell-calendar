# 2026-06-07 scheduler mobiscroll parity polish

参考样例：Mobiscroll React Scheduler Desktop Week View
https://demo.mobiscroll.com/react/scheduler/desktop-week-view

## 背景

`scheduler` 主线（phase 0-3）已闭环。对照参考样例逐项截图核对后，仍有若干“高级体验 / 视觉对齐”细节与参考样例存在差异。本任务收口其中工作量小、对齐收益直接的几项，不新增主能力，不扩 scope。

经实测（Storybook + 源码核对）确认的差异，按优先级：

- **P1 当前时间指示线**：`TimeColumn` 仅在左侧时间轴渲染 `now-indicator-label`，没有横跨日期列的当前时间线（scheduler 今日列 `nowLine:0`）。day / week 共享同一 `TimeGridView`，同样只有 label 没有线。
- **P4 all-day lane 左侧 gutter 标签**：scheduler 顶部 all-day lane 没有与时间轴 gutter 对齐的“全天”标签格。
- **P2 timezone 完整化**：仅单一 `displayTimezone`，缺少第二时区轴 / 多时区列与全天事件跨时区边界处理。

## 目标

- 按 P1 → P4 → P2 顺序收口上述差异
- 共享底座（`TimeGridView`）改动不得让 `Day` / `Week` / `Timeline` 退化
- 行为对齐而非像素级一致，不复刻参考样例内建弹窗

## 非目标

- 不新增 scheduler 主交互能力
- 不引入 agenda、移动端、connections、eventList、虚拟化、打印、a11y
- 不追求 Mobiscroll API 命名兼容

## 范围与落点

### P1 当前时间指示线

- 新建 `components/timeGrid/NowIndicatorLine.tsx`：在列区域按 `nowIndicatorState.top%` 渲染横线 + 左侧圆点
- `components/timeGrid/TimeGridView.tsx`：在 `time-columns` 容器内渲染该线（`pointer-events:none`），复用已有 `nowIndicatorState`
- `css/timeGrid/timeColumn.scss`：新增 `.now-indicator-line` / `.now-indicator-bullet`
- 颜色复用既有 `week.nowIndicatorLabel.color`，保持设计系统一致（不引入新主题字段）

### P4 all-day lane 左侧 gutter 标签

- `components/scheduler/SchedulerAllDayLane.tsx` 增加与时间轴 gutter 等宽的左侧“全天”标签格

### P2 timezone 完整化（本轮范围：仅第二时区轴）

经确认，P2 本轮只做“第二时区轴”，“全天事件跨时区边界”作为后续 follow-up（全天事件通常时区无关，语义需另行明确）。

- `types/options.type.ts`：新增 `SchedulerTimezone` + `SchedulerOptions.timezones`
- `components/timeGrid/TimeColumn.tsx`：支持渲染 `1 + N` 条时区刻度轴，主轴紧邻网格、副轴按配置顺序向左；副轴刻度由 `convertTimezone(主时区 → 副时区)` 换算；`isPrimary`（模板 HH:mm vs HH a）与 `showNowLabel`（当前时间标签仅主轴）解耦，避免改变既有 week/day 刻度格式
- `components/timeGrid/TimeGridView.tsx`：scheduler 视图按轴数计算加宽 gutter，并用于 `time-columns` 左偏移
- `components/view/Scheduler.tsx`：同口径计算 gutter 宽度并下发 header / all-day lane，保证三者对齐
- `css/timeGrid/timeColumn.scss`：新增 `.time-grid-timezone-label`
- 主时区源：`displayTimezone` 缺省时回退浏览器 `Intl` 本地时区，保证副轴换算始终可定义

## 验证方式

- `node scripts/check-docs.mjs`
- `node scripts/check-arch.mjs`
- `pnpm --filter swell-calendar exec tsc --noEmit`
- `pnpm --filter swell-calendar test`
- Storybook 回归：`Day` / `Week` / `Timeline` / `Scheduler/*` 保持绿

## 风险

- `TimeGridView` 为共享组件，now-line 改动需同时核对 week / day / timeline 不退化
- now-line 仅在“今日落在可见范围”时渲染，需保证非今日范围时不出现残留

## 本次实现

### P1 当前时间指示线（已落地）

- 新建 `components/timeGrid/NowIndicatorLine.tsx`，在 `time-columns` 容器内按 `nowIndicatorState.top%` 渲染横线 + 左侧圆点，`pointer-events:none`
- `TimeGridView.tsx` 复用已有 `nowIndicatorState`，仅在 `showNowIndicator && 今日在可见范围` 时渲染
- 颜色复用 `week.nowIndicatorLabel.color`（indigo），与既有 gutter label 一致
- 共享底座改动：week / day / scheduler 同步获得当前时间线；非今日范围不渲染（实测今日列 `lineTop=88%` 对应 18:35）

### P4 all-day gutter 标签（已落地）

- `SchedulerAllDayLane.tsx` 改为 flex 布局：左侧 gutter 等宽“全天”标签格 + 右侧全天事件区
- 实测：标签宽 72px = gutter 宽，内容 left=72px 与首个日期列对齐

## 进度

- [x] P1 当前时间指示线（tsc / 255 tests / docs / arch 全绿，Storybook 实测通过）
- [x] P4 all-day gutter 标签（实测对齐通过）
- [x] P2 第二时区轴（实测：NY 00:00 → LON 05:00 → TYO 13:00，gutter 72→216px，day/week 单轴不退化）
- [x] P5 hover / focus 视觉打磨（纯 CSS，实测规则编译/前缀正确）
- [ ] follow-up：全天事件跨时区边界（后置，需先明确语义）

### P5 hover / focus 视觉打磨（已落地，纯 CSS）

- `css/events/time.scss`：`.event-time:hover` 提亮 + 投影、`:focus-visible` 焦点环
- `css/dayGrid/allday.scss`：`.allday-event` 同款 hover / focus 反馈
- `css/timeGrid/timeColumn.scss`：`.column:hover` 用 inset 阴影铺满高亮当前列（绘制于背景之上、事件之下，不污染事件卡片颜色，规避 inline backgroundColor 优先级问题）
- 实测：四条规则均以 `swell-calendar-` 前缀正确编译进运行时样式表，目标元素存在；`:hover` 伪类无法脚本触发，故以样式表规则核对为准

## 本次验证结果

- `node scripts/check-docs.mjs`：通过（11 个变更文件）
- `node scripts/check-arch.mjs`：通过（171 文件无分层违规）
- `tsc --noEmit`：通过
- `vitest run`：26 文件 / 255 用例全绿
- Storybook 实测：
  - 基础视图：单轴 gutter 72px，当前时间线横跨列（18:35 对应 88%）
  - 全天与跨天事件：左侧“全天”标签宽 72px 与 gutter 对齐，内容 left=72 对齐首列
  - 时区渲染：TYO/LON/NY 三轴，副轴换算正确，header/all-day 同步加宽对齐
  - 周视图：单轴、HH:mm 格式不变，新增当前时间线（增强非回归）
