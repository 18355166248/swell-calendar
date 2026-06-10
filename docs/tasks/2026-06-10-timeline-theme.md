# 2026-06-10 · Timeline 主题能力扩展（packages/calendar）

## 背景

S2 外壳应用（见 `docs/tasks/2026-06-10-s2-shell-app.md`）要把中间“资源×时间”调度网格还原到
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

- [ ] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`（如分层落点有新增）
- [ ] 新增或更新 ADR（暂无）
- [x] 新增任务记录（本文件）

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] `pnpm --filter swell-calendar exec tsc --noEmit`
- [ ] `pnpm --filter swell-calendar test`（默认值零行为变化回归）
- [ ] Storybook timeline 故事在不传主题时视觉无变化

## 风险与回滚

- 风险：scss → 主题驱动的注入方式需符合“不注入全局 CSS 变量”策略，落点要和现有主题注入方式一致。
- 风险：**具体设计取值阻塞于 `swell-calendar.html`**（当前拉不到，等用户导出到仓库）。
  类型/slice/默认值骨架可先行，取值后填。
- 回滚方式：timeline 主题为新增可选字段，移除即回到硬编码默认，向后兼容。

## 实施结果

**状态：暂缓（2026-06-10）。** 设计稿到位后发现它自带全部视图的静态实现，
`apps/swell-calendar-s2` 先走「忠实移植设计 CSS」出像素级成品（见
`2026-06-10-s2-shell-app.md`），未先改库。本任务（给 `packages/calendar` 加 timeline 主题切片）
保留为「挂活引擎」阶段的前置工作：当要把 app 里的静态 scheduler/timeline 换成 calendar 拖拽引擎、
并用设计 token 重新着色时，再启动本任务。未阻塞当前 app。

- 实际改动：暂无（骨架与取值留待启动）。
- 与原计划的偏差：从「P2 必经」降级为「引擎复用阶段的前置」。
- 验证结果：—
- 剩余问题：启动时需确认注入方式符合「不注入全局 CSS 变量」策略。
