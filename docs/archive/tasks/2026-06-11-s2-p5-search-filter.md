# swell-calendar-s2 · P5 切片：搜索过滤 + 分类 chips 筛选

> 进度真源见 [2026-06-10-s2-app-roadmap.md](./2026-06-10-s2-app-roadmap.md) 的 P5 行。
> 续 [新建落库](./2026-06-11-s2-p5-create-event.md)。

## 背景

顶栏 `SearchField`（`shell.tsx Topbar`）与子栏分类 chips（`overlays.tsx SubBar`）目前是装饰——
搜索框 uncontrolled 不过滤，chips 永远 `on` 且不可点。本切片把它们接成真过滤，作用到统一事件流。

## 目标

- 顶栏搜索框：按标题 / 与会人(who) / 地点(loc) 子串（不分大小写）过滤事件。
- 子栏分类 chips：可点选切换，关闭某分类即从视图隐藏该类事件。
- 搜索 + 分类条件叠加，结果同时作用到引擎（scheduler/timeline）与静态（day/week）视图。

## 非目标

- 过滤状态持久化（搜索/筛选是瞬时 UI 态，刷新重置；与新建落库的持久化语义不同）。
- 明暗 / 强调色 / 密度切换（S2 Provider 在 main.tsx 写死 + seafoam 多处硬编码 + 无 data-density，
  需先解耦，列为独立切片）。
- month 视图（独立 `monthEvents` map，不接事件流）。

## 影响范围

- 代码：`App.tsx`（过滤管线）、`shell.tsx`（Topbar 搜索受控）、`overlays.tsx`（SubBar chips 受控）。
- 文档：本任务单 + roadmap 切片进度。
- 运行时行为：搜索/筛选即时影响渲染。

## 方案

1. **App**：新增 `query` 与 `activeCats: Set<Cat>`（初值含全部 chip 分类）。
   `visibleEvents = useMemo(filter(allEvents), [allEvents, query, activeCats])`，过滤规则：
   - 分类：仅当事件分类属于「chip 分类集合」且被关闭时隐藏（非 chip 分类如 magenta 始终可见）。
   - 搜索：`q` 非空时，`title+who+loc` 不含 `q` 则隐藏。
   `calendarEvents` 与静态视图 events 改由 `visibleEvents` 派生。
2. **Topbar**：`SearchField` 受控（`value`/`onChange`），新增 `query`/`setQuery` props。
3. **SubBar**：chips 受控（`activeCats`/`onToggleCat`），`on` 类随状态变化。

## 验证计划

- [ ] `tsc --noEmit`（已链接 workspace 软链）
- [ ] 浏览器（5180）：输入关键字 → 仅匹配事件保留；关闭某分类 chip → 该类事件消失；引擎与 week 视图一致。
- [ ] `check-docs` / `check-arch`

## 风险与回滚

- 风险：引擎 events prop 需新引用才重渲 → 沿用 `useMemo` 派生保证引用变化。
- 回滚：还原三文件即可（无持久化、无 schema 变更）。

## 实施结果

- **实际改动**：
  - `App.tsx`：新增 `query` / `activeCats` state 与 `toggleCat`；`visibleEvents = useMemo(filter(allEvents))`
    （分类 + 搜索叠加）；`calendarEvents` 与静态 day/week 视图改由 `visibleEvents` 派生。
  - `overlays.tsx`：导出 `SUBBAR_CATS` / `FILTER_CATS`；`SubBar` chips 受控（`activeCats`/`onToggleCat`），
    首个 chip 变「全部」一键复位（`onShowAll`，allOn 时 disabled）。
  - `shell.tsx`：`Topbar` `SearchField` 受控（`value`/`onChange`），新增 `query`/`setQuery` props。
- **与原计划偏差**：无。额外加了「全部」一键复位（allOn 时禁用）提升可用性。
- **验证结果**：`tsc --noEmit` ✅。浏览器（5180）实测：
  - 搜索「结对」→ 仅 `结对编程` 保留，`产品双周评审`/`架构评审` 隐藏。
  - 关闭「会议·评审」chip → seafoam 事件（产品双周评审/晨会）隐藏，purple/green 仍在；「全部」复位后恢复。
  - 静态 week 视图同样生效（关「工程·协作」→ 绿色事件隐藏，seafoam 仍在），与引擎一致。
- **剩余问题**：magenta（无对应 chip）始终可见（设计 SubBar 只 5 类，刻意）；过滤态不持久化（非目标）。
