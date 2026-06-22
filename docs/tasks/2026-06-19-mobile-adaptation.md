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

## 目标 → 阶段对齐（验收口径）

> 目标 =「支持移动端 + 还原设计稿」。**关键认知：M1 完成 ≠ 目标达成。**
> 目标拆成两条线，分别由不同 Phase 兜底：
> - **还原设计稿 = 4 视图**（Day / Multi-day / Agenda / Month）。其中 Multi-day、Agenda 是引擎**不存在的视图**，无法只靠样式还原，必须先建能力（M3 / M2）。M1 只还原 Day + Month 两视图。
> - **支持移动端 = 可看 + 可用**。M1–M3 给「可看 / 可切 / 可点详情」；**触屏拖拽创建 / 移动 / resize 在 M4**。M4 未完成前移动端是「只读浏览」，非产品级可用。M4 是全 epic 最高风险段（碰核心 `useDrag`）。

| 目标分解 | 兜底 Phase | 达成判据（验收口径） |
|----------|-----------|----------------------|
| 响应式基线（断点 / tier / 容器宽度） | M1 | 移动 tier 注入修饰类；桌面零回归 |
| Day / Month 移动视觉还原 | M1 | 与 remix 稿目视一致（结构+交互路径），桌面零回归 |
| 移动 chrome（导航 / segmented / 周条 / 农历 / 底部 sheet） | M1（宿主 s2） | 四要素可用；农历/节气经 `chinese-days` 注入 |
| 还原 **Agenda / 列表** 视图 | M2 | `ViewType='agenda'` 可切换、可点详情；SPEC 同步 |
| 还原 **Multi-day / 多日** 视图 | M3 | N 列日列可切换；与 `view-range` 语义对齐 |
| 移动端**可用**（触控 create/move/resize） | **M4** | 触屏可创建/移动/resize；鼠标路径零回归 |
| 移动交互打磨 | M5 | 长按创建 / 命中区 / 滑动切换 / 浮层适配 |

**推进顺序固定**：M1 →（M2 与 M3 可并行，二者互不依赖）→ M4 → M5。
其中 M2 / M4 改动公开 API（`agenda` union / 触控行为），**docs-first**：先改 `SPEC.md` 与能力矩阵再实现。

## 能力矩阵（设计稿 × 现状 × 目标 × Phase）

| 能力 | 设计稿 | 现状 | Phase | 风险 |
|------|--------|------|-------|------|
| 断点 / viewport 原语 | — | ❌ 无 | M1 | 低 |
| Day 移动布局（窄列 + 全天胶囊 + now 线） | day1/day2 | 桌面 Day 已有结构 | M1 | 中 |
| Month 移动布局（紧凑 chip + `+N`） | month | 桌面 Month 已有 overflow | M1 | 中 |
| 移动 chrome（顶部导航条）@ S2 | 四稿共有 | ❌ 无 | M1 | 低 |
| 周条选择器（滑动切周 / 选中红圈） | day/multi-day | 部分在 S2 day-strip | M1 | 中 |
| 农历 / 节气标签（宿主注入，`chinese-days`） | day/multi-day/month/agenda | ✅ PoC 落地（S2 周条） | M1 | 低 |
| **Agenda 视图（新）** | agenda | ❌ 无（ViewType 无 agenda） | M2 | 中 |
| Multi-day 移动视图（N 列日列） | multi-day | ✅ M3 首版已落地 | M3 | 中 |
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
- `apps/swell-calendar-s2`：移动 shell（顶部导航条 + segmented「日/多日/月/列表」+ 周条切周 + 事件底部 sheet），复用包内视图与 `lunarLabelOf`。
- 农历不改引擎：月视图由宿主覆盖 `monthGridHeader` 模板注入日期+农历；day/多日的农历副标题是宿主 chrome。
- 不改控制器 / 数据流。
- **进度**：原语层 + Day/Month tier CSS + 农历 PoC 已落地；剩 Day 窄列/gutter、now 时间旗、卡片 tier、月格细节（`responsive.scss`）+ s2 移动 shell。
- **验收**：移动 375px 出修饰类、Day/Month 与 remix 稿目视一致、农历/节气正确（节气优先、绿色）、segmented 四视图可切（多日/列表本阶段可降级为占位）、桌面 1280px 零回归。

