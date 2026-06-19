# 2026-06-19 移动端适配 capability epic

## 设计基线（真源）

本 epic 的**视觉与结构**对标 iOS 苹果日历，设计稿存于仓库：

| 设计稿 | 对应视图 |
|--------|----------|
| `docs/assets/day1.png` / `docs/assets/day2.png` | Day 单日视图 |
| `docs/assets/multi-day.png` | Multi-day 多日视图 |
| `docs/assets/agenda.png` | Agenda 列表视图 |
| `docs/assets/month.png` | Month 月视图 |

**触控交互**对标 Mobiscroll 移动端 day view：

> 参考样例：Mobiscroll React Scheduler Mobile Day View
> https://demo.mobiscroll.com/react/scheduler/mobile-day-view
> （只参考触控交互闭环：滑动切日、点空白创建、长按/拖拽移动与 resize；不复刻其弹窗与表单 UI。）

桌面 scheduler 行为基线仍沿用 `docs/agent-plan/plan.md`（Mobiscroll Desktop Week View）。**桌面零回归是每阶段硬验收项。**

## 背景

`scheduler` Phase 0–3、`month` 交互、S2 外壳、`range` / `maxEventStack` 等近期 backlog 均已收口归档。
宿主新方向：**B 档（connections / eventList）暂缓，优先做移动端适配，并把 `agenda` 视图纳入移动端方案**。

这是一次 **roadmap scope 变更**：移动端适配此前在 `plan.md` §2.3 标"本轮不对齐"、agenda 在 §3 矩阵标"未承诺"。本任务把两者一并提升为活跃 capability epic，按 docs-first 先落能力矩阵与分阶段计划，再实现。

## 设计稿结构拆解（对照 docs/assets）

四个视图共享一套**移动 chrome**，再各自有视图主体：

### 共享移动 chrome
- 顶部导航条：`< 月份` 返回、视图切换图标、搜索、`+` 新建
- **周条选择器**（day/multi-day）：7 列「日一二三四五六」+ 日期数字 + 农历/节日标签，选中日红圈、今日标记、可左右滑动切周
- 日期副标题：`周五 2026年6月19日 丙午年五月初五`
- **全天 lane**：胶囊样式 chip（带图标），跨天事件横条
- **当前时间红线 + 红色时间标签**

### 各视图主体
1. **Day（day1/day2）**：单列小时网格（可滚动）+ 全天 lane + now 线；时间事件为圆角色块，带 recurrence 角标。
2. **Multi-day（multi-day）**：2 列并排日列，左侧共享时间 gutter，每列独立全天 lane。
3. **Agenda（agenda）**：按天分组的列表 —— 日期分组头（含农历，右对齐）+ 事件行（左色条 + 标题 + 右侧时间，全天或 起/止 两行），今日分组头红色，跨天连续滚动。
4. **Month（month）**：紧凑格，每格日期数字（+农历）+ 堆叠胶囊 chip + `+N` 溢出；今日红圈、周末红、选中态。

## 现状盘点（实现真值，2026-06-19）

- **响应式**：`packages/calendar/src` 内**无任何断点 / `matchMedia` / viewport 感知**（仅 `stories/showcase.css` 一处 demo `@media`）。
- **触控输入**：交互层**纯鼠标**。`hooks/common/useDrag.ts` 绑定 `document` 的 `mousedown/move/up`；所有事件组件用 `onMouseDown`。触屏当前**无法 create/move/resize**。关键事实：`PointerEvent extends MouseEvent`，迁移主体为机械替换 + `setPointerCapture` + `touch-action:none`。
- **Agenda**：`ViewType = 'month'|'week'|'day'|'scheduler'|'timeline'`，**无 `agenda`**。需扩展 union + 新视图组件 + 分组控制器 + store/toolbar 接线。
- **可复用资产**：
  - `components/timeGrid/NowIndicatorLine.tsx` / `NowIndicatorLabel.tsx`（当前时间红线 ✓）
  - `components/dayGrid/AlldayRow.tsx`（全天 lane ✓，需移动胶囊样式）
  - `components/view/Day.tsx`（GridHeader + 全天 Panel + TimeGrid）、`Month.tsx`、`timeGrid/TimeGridView.tsx`
  - `time/view-range.ts`（连续日期窗口，multi-day 可复用）
- **chrome 归属**：顶部导航条属**宿主 shell（apps/swell-calendar-s2）**；周条/全天 lane/时间网格/now 线/月 chip/agenda 列表属**包内视图**。

## 目标与非目标

**目标**：把日历库扩展为"桌面 + 移动端可用"，移动端视觉对齐 iOS 苹果日历四视图（Day / Multi-day / Agenda / Month），触控交互对齐 Mobiscroll 移动 day view，且桌面零行为回归。

**非目标**：
- 不复刻 iOS / Mobiscroll 的弹窗 / 表单 / 内建 CRUD UI（沿用宿主受控）。
- 不引入手势/UI 框架，优先原生 Pointer Events + CSS。
- 本 epic 不做 connections / eventList / 虚拟化 / 打印 / a11y。
- 不改公开数据流（宿主受控不变），只新增可选配置、`agenda` 视图与触控输入通道。

## 能力矩阵（设计稿 × 现状 × 目标 × Phase）

