# swell-calendar-s2 · 路线图与进度（后续唯一进度真源）

> 本文件是 `apps/swell-calendar-s2` 的活进度表。每完成一个阶段，勾选并补「完成记录」。
> 单阶段的目标/范围/验证细节，写到对应 `docs/tasks/YYYY-MM-DD-*.md`，本文件只维护「阶段、状态、验收、落点」。

## 背景

把 Claude Design 的 swell-calendar 设计稿落成真实可用的日程调度界面。设计稿是一套自定义 CSS 变量
手写的 Spectrum 2 近似（非真实 S2 组件），handoff README 要求像素级还原。当前策略：
先忠实移植 CSS 出像素级成品，再逐步替换为真 S2 组件、挂活 `packages/calendar` 拖拽引擎、接真数据。

相关文档：

- 移植主任务：[2026-06-10-s2-shell-app.md](./2026-06-10-s2-shell-app.md)
- 库的 timeline 主题（Path B，暂缓）：[2026-06-10-timeline-theme.md](./2026-06-10-timeline-theme.md)
- 设计源（本地，未入库）：`swell-video-download-remix/project/`

## 进度总览

| 阶段 | 内容 | 状态 | 落点 |
| ---- | ---- | ---- | ---- |
| P0 | 文档门禁 + 任务文档 | ✅ 完成 2026-06-10 | `docs/tasks/` |
| P1 | 脚手架 + S2 macro 链路验证 | ✅ 完成 2026-06-10 | `apps/swell-calendar-s2` |
| P2 | 忠实移植设计稿（5 视图 + overlays） | ✅ 完成 2026-06-10 | `apps/swell-calendar-s2/src` |
| P3 | 真实 S2 组件替换外围控件 | 🟡 代码完成，待视觉验证 | `src/shell.tsx`、`src/main.tsx` |
| P4 | 挂活 `packages/calendar` 拖拽引擎 + timeline 主题 | ⬜ 未开始 | `src/views.tsx` + `packages/calendar` |
| P5 | 控件真功能化（主题切换 / 搜索 / 筛选 / 新建落库） | ⬜ 未开始 | `apps/swell-calendar-s2/src` |
| P6 | 接真数据（替换 mock SWELL，事件 CRUD） | ⬜ 未开始 | `apps/swell-calendar-s2/src` |

图例：✅ 完成 · 🟡 进行中 · ⬜ 未开始 · ⏸ 暂缓

---

## P3 · 真实 S2 组件替换外围控件 🟡

把不破坏像素观感的外围控件换成 `@react-spectrum/s2`（依赖与 macro 链路 P1 已就绪）。

- 范围：顶栏「新建/今天」按钮、搜索框、视图分段切换、通知/设置图标按钮；侧栏 CTA。
- 不动：中间网格/事件卡（无 S2 等价物，保留移植版）；侧栏导航项（S2 无直接等价物，保留 CSS 版）。
- 取舍：S2 组件有自己的精确度量，**可能偏离设计像素**——逐个控件评估，偏差大的保留 CSS 版。
- 验收：被替换控件用真 S2；`style()` macro 生效；视觉 diff 可接受；tsc/lint 通过。
- 风险：S2 Provider 的 `page.css` 全局背景与设计 `--bg-app` 冲突——**已规避**：不引 page.css，Provider 默认 background 为 transparent。

## P4 · 挂活引擎 + timeline 主题 ⬜

把 week/scheduler 的**静态**视图换成 `packages/calendar` 的真引擎（拖拽移动/resize/空白创建/车道堆叠），
并用设计 token 重新着色。**前置 = 完成 [timeline-theme](./2026-06-10-timeline-theme.md)**（给库加 timeline 主题切片，
因为 timeline.scss 现为硬编码 hex，宿主无法用主题面还原设计）。

- 步骤：① 先做 timeline-theme（改 `theme.type.ts` + `SPEC.md`，docs-first）；
  ② app 用 `workspace:*` 依赖 calendar 并构建；③ 用设计 token 经 ThemeStore 注入着色。
- 验收：week/scheduler 可拖拽，视觉贴设计；calendar 默认主题零行为回归；`pnpm check` 通过。
- 风险：calendar 主题注入策略「不注入全局 CSS 变量」，着色落点要与现有方式一致。

## P5 · 控件真功能化 ⬜

设计稿里固定为默认的开关做成真功能。

- 范围：明暗/强调色/密度切换（设计 CSS 已支持 `data-theme`/`data-accent` + density）；
  搜索过滤；分类 chips 筛选；新建对话框真正落库到本地状态。
- 验收：切换即时生效并持久化（localStorage）；筛选/搜索影响渲染；新建后出现在视图里。

## P6 · 接真数据 ⬜

- 范围：抽象数据源接口，替换 `src/data.ts` 的 mock SWELL；事件 CRUD 走真实后端/本地存储。
- 验收：增删改查闭环；空态/加载/错误态有处理。

---

## 完成记录

### 2026-06-10 · P0 + P1 + P2 完成