### M2 Agenda 视图（新视图）
- `types/options.type.ts`：`ViewType` 扩展 `'agenda'`，`EnabledViews` 同步。
- `controller/agenda.controller.ts`（新建）：按天分组、组内排序、全天/限时分行、空日处理（纯函数，可单测）。
- `components/view/Agenda.tsx`（新建）：分组头（日期 + 农历）+ 事件行（色条 + 标题 + 时间）；tap 行 → `onEventClick`（受控不变）。
- store / `Toolbar` / 视图路由接线；`SPEC.md` 新增 agenda 能力行 + Storybook `Agenda/Basic`。
- **验收**：`agenda` 可切换并按天分组渲染、tap 行触发 `onEventClick`、与 remix 列表稿目视一致；`agenda.controller` 单测绿；SPEC 能力行同步；桌面零回归。

### M3 Multi-day 移动视图
- `types/options.type.ts`：`ViewType` 扩展 `'multiDay'`，新增 `options.multiDay.range`（默认 2）。
- 复用 `time/view-range.ts` + Week 时间网格链路，支持 N 列日列（默认 2）+ 共享 gutter + 每列全天 lane。
- 窄屏列宽自适应；与 `scheduler.range` / `workweek` 语义对齐，不新造日期窗口逻辑。
- **验收**：多日（默认 2 列）可切换、共享 gutter + 每列全天 lane、与 remix 多日稿目视一致；与 `view-range` 语义对齐无新造窗口逻辑；桌面零回归。

### M4 触控输入核心
- `hooks/common/useDrag.ts`：`mousedown/move/up` → `pointerdown/move/up`；`isLeftMouseButton` → `e.button===0 || e.pointerType!=='mouse'`；按下 `setPointerCapture`、过滤非主指针；保留"主键松开兜底自恢复"逻辑（改读 pointer 状态）。
- 事件组件 `onMouseDown` → `onPointerDown`（`TimeEvent` / `MonthEvent` / `TimelineEvent` / `TimeGridView` / `MonthGrid` / `TimelineRow` / `GridSelection`）。
- 拖拽容器加 `touch-action:none`；单测补 `PointerEvent` 派发，鼠标路径保持绿。
- **验收**：触屏可创建/移动/resize（`PointerEvent` 单测覆盖）、拖拽期不滚动；**鼠标路径全单测零回归**（最高风险门槛）；SPEC 触控行为行 + MIGRATION 同步。

### M5 移动交互打磨
- 长按进入 create、tap 命中区放大、周条/视图滑动切换、移动端浮层底部/全宽适配。视宿主反馈再细化，必要时拆 task。
- **验收**：长按创建 / 命中区 / 滑动切换 / 浮层移动适配按宿主反馈逐项验收；无回归。

