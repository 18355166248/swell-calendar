# swell-calendar-s2 · P5 控件真功能化（第一刀：新建落库）

> 进度真源见 [2026-06-10-s2-app-roadmap.md](./2026-06-10-s2-app-roadmap.md) 的 P5 行。
> 本文件只承载 P5 当前正在实现的切片，完成后回写 roadmap 完成记录。

## 背景

设计稿里所有控件都固定为默认值。P5 要把它们做成真功能。`CreateDialog`（`src/overlays.tsx`）
当前「创建日程」按钮只调用 `onClose`，输入框多为 uncontrolled，不产生任何事件。
本切片先打通**新建落库**——它直接串起 `CreateDialog → App 事件状态 → 引擎/静态视图渲染 → localStorage 持久化`，
是 P5 里最能暴露数据流与架构问题的一环，优先做。

## 目标（本切片）

- `CreateDialog` 收集 标题 / 资源 / 日期 / 起止时间 / 分类，点「创建日程」生成一条真实事件。
- 新事件即时出现在 scheduler / timeline 引擎视图与 week / day 静态视图中。
- 用户新建的事件持久化到 `localStorage`，刷新后仍在。

## 非目标（留待 P5 后续切片）

- 重复（rep）规则落地——对话框保留 UI，本切片只支持「不重复」。
- month 视图（用独立 `monthEvents` 硬编码 map，不接事件流）。
- 明暗 / 强调色 / 密度切换、搜索过滤、分类 chips 筛选、事件编辑/删除。

## 影响范围

- 代码：`apps/swell-calendar-s2/src/{App,overlays,calendarData}.tsx?`（仅 app 层，不动 `packages/calendar`）。
- 文档：本任务单 + roadmap 完成记录。
- 运行时行为：新增事件创建闭环 + localStorage 持久化。

## 方案

1. **事件状态上移**（`App.tsx`）：
   - `seedEvents` = `data.ts` 的 `events`（不可变种子）。
   - `userEvents` 用 `useState` 持有，初值从 `localStorage['swell-calendar-s2:user-events']` 解析；解析失败回退空数组。
   - `useEffect` 在 `userEvents` 变化时写回 localStorage。
   - `allEvents = useMemo(() => [...seedEvents, ...userEvents], [userEvents])`。
   - `calendarEvents = useMemo(() => toCalendarEvents(allEvents), [allEvents])`，传给 `<Calendar events>`（引擎 `useEffect([events])` 会 setEvents 重渲）。
   - 静态 `DayView/WeekView` 的 `events` 由 `ALL_EVENTS` 改为 `allEvents`。
2. **转换 helper**（`calendarData.ts`，集中 BASE_DATE 语义）：
   - `dateToDayIndex(dateStr)`：相对 BASE_DATE(2025-03-17) 的天偏移。
   - `timeToDecimalHour('09:00') → 9`。
   - 复用现有 `toCalendarEvents`（已接收数组参数）。
3. **对话框回填**（`overlays.tsx CreateDialog`）：
   - 新增 `onCreate(input)` prop；date / time / resource 改受控。
   - 「创建日程」校验标题非空、结束>开始后，构造 `CalEvent`（id=`u-${Date.now()}`，loc 取资源短名）并回调，再 `onClose`。

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md` —— 无（不改库公开 API，仅消费既有 `events` prop/effect）
- [x] 仅补任务记录 + roadmap 完成记录

## 验证计划

- [ ] `apps/swell-calendar-s2` `tsc --noEmit`
- [ ] 浏览器（端口 5180）：打开新建对话框 → 填标题/时间 → 创建 → 事件出现在 scheduler & week；刷新后仍在。
- [ ] `node scripts/check-docs.mjs` / `check-arch.mjs`

## 风险与回滚

- 风险：localStorage 旧数据结构与 `CalEvent` 不兼容 → 解析处 try/catch 回退空数组兜底。
- 风险：引擎 `events` prop 需新数组引用才重渲 → 用 `useMemo` 保证新增时引用变化。
- 回滚：还原 `App/overlays/calendarData`，清除 localStorage key 即可。

## 实施结果

- **实际改动**：
  - `calendarData.ts`：新增 `dateToDayIndex` / `timeToDecimalHour`（集中 BASE_DATE 语义）。
  - `overlays.tsx`：`CreateDialog` 改为受控（标题/资源/日期/起止时间），新增 `onCreate(NewEventInput)` 与
    导出的 `NewEventInput` 接口；「创建日程」加标题非空 + 结束>开始校验，失败在底栏提示。日期/时间改用原生 `type=date/time`。
  - `App.tsx`：事件上移为 `userEvents` state（init/persist 走 `localStorage['swell-calendar-s2:user-events']`），
    `allEvents = [...SEED_EVENTS, ...userEvents]`，`calendarEvents` 用 `useMemo` 派生传引擎；静态 day/week 视图改用 `allEvents`；
    `handleCreate` 经 `inputToCalEvent` 落库。
- **与原计划偏差**：无；recurrence 按非目标暂未接（对话框 UI 保留）。
- **验证结果**：
  - `tsc --noEmit` ✅（注：需先 `pnpm install` 让 app 链接 `swell-calendar` workspace 软链，否则 tsc 无法解析模块类型——
    本机此前缺该软链，已修复）。
  - 浏览器（5180）实测：新建对话框填标题→创建→事件即时出现在 scheduler 与 week 视图；`localStorage` 写入
    `{day:4,start:9,end:10,res:'r1',loc:'海景厅'}`（日期/时间换算正确）；刷新后事件仍在。控制台无新增运行时 error
    （历史 error 为编辑期 HMR 热替换的陈旧缓存）。
- **剩余问题**：新建事件不进 month 视图（独立 `monthEvents` map，非目标）；recurrence 未落地（非目标）。
