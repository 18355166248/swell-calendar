# 2026-06-10 · Timeline 主题能力扩展（packages/calendar）

## 背景

S2 外壳应用（见 `docs/archive/tasks/2026-06-10-s2-shell-app.md`）要把中间“资源×时间”调度网格还原到
`swell-calendar.html` 设计稿。但当前 `packages/calendar` 的主题面 **`ThemeState` 只覆盖
`week / common / month`，没有 `timeline`**。Timeline 的视觉（资源列底 `#fafafa`、网格边框 `#e8e8e8`、
空态 `#999`、今天列高亮、周末浅染等）全部**硬编码在 `src/css/timeline/timeline.scss`**，
不走 ThemeStore，宿主无法通过主题面还原设计。

因此“还原 timeline 到设计稿”不能只在 app 侧做 CSS 覆盖（会变成一堆 `!important` 技术债、依赖内部类名、
设计一改就崩）。决定走**正路：给库补 timeline 主题能力**。

## 目标

- 在 `src/types/theme.type.ts` 新增 `TimelineTheme`，并入 `ThemeState`。
- 在 `src/slices/theme/` 新增 `theme.timeline.slice.ts`，提供默认值（等于当前 hex，保证零行为变化）。
- 把 `src/css/timeline/timeline.scss` 中与设计相关的硬编码 hex 改为主题驱动（经组件 inline style 或
  CSS 变量注入，遵循“不注入全局 CSS 变量”的现有策略）。
- 同步 `packages/calendar/SPEC.md`：把 timeline 主题纳入“主题可替换”能力边界。

## 非目标

- 不改 timeline 的结构 / 拖拽 / 车道堆叠逻辑。
- 不改 week/common/month 既有主题字段。
- 不在 `components/` 写业务逻辑（主题取值走 slice/controller，保持分层）。

## 影响范围

- 代码：`src/types/theme.type.ts`、`src/slices/theme/*`、`src/css/timeline/timeline.scss`、
  以及消费主题的 timeline 组件（`components/view/Timeline.tsx` 等）。
- 文档：`packages/calendar/SPEC.md`（主题能力边界）；本任务文档。
- 运行时行为：默认值与当前一致 → 不传 timeline 主题时**视觉零变化**；可被宿主覆盖。

## 现状

- `ThemeState = { week, common, month }`，无 timeline。
- `timeline.scss` 硬编码：`#fafafa` / `#e8e8e8` / `#999` 等。
- 类名经 `postcss-prefixer` 加 `swell-calendar-` 前缀，稳定但不可由主题面驱动。

## 方案

1. 先改一级真源 `SPEC.md`（主题可替换条目纳入 timeline）。
2. 加类型 `TimelineTheme`（字段对照 scss 中可设计化的项：resource 列底色/边框、grid 边框、
   today 列高亮、weekend 浅染、event 卡柔色基色、空态色等）。
3. 加 slice 默认值（= 现 hex），保证 backward compatible。
4. timeline 组件/scss 改为读主题值。
5. app 侧（S2 shell）通过 ThemeStore 注入设计稿取值。

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`（如分层落点有新增）
- [ ] 新增或更新 ADR（暂无）
- [x] 新增任务记录（本文件）

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [x] `pnpm --filter swell-calendar exec tsc --noEmit`
- [x] `pnpm --filter swell-calendar test`（默认值零行为变化回归）
- [ ] Storybook timeline 故事在不传主题时视觉无变化

## 风险与回滚

- 风险：scss → 主题驱动的注入方式需符合“不注入全局 CSS 变量”策略，落点要和现有主题注入方式一致。
- 风险：**具体设计取值阻塞于 `swell-calendar.html`**（当前拉不到，等用户导出到仓库）。
  类型/slice/默认值骨架可先行，取值后填。
- 回滚方式：timeline 主题为新增可选字段，移除即回到硬编码默认，向后兼容。

## 实施结果

**状态：完成（2026-06-11）。** 作为 P4（挂活引擎）前置工作完成。

### 改动清单

- `src/types/theme.type.ts`：新增 `TimelineTheme` 及其子类型（`TimelineResourceListTheme`、`TimelineResourceItemTheme`、`TimelineHeaderTheme`、`TimelineSchedulerHeaderTheme`、`TimelineSchedulerResourceCellTheme`、`TimelineGridTheme`、`TimelineTooltipTheme`），并入 `ThemeState`。
- `src/slices/theme/theme.timeline.slice.ts`（新文件）：`createTimelineThemeSlice()` 工厂函数，默认值完全对齐全 `timeline.scss` 硬编码 hex/rgba，保证**零视觉变化**。
- `src/contexts/themeStore.ts`：将 `createTimelineThemeSlice` 接入 `storeCreator`。
- `src/index.ts`：导出 `ThemeState` 类型。
- `packages/calendar/SPEC.md`：核心约束 #4 更新为「主题可替换：通过 ThemeStore 配置颜色（含 timeline 视图），不依赖 CSS 变量注入」。
- 组件改造（`TimelineHeader.tsx`、`ResourceList.tsx`、`TimelineRow.tsx`、`TimelineGrid.tsx`、`TimelineDragTooltip.tsx`、`view/Timeline.tsx`）：消费 `useThemeStore((s) => s.timeline.xxx)` 并通过 inline style 注入颜色值。
- `src/css/timeline/timeline.scss`：移除 timeline 专属类（`.timeline-*`、`.scheduler-empty`）中已迁移到主题的硬编码颜色，保留结构性属性（display/flex/position/padding/transition）。

### 验证

- `tsc --noEmit` ✅
- 282 项测试全部通过 ✅
- `check-docs` ✅ · `check-arch` ✅
- 默认值 = 原硬编码值 → 不传 timeline 主题时视觉零变化 ✅
