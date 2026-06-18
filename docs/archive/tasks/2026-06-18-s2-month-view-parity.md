# 2026-06-18 s2 月视图能力补齐

## 背景

`packages/calendar` 月视图已经支持 `workweek`、`narrowWeekend`、拖拽移动、拖拽 resize、空白创建和 `+N 更多` 回调，但 `apps/swell-calendar-s2` 宿主层只接了基础月视图切换与部分回调：

- `options.month` 未显式透传，宿主无法控制月视图周末显隐、窄周末等能力；
- 月视图 `+N 更多` 虽然已有基础浮层，但折叠事件的信息展示较弱，且缺少直接进入编辑的宿主动作。

## 目标

- 补齐 `apps/swell-calendar-s2` 对 `packages/calendar` 月视图 `month` 选项的宿主接线。
- 在 `s2` 月视图下支持：
  - 隐藏周末列；
  - 窄周末列宽；
  - `+N 更多` 浮层查看折叠事件摘要；
  - 从 `+N 更多` 浮层直接查看详情或进入编辑。

## 非目标

- 不修改 `packages/calendar` 月视图公开 API。
- 不新增月视图专用数据源或独立弹层体系。
- 不重做 `Popover` / `CreateDialog` 的视觉样式。

## 影响范围

- 代码：
  - `apps/swell-calendar-s2/src/App.tsx`
  - `apps/swell-calendar-s2/src/overlays.tsx`
- 文档：
  - 本任务文档
- 运行时行为：
  - `s2` 月视图支持宿主级 `month` 选项透传与 `+N 更多` 编辑链路

## 现状

- `App.tsx` 的 `calendarOptions` 仅透传 `week` / `scheduler` / `timeline`，未包含 `month`。
- `SubBar` 只在 `week` / `scheduler` 显示“显示周末”开关，月视图无法切换 `workweek`。
- `MoreEventsPopover` 仅展示简版事件行，点击后才能跳转详情，缺少摘要和直接编辑动作。

## 方案

- 在 `App.tsx` 新增月视图宿主状态：
  - `showWknd` 继续作为周末显隐真源，并让月视图复用；
  - 新增 `monthNarrowWeekend`，仅在月视图暴露。
- `calendarOptions` 中补齐 `month`：
  - `startDayOfWeek: 1`
  - `workweek: !showWknd`
  - `narrowWeekend: monthNarrowWeekend`
  - `dragToMove/dragToResize/dragToCreate: true`
- 扩展 `SubBar`：
  - 月视图显示“显示周末”开关；
  - 月视图额外显示“窄周末”开关。
- 扩展 `MoreEventsPopover`：
  - 每个折叠事件展示标题、时间、参与人、地点等摘要；
  - 支持“查看”与“编辑”动作；
  - 详情弹层锚定到浮层内被点击的行，避免折叠事件没有真实卡片 DOM 时定位失败。

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [x] `pnpm --filter swell-calendar-s2 exec tsc --noEmit`

## 风险与回滚

- 风险：
  - `MoreEventsPopover` 内部动作增加后，需注意点击冒泡导致浮层提前关闭。
  - 月视图周末显隐接入后，需确认宿主顶部标题和 mini calendar 不会误导用户。
- 回滚方式：
  - 删除 `App.tsx` 新增的 `month` 透传与 `SubBar` 月视图开关；
  - `MoreEventsPopover` 回退到只读列表实现。

## 实施结果

实现完成后补充：

- 实际改动：
  - `apps/swell-calendar-s2/src/App.tsx` 补齐 `month` 选项透传：月视图现在显式带 `startDayOfWeek=1`、`workweek`、`narrowWeekend` 和 `dragToMove/dragToResize/dragToCreate`。
  - `App.tsx` 新增 `monthNarrowWeekend` 宿主状态，并让月视图复用 `showWknd` 控制周末显隐。
  - `apps/swell-calendar-s2/src/overlays.tsx` 的 `SubBar` 新增月视图“窄周末”开关；“显示周末”开关也扩展到月视图。
  - `MoreEventsPopover` 现在展示折叠事件的标题、时间、参与人、地点摘要，并新增“编辑”入口。
  - `MoreEventsPopover` 的“查看”详情改为把点击行本身作为锚点，解决月视图折叠事件没有真实卡片 DOM 时详情浮层定位漂移的问题。
- 与原计划的偏差：
  - 未改 `packages/calendar/SPEC.md` 与 `docs/ARCHITECTURE.md`。本次只补宿主层接线和交互，不涉及包公开能力或分层结构变化。
- 验证结果：
  - `node scripts/check-docs.mjs` 通过。
  - `node scripts/check-arch.mjs` 通过。
  - `pnpm --filter swell-calendar-s2 exec tsc --noEmit` 通过。
  - 本地起 `apps/swell-calendar-s2` 预览后，已确认月视图子栏出现“显示周末”和“窄周末”两个宿主开关。
- 剩余问题：
  - 月视图 `+N 更多` 的完整交互目前以代码接线和类型检查为主，尚未补 `s2` 宿主级自动化回归用例。