## 文档变更
- [x] 重写 `docs/tasks/2026-06-19-mobile-adaptation.md`（本文件）
- [x] `docs/agent-plan/plan.md`（§2.3 移动端、§3 矩阵 mobile + agenda）
- [x] `packages/calendar/SPEC.md`（移动端 + agenda 改为"规划中/活跃 epic"，不写"已支持"）
- [x] `docs/tasks/2026-06-18-post-s2-backlog.md`
- [x] `docs/README.md`
- [x] M1：回写 `SPEC.md`（移动端能力行从"尚未落地"改为"M1 响应式基线已落地，M2–M5 规划中"，列明已落地/未落地边界）。**MIGRATION 无需变更**：viewport 原语 / `useViewportTier` / `useContainerWidth` / `getTierClassName` / `cls` 均未在 `src/index.ts` 公开导出，M1 为纯内部增量 + 桌面零回归，无对外 API / 配置变化。
- [ ] M2–M5 实现时按 phase 回写 SPEC 能力行 + MIGRATION（`agenda` 公开 / 新公开配置 / 触控行为变更时）

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
- M1：**响应式原语层 + Day/Month tier 接入已落地（桌面零回归）**。
  - 原语（无 React / DOM 的纯逻辑）：
    - `types/viewport.type.ts`：`ViewportTier = 'mobile' | 'tablet' | 'desktop'`。
    - `constants/viewport.const.ts`：断点 `TABLET_MIN_WIDTH=768` / `DESKTOP_MIN_WIDTH=1024`（下界包含、上界排除）。
    - `utils/viewport.ts`：`getViewportTier(width)`（非有限宽度兜底 `mobile`）+ `getTierClassName(base, tier)`（桌面仅返回基类，其余追加 `${base}--${tier}`）；单测 `utils/viewport.spec.ts`（6 项）。
  - DOM 读取集中在 hooks 层：
    - `hooks/common/useContainerWidth.ts`：`ResizeObserver` 观测根容器宽度，初始默认桌面下界 → SSR / 无 RO / 首帧落桌面档，保证零回归。
    - `hooks/common/useViewportTier.ts`：组合上面两者，返回 `[tier, setRef]`。
  - 接入：`Layout` 新增可选 `rootRef`（与内部测量 ref 合并）；`view/Day.tsx`、`view/Month.tsx` 用 `useViewportTier` 把 ref 挂到 `Layout` 根容器，并以 `getTierClassName` 切根类名。桌面 tier 输出类名与现状完全一致。
  - 验证：`tsc --noEmit` 通过；`viewport.spec`（6）+ `Month.spec`（3）绿；`check-arch`（198 文件无违规）/ `check-docs` 通过。
  - Storybook 右侧预览验证（日视图 story）：移动 375px → 根类 `swell-calendar-day-view--mobile`；桌面 1280px → 仅 `swell-calendar-day-view`（零回归）。期间发现并修复两处：
    - `helpers/css.ts` `cls` 对含空格的单字符串只前缀首个 token，导致修饰类拿不到 `swell-calendar-` 前缀，与基类不一致；改为按空格拆分逐个加前缀，补 `helpers/css.spec.ts`。
    - `useContainerWidth` 在容器 `clientWidth` 为 0（首帧/隐藏 tab/刚挂载）时误降级 mobile；改为忽略 ≤0 宽度，保留初始桌面兜底，强化零回归。
  - **Day 移动样式首批已落地**（`css/responsive.scss`，`index.scss` @use 接入）：
    - 事件卡片圆角是组件内联 style（postcss 纯 CSS 盖不住），故把 `TimeEvent` / `AlldayEvent` 的 `borderRadius` 改读 CSS 变量（桌面 fallback 保原值 2px/3px → 零回归），在 `.day-view--mobile` 作用域内重定义变量值：限时事件 8px、全天事件胶囊化 999px。
    - 非内联样式直接覆盖：限时事件移动端实心（`opacity:1`）、内容区字号/内边距、全天标签左对齐。
    - 预览验证（日视图 story）：移动 375 → `event-time` 圆角 8px / opacity 1；桌面 1280（reload）→ 圆角回 2px / opacity 0.9、根类无修饰（零回归）。
  - **Month 移动紧凑已落地**（`css/responsive.scss` `.month-view--mobile`）：
    - 同 tier 化模式：`MonthEvent` 的 `borderRadius` / `fontSize` 改读 CSS 变量（桌面 fallback 3px/12px → 零回归），移动作用域内紧凑为 4px/11px。
    - 非内联样式直接覆盖：日期圆圈 24→22px、字号 13→12px；`+N` 溢出标记 11→10px。
    - 预览验证（月视图 story）：移动 375 → chip 11px/4px、日期圈 22px/12px；桌面 1280（reload）→ 12px/3px、24px/13px、根类无修饰（零回归）。
  - **样式职责边界（2026-06-22 定，并入 remix 设计稿）**：
    本 epic 视觉基线更新为 `claude-design/mobile/swellcalendar-remix`（比 `docs/assets/*.png` 更完整）。
    「样式」按归属一分为二，不可整体下沉到宿主：
    - **能力**（agenda / multi-day / 触控 / viewport）：`packages/calendar`，docs-first 新增视图/控制器/钩子。
    - **视图主体样式**（时间轴 / 月格 / 列表 / 多日列的布局）：`packages/calendar`，沿用 `css/responsive.scss` + `--mobile` tier 修饰类 + CSS 变量。
      理由：引擎 DOM 经 postcss 前缀封装，且事件卡有 inline style，宿主外部 CSS 盖不住（M1 已为此把圆角改读 CSS 变量）。
    - **颜色 / token**（强调色 / 边框 / now 线色…）：宿主 s2 通过 `data-theme/accent` + `theme` prop 驱动，引擎按 `var(--…)` 消费，无需改包 CSS。
    - **Chrome**（顶部导航 / segmented / 周条 / 事件底部 sheet）：纯宿主 `apps/swell-calendar-s2`，结构 + 样式都在宿主。
    - **农历 / 节气 / 休班**：宿主 s2 计算后注入 chrome，引擎不内建农历概念。
  - **农历库选型（2026-06-22 定）**：`chinese-days`（MIT、零依赖、~9.5KB gzip）。
    对比：`lunisolar` 13.7KB 但 GPL-3.0（产品不可用，排除）；`lunar-javascript/typescript` MIT 但 ~111KB（过大，排除）。
    `chinese-days` 覆盖农历日（`getLunarDate().lunarDayCN`）+ 节气（`getSolarTerms`）+ 后续可扩休/班（`isWorkday`/`getDayDetail`）与节日。
  - **农历 PoC 已落地并验证（s2）**：`apps/swell-calendar-s2/src/lunar.ts`（`lunarLabelOf(date)` 节气优先于农历日）；
    `shell.tsx` 的 `DayWeekStrip` 每日 chip 追加农历/节气标签，节气日加绿色 `is-term` 样式（读 `--cat-green-text`）。
    预览验证（s2-app:5180 日视图）：周条显示「初一…初六」，2026-06-21 显示绿色「夏至」；选中日走 accent 覆盖；`tsc --noEmit` 通过、无 console 报错。
  - **移动 shell 首批已落地（s2，2026-06-22）**：
    - `useIsMobile.ts`：matchMedia `(max-width:767px)`（= 包内 `TABLET_MIN_WIDTH-1`）+ window.resize 兜底；SSR/无 matchMedia 落桌面，零回归。
    - `shell.tsx`：`MobileTopBar`（返回月 + segmented「日/多日/月/列表」+ 搜索）、`MobilePlaceholder`（历史占位组件，M2/M3 后已不走主路径）。
    - `App.tsx`：抽出 `calendarNode` + `overlays` 供桌面/移动共用（引擎接线单一真源）；新增 `engineView`（移动只 day/month 有真实引擎视图）统一驱动 `setView` 与 `calendarOptions.defaultView`，修掉「移动选日却显示路由 scheduler」的串视图问题；移动分支渲染 `app--mobile` 外壳（无 sidebar/desktop topbar）。
    - `app.css`：`.app--mobile`/`.m-top`/`.m-seg`/`.canvas--mobile`/`.m-placeholder` 等移动 chrome 样式（全部读 s2 token）。
    - 预览验证（s2-app:5180）：375px → 移动外壳；日=单日时间轴 + 周条农历（初八…）；月=紧凑格 + `+N` + 今日圈、返回显示「日历」；M1 当时多日/列表为占位（后续 M2/M3 已分别接入 agenda / multiDay）；切回日恢复。1280px（reload）→ 桌面 sidebar+topbar 原样（零回归）；`tsc --noEmit` 通过、无 console 报错。
  - **now「红色时间旗」已落地（包内 `responsive.scss`，2026-06-22）**：
    - now 指示器颜色经主题以**内联 style** 注入（line/bullet/label 同色，s2 为 accent 绿）。外部 `!important` 可压过「非 important 的内联样式」，故在 `.day-view--mobile` 作用域内把 `now-indicator-line-bar`/`-bullet`/`-label` 重定向到 `--now-line`（红，宿主 token，亮/暗各一份，缺省回退 oklch 红），并把 label 做成白字红底胶囊。
    - 预览验证：375px → now 红线 + 红 bullet(10px) + 白字红底「12:07」旗；1280px（reload）→ now-label 仍透明底/accent 色/无圆角（**桌面零回归**）；`day-view--mobile` tier 类在 s2 正常注入；包单测 374/374 绿、无 console 报错。
  - **重要发现（修正前述模板注入设想）**：月视图实际由 `components/month/MonthGrid.tsx` 渲染（直接出 `month-cell-date` 数字），此前**未接线既有 `monthGridHeader` 模板**（该模板仅旧 `dayGridMonth/CellHeader` 使用）。
    故「宿主覆盖 `monthGridHeader` 注入月农历」在当前引擎**无效**；后续只需把 MonthGrid 接入既有公开 slot，不需要新增模板 API。
  - **移动周条样式已贴近 remix（s2，2026-06-22）**：
    - `DayWeekStrip` 结构调整：数字 + 农历包进 `day-week-chip__blob`。桌面下 blob 为透明壳（base 样式仅纵向堆叠，间距等同原 chip gap，视觉零变化）；移动端 `.app--mobile` 作用域内把 blob 样式化为 42px 圆，数字+农历同框，选中（primary）整圈实心、今日选中用 accent 实心、今日未选数字用 accent 色；移动端隐藏左侧月份 pill（月份已在顶部导航），7 列占满。
    - 预览验证：375px → 7 列周条、数字+农历同圈、今日(22 初八)accent 实心圈；1280px（reload）→ 月份 pill「6月」在、日期仍 32px 圆 + 农历在下、blob 为透明壳（**桌面零回归**）；`tsc` 通过、无 console 报错。
  - **事件详情底部 sheet 已落地（s2，2026-06-22）**：
    - 仍复用引擎 `onEventClick` → `pick` → `toPickEvent` 数据链路；桌面继续渲染锚定式 `Popover`，移动端同一 `pick.ev` 改渲染 `MobileEventSheet`，不改 `swell-calendar` 公开 API。
    - sheet 由宿主 `apps/swell-calendar-s2` 承担：底部固定、带安全区、顶部 grabber、标题/时间/地点/描述/参与人/删除/编辑；关闭、编辑、删除均复用原回调。
    - 预期验证：375px 点击事件 → 底部 sheet；点遮罩关闭、编辑进入原编辑对话框、删除关闭并落库；1280px 仍为桌面 Popover（零回归）。
  - **Day 移动 gutter 收窄已落地（包内，2026-06-22）**：
    - `Day.tsx` 按 viewport tier 把移动端时间 gutter 从主题默认 72px 收窄为 48px，并统一传给 `GridHeader` / `AlldayRow` / `TimeGrid`，保证表头、全天行、时间网格三段左侧边界对齐。
    - `TimeGrid` 新增内部 `gutterWidthOverride` prop，仅供包内响应式布局使用；未从 `src/index.ts` 导出，不构成公开 API。
    - 预期验证：375px 单日视图内容列变宽、时间轴仍可读；1280px 仍使用主题默认 gutter（桌面零回归）。
  - **Day 移动事件卡 tier 已落地（包内，2026-06-22）**：
    - `TimeEvent` 在默认内联样式外同步暴露 `--swell-event-bg/border/text/drag-bg`，供响应式 CSS 复用事件原始配色；默认桌面样式仍走原内联属性。
    - `responsive.scss` 在 `.day-view--mobile` 下按宿主 `data-card` 支持 `soft`（轻卡片）、`bar`（左色条）、`solid`（实心色块）三档；当前 s2 默认仍为 `soft`。
    - 移动窄屏 overlap 兜底：移动端不改时间冲突布局算法（仍按并列列宽避免真实重叠），但收紧 `.event-time-content` padding，并对 title/sub 两行强制 `min-width:0 + overflow:hidden + ellipsis`，防止 2/3 列并排时文字溢出到邻卡造成遮挡。
    - time-grid 真实遮挡修复：`setRenderInfoOfUIModels` 默认排序从无效的 numeric sorter 改为事件语义排序（开始时间升序、同起点长事件优先）。否则宿主事件乱序时，同一冲突簇会被拆成多个 collision group，后渲染 group 从 left=0 重新开始，短卡会覆盖长卡。新增同起点长短事件乱序单测锁定该行为。
    - 预期验证：375px 默认 `soft` 轻卡片命中；临时切换 `data-card=bar/solid` 时卡片视觉变化；多事件并排时卡片本体不重叠、文本只在卡内省略；1280px 不带 mobile 修饰类，桌面零回归。
  - **Month 移动月格细节已落地（包内，2026-06-22）**：
    - `MonthGrid` 内部补 `month-cell-weekend` class（仅供样式，不改公开 API），移动端周末日期走 now 红色；今日仍由 accent 实心圈承载。
    - `responsive.scss` 在 `.month-view--mobile` 下弱化格线、非本月背景；今日不再给整格铺底色，仅保留日期 accent 圆点；月事件 chip 胶囊化、取消透明、`+N` 溢出标记加粗收紧。
    - 预期验证：375px 月视图格线更轻、周末红、今日仅日期 accent 圈、chip 胶囊；1280px 桌面月视图不出现整格 today 背景。
  - **Month remix 视觉收口首轮已落地（包内 + s2，2026-06-22）**：
    - s2 移动月视图补大月份标题（`m-month-title`）与固定星期行（`m-month-dow`），贴近 remix 顶部层级；二者属于移动 chrome，不参与月格滚动；日/月/列表 segmented 仍保持当前真实切换。
    - 移动月视图隐藏引擎内部 `month-day-names`，桌面仍使用包内 GridHeader，避免为了移动 chrome 改公开 API。
    - 包内 `.month-view--mobile` 对齐 remix mobile 参数：去竖向格线、只保留浅横向周分割；非本月格不再铺灰底；日期+农历使用 38px blob，今日只填充 blob；事件 chip 收敛为 9.5px / 14px / 4px radius，`+N` 居中小字。
    - `Month.tsx` mobile 日期头 / 事件步进同步为 44px / 16px，保证放大日期 blob 后事件层仍不压日期、不把 `+N` 挤出格底。
    - 预期验证：375–430px 月视图更接近 remix：大月份标题、弱化格线、日期 blob、紧凑 chip；桌面不受 mobile 修饰类影响。
  - **Month remix 视觉收口二轮已落地（2026-06-22）**：
    - 目标：继续缩小当前移动月视图与 remix 的差距，范围限定为结构清理与样式收口，不新增公开 API。
    - 收口项：移动月视图仅显示 `+N` 溢出标记（桌面仍保留 `+N 更多`）；移动端隐藏月事件 resize handle，避免把手探出左边界造成横向溢出；s2 为移动月视图日历实例补明确 class，后续移动专属覆盖不依赖宽选择器。
    - 验证：375 / 412 / 430 宽度关键布局指标通过；内部星期行隐藏、包内 toolbar 高度为 0、resize handle 不可见、`更多` 文案在移动端隐藏、今日整格背景透明且日期头不被事件层遮挡。默认浏览器视口恢复后 `documentElement.scrollWidth === clientWidth`，无页面级横向溢出。
  - **月视图农历接入已落地（2026-06-22）**：
    - docs-first：`SPEC.md` 明确 `monthGridHeader` 是当前 Month 日期格头部 slot，参数含 `date/day/month/ymd/isToday/isOtherMonth/hiddenEventCount`。
    - MonthGrid 日期头走既有 `Template`；s2 覆盖 `monthGridHeader`，用 `lunarLabelOf` 注入日期 + 农历/节气。桌面隐藏农历保持单数字，移动端显示第二行；节气走绿色。
    - 预期验证：375px 月视图日期格显示数字+农历/节气；1280px 仍只显示日期数字，桌面零回归。
  - **月视图矮屏防挤压已落地（包内，2026-06-22）**：
    - `.month-view--mobile` 增加 `min-height: 680px`，在宽高比异常/高度偏矮时保持 6 行月格的最低可读高度；宿主移动画布已有 `overflow:auto`，因此改为纵向滚动而非继续压缩 chip。
    - 预期验证：约 539×632 视口下月事件 chip 不再被压扁；1280px 桌面无 mobile 修饰类，不受影响。
  - **月视图日期头遮挡修复已落地（包内，2026-06-22）**：
    - `MonthGrid` 支持内部 `cellHeaderHeight/cellEventHeight` 参数；`Month` 在 mobile tier 把日期头高度同步为 30px、事件步进同步为 20px，事件层、ghost、`+N` 均按同一组参数起算。
    - 修复移动端“数字+农历”日期头被首条事件 chip 覆盖的问题；同时避免 375×667 等矮屏下 `+N 更多` 被三条 chip 挤出单元格底部。桌面仍走默认 28px header / 22px event。
  - **M1 剩余（下一小步）**：
    - 多日连接带（随 M3 多日视图）。
    - 实时切换（旋屏/改窗）依赖 `useIsMobile` 的 resize 兜底；CDP 模拟器下 matchMedia change 不稳定，真机/真浏览器正常。