| 能力 | 设计稿 | 现状 | Phase | 风险 |
|------|--------|------|-------|------|
| 断点 / viewport 原语 | — | ❌ 无 | M1 | 低 |
| Day 移动布局（窄列 + 全天胶囊 + now 线） | day1/day2 | 桌面 Day 已有结构 | M1 | 中 |
| Month 移动布局（紧凑 chip + `+N`） | month | 桌面 Month 已有 overflow | M1 | 中 |
| 移动 chrome（顶部导航条）@ S2 | 四稿共有 | ❌ 无 | M1 | 低 |
| 周条选择器（滑动切周 / 选中红圈） | day/multi-day | 部分在 S2 day-strip | M1 | 中 |
| **Agenda 视图（新）** | agenda | ❌ 无（ViewType 无 agenda） | M2 | 中 |
| Multi-day 移动视图（N 列日列） | multi-day | Day 仅单列 | M3 | 中 |
| 触控 create / move / resize | mobiscroll | ❌ 鼠标 only | M4 | 高 |
| 拖拽期阻止滚动（touch-action / capture） | — | n/a | M4 | 中 |
| 长按创建 / tap 目标 / 滑动切日 / 浮层移动适配 | 四稿 | ❌ | M5 | 中 |

> 标记规则同 `plan.md` §3.1：能力在对应 Phase 落地前，不得在 README / SPEC 写成"已支持"。

## 分阶段方案

### M0 设计基线 & scope（本次，纯文档）
- 落本文件（设计稿拆解 + 能力矩阵 + 分阶段）。
- 同步 scope：`plan.md` §2.3/§3、`SPEC.md`、backlog、README —— 移动端 + agenda 提升为活跃 epic。

### M1 响应式基线 + Day/Month 移动布局 + 移动 chrome
- `utils/`：无 React 的断点纯函数（`getViewportTier(width)`）。
- `hooks/common/`：`useContainerWidth` / `useViewportTier`（`ResizeObserver` 读根容器宽度）。
- `components/view/Day.tsx` / `Month.tsx` + CSS：按 tier 切换布局类名；全天 chip 胶囊化、month chip 紧凑化；桌面 tier 输出与现状完全一致的类名（零回归）。
- `apps/swell-calendar-s2`：移动 shell（顶部导航条 + 周条切周），复用包内视图。
- 不改控制器 / 数据流。

### M2 Agenda 视图（新视图）
- `types/options.type.ts`：`ViewType` 扩展 `'agenda'`，`EnabledViews` 同步。
- `controller/agenda.controller.ts`（新建）：按天分组、组内排序、全天/限时分行、空日处理（纯函数，可单测）。
- `components/view/Agenda.tsx`（新建）：分组头（日期 + 农历）+ 事件行（色条 + 标题 + 时间）；tap 行 → `onEventClick`（受控不变）。
- store / `Toolbar` / 视图路由接线；`SPEC.md` 新增 agenda 能力行 + Storybook `Agenda/Basic`。

### M3 Multi-day 移动视图
- 复用 `time/view-range.ts` + Day 链路，支持 N 列日列（默认 2）+ 共享 gutter + 每列全天 lane。
- 窄屏列宽自适应；与 `scheduler.range` / `workweek` 语义对齐，不新造日期窗口逻辑。

### M4 触控输入核心
- `hooks/common/useDrag.ts`：`mousedown/move/up` → `pointerdown/move/up`；`isLeftMouseButton` → `e.button===0 || e.pointerType!=='mouse'`；按下 `setPointerCapture`、过滤非主指针；保留"主键松开兜底自恢复"逻辑（改读 pointer 状态）。
- 事件组件 `onMouseDown` → `onPointerDown`（`TimeEvent` / `MonthEvent` / `TimelineEvent` / `TimeGridView` / `MonthGrid` / `TimelineRow` / `GridSelection`）。
- 拖拽容器加 `touch-action:none`；单测补 `PointerEvent` 派发，鼠标路径保持绿。

### M5 移动交互打磨
- 长按进入 create、tap 命中区放大、周条/视图滑动切换、移动端浮层底部/全宽适配。视宿主反馈再细化，必要时拆 task。

## 文档变更
- [x] 重写 `docs/tasks/2026-06-19-mobile-adaptation.md`（本文件）
- [x] `docs/agent-plan/plan.md`（§2.3 移动端、§3 矩阵 mobile + agenda）
- [x] `packages/calendar/SPEC.md`（移动端 + agenda 改为"规划中/活跃 epic"，不写"已支持"）
- [x] `docs/tasks/2026-06-18-post-s2-backlog.md`
- [x] `docs/README.md`
- [ ] M1–M5 实现时按 phase 回写 SPEC 能力行 + MIGRATION（如有新公开配置 / `agenda` 公开）

## 验证计划
- M0（纯文档）：`node scripts/check-docs.mjs`、`node scripts/check-arch.mjs`
- M1–M5（实现阶段）每阶段：
  - `corepack pnpm --filter swell-calendar exec tsc --noEmit`
  - 受影响视图 / 控制器 / hooks 单测 + 现有 week/day/month/scheduler/timeline Storybook 回归保持绿
  - 桌面零行为回归 + 与对应设计稿目视对照（粒度：结构 + 交互路径一致，不要求像素级）

## 风险与回滚
- M4 触碰核心交互链，鼠标路径回归是最大风险，必须保留 `useDrag` 兜底逻辑与单测。
- 断点纯函数放 `utils`（不依赖 React/DOM），DOM 读取只在 `hooks/components`，避免破坏分层。
- Agenda 扩展 `ViewType` union 属公开 API 变更，须 docs-first：先改 SPEC 与矩阵再实现。
- 回滚：各阶段独立提交；M1 回退布局类名、M2 回退 agenda 视图与 union、M4 回退 pointer 迁移恢复 `onMouseDown`。

## 实施结果
> 按 phase 推进，逐段回填。
- M0（设计基线 & scope）：完成；scope 变更已同步 plan/SPEC/backlog/README，agenda 纳入 epic。
- M1：
- M2：
- M3：
- M4：
- M5：