- 在既有 pnpm+turbo monorepo 新建 `apps/swell-calendar-s2`（Vite + react-ts），workspace 自动纳入。
- S2@1.4.0 + unplugin-parcel-macros@0.2.0 链路验证通过（后因移植策略改为不引 S2 runtime，依赖暂留）。
- 忠实移植设计稿：3 份 CSS + data/icons/shell/views/overlays/App，剔除编辑器 tweaks 面板，固定默认配置。
- 验证：tsc / check-docs / check-arch 通过；浏览器实测 scheduler/week/timeline + rich popover 像素级还原。
- 提交：`feat/s2-shell-app` 分支，commit `e86d8f5`。

### 2026-06-10 · P3 代码完成（待视觉验证）

- `main.tsx`：加入 S2 `<Provider colorScheme="light">`，不引 `page.css`（background 默认 transparent，不影响自定义 CSS 变量体系）。
- `shell.tsx` Topbar 控件替换：
  - 侧栏切换 → `ActionButton isQuiet`
  - 「今天」→ `Button variant="secondary" fillStyle="outline" size="S"`
  - 前后箭头 → `ActionButton isQuiet`
  - 搜索框 → `SearchField size="S"`
  - 视图分段 → `SegmentedControl` + `SegmentedControlItem`（`selectedKey` 受控）
  - 通知/设置 → `ActionButton isQuiet`（通知圆点经 `.tb-icon-wrap` + `.s2-dot` 绝对定位）
- `shell.tsx` Sidebar CTA → `Button variant="accent"`（`.side-cta-wrap` 处理布局）
- 保留 CSS 版：侧栏导航项（icon + label + badge + active 态过于定制，S2 无直接等价物）、MiniCalendar、中间视图网格。
- `app.css`：移除旧 `.side-cta` / `.tb-today` / `.tb-arrow` / `.tb-rail-toggle` / `.tb-search` / `.tb-icon-btn` 样式，新增 `.side-cta-wrap` / `.tb-search-wrap` / `.tb-icon-wrap` / `.s2-dot` 布局类。
- 验证：`tsc --noEmit` ✅ · `vite build`（357KB JS / 86KB CSS）✅ · `check-docs` ✅ · `check-arch` ✅。
- 待验证：浏览器视觉 diff（S2 组件自带 Spectrum 原生样式，与 CSS 近似版可能有细微差异）。

### 2026-06-11 · P3-2 S2 accent → seafoam 覆盖

- **问题**：S2 `variant="accent"` 按钮默认渲染 Spectrum blue（`#3b63fb`），焦点环也是 blue（`#4b75ff`），与设计稿的 seafoam 不符。
- **根因分析**：S2 组件颜色在构建时由 `@adobe/spectrum-tokens` 烘焙进 CSS 类（minified class names），不走 CSS 变量，无法通过改 `--accent-bg` 影响。
- **方案**：`UNSAFE_className` + CSS `!important` 覆盖。
  - CTA Button：覆盖 S2 内部 CSS 变量 `--g`（`background-color: var(--g)` 的源头），文字色 `#fff`（`px131` 类）不受影响。
  - 所有焦点环：覆盖 `outline-color`（S2 用 `light-dark(#4b75ff, #4069fd)` 烘焙）。
- **shell.tsx 改动**：
  - CTA Button 加 `UNSAFE_className="s2-seafoam-cta"`
  - 所有 ActionButton + SearchField 加 `UNSAFE_className="s2-sf"`（焦点环覆盖）
  - SegmentedControl 加 `UNSAFE_className="s2-ss"`（焦点环覆盖）
- **app.css 新增**：P3-2 覆盖块——`.s2-seafoam-cta` 覆盖 `--g`，`.s2-sf` / `.s2-ss` 覆盖 `outline-color`。
- **SegmentedControl 发现**：选中态滑块为白色（`light-dark(#fff, #111)`），非蓝色，无需覆盖背景。
- 验证：`tsc --noEmit` ✅ · `vite build`（357KB JS / 87KB CSS）✅。
- 待验证：浏览器视觉确认 CTA 按钮和焦点环为 seafoam。

### 2026-06-11 · P3-3 新建按钮图标-文字垂直对齐修复

- **问题**：侧栏「新建日程」按钮中，`+` 图标与文字未垂直居中对齐。
- **根因分析**：S2 Button 的 `control({wrap: true, icon: true})` 在有文字时使用 `align-items: baseline`（为文字换行场景设计，图标对齐首行基线）。自定义 SVG 未通过 S2 `IconContext`（无 `slot="icon"`），`centerBaseline` 包装未生效，导致基线对齐产生视觉偏移。
- **方案**：CSS 覆盖。
  - `.side-cta-wrap > button` 加 `align-items: center !important`（覆盖 S2 的 baseline）。
  - `.side-cta-wrap svg` 加 `display: block`（消除 inline SVG 基线偏差）。
- **app.css 改动**：`.side-cta-wrap > button` 与 `.side-cta-wrap svg` 规则更新。
- 验证：`tsc --noEmit` ✅ · `vite build`（357KB JS / 87KB CSS）✅。
