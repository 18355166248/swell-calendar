# 2026-06-18 s2 收尾批处理（首屏数据 / 浮层回归 / 计划笔记刷新）

## 背景

对 `apps/swell-calendar-s2` 做一次收尾盘点，发现三类待处理项，按顺序处理：

1. **首屏空日历**：47 条种子 demo 事件的 `CalEvent.day` 是 0–6「周内索引」，经 `calendarData.makeDate` 锚定在 `BASE_DATE = 2025-03-17` 那一周；而 `App` 的 `currentDate` 初始化为 `new Date()`（今天）。两者错开约 15 个月，导致**打开 demo 即空日历**，只有零星手动创建（绝对日期）的事件可见。
2. **月视图 `+N 更多` 浮层缺自动化回归**：`MoreEventsPopover` 的事件摘要（参与人 / 地点 / 时间标签）取数逻辑此前内联在组件里，没有任何用例覆盖。
3. **过时计划笔记**：`docs/tasks/2026-06-12-s2-next-plan.md` 里若干「已知限制」在后续迭代中已解决，但笔记未回填。

## 目标

- demo 首屏（今天）即可见种子事件，且不破坏既有 `BASE_DATE` 语义与现有单测。
- 为 `+N 更多` 浮层的取数逻辑补可运行的单元回归。
- 把 next-plan 中已不成立的限制回填为「已解决」。

## 非目标

- 不引入 React Testing Library / jsdom 环境（s2 当前测试为纯函数 node 环境）；浮层 DOM 交互的端到端回归不在本批次。
- 不改 `packages/calendar` 公开 API 或分层结构。
- 不接真后端；mock 仍走 mockjs + localStorage。

## 影响范围

- 代码：
  - `apps/swell-calendar-s2/src/calendarData.ts`（新增当前周锚定 helper）
  - `apps/swell-calendar-s2/src/mock/server.ts`（种子播种锚定到当前周 + 版本化重置）
  - `apps/swell-calendar-s2/src/overlays.tsx`（抽出 `pickEventMeta` / `formatEventTimeLabel` 纯函数）
  - `apps/swell-calendar-s2/src/calendarData.spec.ts`（新增用例）
- 文档：
  - 本任务文档
  - `docs/tasks/2026-06-12-s2-next-plan.md`（回填已解决限制）

## 方案

### 1. 首屏数据锚定（item ①）

- **保持 `BASE_DATE = 2025-03-17` 不变**（现有单测与 `dateToDayIndex/dayIndexToDate` 语义依赖它）。
- 在 `calendarData.ts` 新增：
  - `currentWeekStartDayIndex()`：返回「当前周周一」相对 `BASE_DATE` 的天偏移。
  - `rebaseEventsToCurrentWeek(events)`：把周内索引（0–6）语义的种子事件整体平移到当前周（`day`/`endDay` 同时偏移）。
- `mock/server.ts` 首次播种时用 `rebaseEventsToCurrentWeek(SEED_EVENTS)` 落库 → 种子落在当前周，首屏即有数据。
- 用户手动创建的事件仍按绝对 `day` 落库（`BASE_DATE` 不动），跨会话稳定，无周漂移。

### 2. localStorage 版本化重置（item ③）

- 新增 `DB_VERSION` 与版本键：旧 localStorage（种子停留在 2025 周 / 早期丢失 `allDay` 语义）在版本不匹配时，一次性重置为「今天锚定 + 语义完整」的新种子。
- demo 数据属可重建 mock，重置可接受；版本号只在 schema/锚定语义变化时递增。

### 3. `+N 更多` 浮层取数纯函数化 + 单测（item ②）

- 从 `MoreEventsPopover` 抽出 `pickEventMeta(event)`（who/loc，优先 `meta.pickMeta` 再 `raw`）与 `formatEventTimeLabel(event)`（全天 → 「全天」，否则 `HH:mm - HH:mm`）为导出纯函数。
- 在 `calendarData.spec.ts` 补用例覆盖 meta 兜底优先级、全天 / 定时时间标签、以及 `rebaseEventsToCurrentWeek` 偏移正确性。

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 无规格变更（仅宿主 demo 数据锚定与测试），补任务记录并回填 next-plan

## 验证计划

- [x] `pnpm --filter swell-calendar-s2 test`
- [x] `pnpm --filter swell-calendar-s2 exec tsc --noEmit`
- [x] `node scripts/check-docs.mjs`
- [x] 预览：首屏（今天）即见种子事件

## 实施结果

- 实际改动：
  - `calendarData.ts`：新增 `currentWeekStartDayIndex()` / `rebaseEventsToCurrentWeek()`；`BASE_DATE` 与既有转换语义保持不变。
  - `mock/server.ts`：种子播种走 `rebaseEventsToCurrentWeek(SEED_EVENTS)`，落到当前周；新增 `DB_VERSION='2'` + 版本键，版本不匹配时一次性重置旧 mock-db（同时清理早期丢失 `allDay` 的历史数据）。
  - `overlays.tsx`：抽出导出纯函数 `pickEventMeta` / `formatEventTimeLabel`，`MoreEventsPopover` 改为复用。
  - `calendarData.spec.ts`：新增 9 个用例（周锚定偏移 3 + 浮层取数 6），共 19 passed。
- 验证结果：
  - `pnpm --filter swell-calendar-s2 test` → 19 passed。
  - `tsc --noEmit`（calendar + s2）通过。
  - `node scripts/check-docs.mjs` 通过。
  - 预览实测：版本升级后 mock-db 重置为 47 条种子，`day` 落在当前周（周一~周五），首屏（今天）即见「产品双周评审」「全员大会」「1:1·李娜」等事件。
- 剩余问题：
  - `+N` 浮层完整点击 / 编辑交互的端到端回归仍需 jsdom + testing-library，本次以纯函数单测覆盖取数逻辑。
  - 若用户已在更早的某周打开过 demo（mock-db 已是 v2 且停留在那一周），种子不会再自动跟到新的一周——属绝对日期 demo 数据的预期行为；清空 localStorage 或递增版本号可重置。