- M2：**Agenda / 列表视图首版已落地（2026-06-22）**。
  - docs-first：`SPEC.md` 已把 `agenda` 纳入 `ViewType` / `views` 配置示例，能力边界定义为「按天分组的只读事件列表，点击行触发既有 `onEventClick`」。
  - 本阶段范围：
    - 包内新增 `agenda.controller.ts` 纯函数：从 `renderDate` 开始生成连续日期窗口，按天归集命中事件，组内排序为全天优先、开始时间升序、同起点长事件优先。
    - 包内新增 `components/view/Agenda.tsx`：日期分组头 + 事件行；事件行只负责展示和点击，不承担数据变更。
    - `ViewType` / `Toolbar` / `CalendarApp` / navigation 接线支持 `'agenda'`。
    - s2 移动端 segmented「列表」切到真实 `agenda` 引擎视图，点击事件复用已落地的移动底部 sheet。
  - 非目标：本阶段不做虚拟化、搜索过滤增强、长按创建、触控拖拽、内建编辑表单；这些留在后续 M4/M5 或独立能力。
  - 验证：
    - `agenda.controller.spec.ts` 覆盖连续日期窗口、空日保留/隐藏、全天优先排序、同起点长事件优先、跨天延续标记。
    - 包内 `Toolbar` / `CalendarApp` / `navigate()` 已接入 `'agenda'`；`options.agenda.range` 默认 14 天。
    - s2 移动端 segmented「列表」不再显示占位；浏览器验证为 14 个日期分组、47 条事件，点击首条事件打开移动底部 sheet。
    - `MIGRATION.md` 已记录 `ViewType` 扩展的宿主侧注意事项。
  - **Agenda remix 视觉收口已落地（2026-06-22）**：
    - 差距：首版更像彩色卡片流，而参考稿是 iOS 议程列表；缺右侧农历、全天星标行、右侧双行时间、整宽分割线，事件底色和圆角过重。
    - 收口目标：移动端改为无卡片列表行；日期组头左右排（日期 + 农历）；全天事件用绿色星标；普通事件只保留左色条 + 标题 + 右侧起止时间；行间以 1px 分割线承接。
    - 验证：浏览器确认移动列表为白底整宽行、0 圆角、1px 分割线、右侧农历、右侧起止时间两行；点击事件仍打开移动底部 sheet。
- M3：
  - **Multi-day 首版已落地（2026-06-22）**：
    - docs-first：`SPEC.md` / `MIGRATION.md` 已把 `multiDay` 纳入公开 `ViewType`、`views` 与 `options.multiDay.range`。
    - 方案：新增薄视图层复用 Week 的 `GridHeader`、`AlldayRow`、`TimeGrid` 与 `getWeekViewEvents` / `createTimeGridData`；日期窗口统一走 `getVisibleDateWindow`，默认 2 天。
    - s2 移动端 segmented「多日」切到真实 `multiDay` 引擎视图，不再显示占位。
    - 验证：移动浏览器确认 `.swell-calendar-multi-day-view` 存在、无 `.m-placeholder`，默认 2 列（22/23）时间网格渲染，点击事件打开移动底部 sheet。
- M4：
- M5：
