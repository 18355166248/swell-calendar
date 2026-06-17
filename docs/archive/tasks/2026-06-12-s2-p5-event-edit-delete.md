# swell-calendar-s2 · P5 切片：事件编辑 / 删除（override 层）

> 进度真源见 [2026-06-10-s2-app-roadmap.md](./2026-06-10-s2-app-roadmap.md) 的 P5 行。
> 续 [新建落库](./2026-06-11-s2-p5-create-event.md) 与 [搜索/筛选](./2026-06-11-s2-p5-search-filter.md)，
> 与新建共用 `CreateDialog` + 持久化管线，闭环成完整 CRUD。

## 背景

新建落库后，已有事件仍只能查看（popover 的「编辑」是 no-op，无删除）。本切片把任意事件
（含 `data.ts` 的种子 demo 事件）做成可编辑、可删除并持久化。

## 目标

- 点事件 popover → 编辑：复用 `CreateDialog`（编辑模式预填），保存后即时更新视图。
- 点事件 popover → 删除：从所有视图移除。
- 种子与用户事件**都**可改可删，刷新后保持。

## 方案：三层叠加，种子不可变

种子始终只读，编辑/删除以叠加层表达（用户选择「全部可改删（override 层）」）：

- `userEvents: CalEvent[]` —— 新建事件（id `u-`）。
- `overrides: Record<id, CalEvent>` —— 对种子或新建事件的整条编辑覆盖。
- `deletedIds: string[]` —— 删除墓碑。

派生：`allEvents = [...SEED, ...userEvents].filter(未删除).map(有覆盖则取覆盖)`（删除优先于覆盖）。
三层各自 `localStorage` 持久化。

- **App.tsx**：上述 state + 持久化 effect；`handleSubmit` 按 `editing` 路由（覆盖 vs 新建）；
  `openEdit`（按 pick.id 从 allEvents 取原 CalEvent → `editing`）、`handleDelete`（加墓碑）。
  `inputToCalEvent(input, base?)` 编辑时以原事件兜底，保留对话框不编辑的 who/desc 等字段；
  `calEventToInput` 反向回填。
- **overlays.tsx**：`CreateDialog` 接 `initial?` 进入编辑模式（标题「编辑日程」、按钮「保存」、字段预填）；
  `Popover` 接 `onEdit`/`onDelete`，操作区改为「删除 / 编辑」（替换原装饰性 加入/接受）。
- **calendarData.ts**：新增 `dayIndexToDate` / `decimalHourToTime`（dateToDayIndex / timeToDecimalHour 的逆）。

## 非目标

- 删除二次确认弹窗（demo 直接删，可后续加）。
- 重复规则、month 视图（既有非目标）。

## 验证结果

- `tsc --noEmit` ✅。浏览器（5180）实测：
  - 点种子事件 e1「产品双周评审」→ 编辑预填正确（res r1 / 2025-03-17 / 09:00–10:30 / 会议）；
    改标题保存 → 视图即时更新，`overrides[e1]` 持久化且 who/desc/loc 保留。
  - 删除该事件 → 从视图消失，`deleted-ids=["e1"]` 持久化；同标题的 e11（p1）不受影响。
  - 刷新后：e1 仍删除（删除优先于覆盖），其余事件正常，控制台无新增运行时 error。

## 风险与回滚

- 风险：删除与覆盖同 id 并存 → 派生时先 filter 删除、后 map 覆盖，删除优先，语义明确。
- 回滚：还原三文件 + 清除三个 localStorage key。
