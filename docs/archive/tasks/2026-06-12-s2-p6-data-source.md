# swell-calendar-s2 · P6 接真数据（数据源抽象 + 异步 CRUD + 状态态）

## 背景

P5 已让控件「真功能化」：新建 / 编辑 / 删除事件通过四层 localStorage（种子 / 用户新建 /
override / 墓碑）落库，刷新可还原。但这套逻辑**直接散在 `App.tsx`**：组件层同时持有
localStorage key、四层叠加 `useMemo`、id 生成、`inputToCalEvent` 转换，且全部是**同步**的——
没有 loading / error / empty 态，也无法替换成真实后端。

P6 的目标不是「再写一遍 CRUD」（P5 已有），而是把数据访问收敛到一个**可替换的异步数据源接口**
背后，让 `App.tsx` 只面向 `{ events, status, error, create/update/delete }`，为将来换真后端留口子。

## 目标

- 定义 `CalendarDataSource` 异步接口（`list / create / update / remove`），形态对齐真实后端。
- 提供 `LocalStorageDataSource` 默认实现：内部保留「种子不可变 + 三层叠加」语义，对外暴露扁平 CRUD。
- 新增 `useCalendarData` hook：托管 `loading / ready / error` 状态与事件列表，CRUD 走数据源。
- `App.tsx` 从「内联 localStorage + 四层 useMemo」改为消费 hook；移除散落的事件持久化逻辑。
- 补 loading / error（可重试）/ empty（无任何事件）三种态的渲染。

## 非目标

- 不接入真实远端后端（环境无后端）；默认实现仍落 localStorage，但接口可直接替换。
- 不改 UI 偏好（`ui-prefs`）的持久化——那是 UI 状态不是业务数据，保留在 App 内。
- 不改 calendar 引擎、转换层（`calendarData.ts`）的对外行为。
- 不改 P5 已验收的 CRUD 交互路径与视觉。

## 影响范围

- 代码：`apps/swell-calendar-s2/src/dataSource.ts`（新增）、`useCalendarData.ts`（新增）、
  `App.tsx`（重构数据层）、`styles/app.css`（新增 `.data-state` 状态样式）。
- 文档：本任务单 + 路线图进度表。
- 运行时行为：首屏出现极短 loading 态（模拟异步），随后渲染；删空全部事件时显示 empty 态；
  数据源异常时显示可重试 error 态。CRUD 结果与 P5 一致。

## 现状

`App.tsx` 直接持有 `USER_EVENTS_KEY / OVERRIDES_KEY / DELETED_KEY` 三个 localStorage key、
`userEvents / overrides / deletedIds` 三个 state、`allEvents` 四层叠加 `useMemo`，以及 id 生成
（`u-${Date.now()}`）。组件层与持久化层耦合，且同步、无状态态。

## 方案

1. `dataSource.ts`：
   - `EventDraft = Omit<CalEvent, 'id'>`；`CalendarDataSource` 接口：
     `list(): Promise<CalEvent[]>` / `create(draft): Promise<CalEvent>` /
     `update(id, patch): Promise<CalEvent>` / `remove(id): Promise<void>`。
   - `LocalStorageDataSource implements CalendarDataSource`：内部维持
     `user-events / overrides / deleted-ids` 三层，`list()` = 种子 + 用户新建 → 叠 override → 去墓碑；
     create 负责生成 id 落 user 层，update 写 override 层，remove 写墓碑层。
     每个方法加一个极小的 `await delay()` 体现异步语义。id 生成下沉到数据源（后端职责）。
2. `useCalendarData(source)`：`{ events, status, error, reload, createEvent, updateEvent, deleteEvent }`。
   挂载时 `list()`；每次 mutation 后重新 `list()` 刷新（localStorage 即时，成本可忽略），失败置 error。
3. `App.tsx`：用 hook 替换三个 localStorage state 与 `allEvents`；`inputToCalEvent` 改产出
   `EventDraft` 交给数据源；canvas 增加 loading / error / empty 覆盖渲染。

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md` —— 不涉及库 API，跳过
- [ ] 更新 `docs/ARCHITECTURE.md` —— S2 app 内部分层，不动库架构，跳过
- [ ] 新增或更新 ADR —— 无规格级决策，跳过
- [x] 仅 app 内重构，补任务记录 + 路线图进度

## 验证计划

- [ ] `pnpm --filter swell-calendar-s2 exec tsc --noEmit`
- [ ] `pnpm --filter swell-calendar-s2 build`
- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] 浏览器验收：首屏 loading→渲染；新建/编辑/删除闭环；删空显示 empty；刷新还原。

## 风险与回滚

- 风险：重构数据层可能改变 P5 的持久化语义。缓解：localStorage key 名与四层模型完全沿用，
  仅迁移代码位置，行为等价。
- 回滚方式：还原 `App.tsx`，删除 `dataSource.ts` / `useCalendarData.ts`。

## 实施结果

- 实际改动：
  - 新增 `src/dataSource.ts`：`CalendarDataSource` 接口 + `LocalStorageDataSource`（内部三层叠加，
    对外扁平 async CRUD，id 生成下沉，每方法 180ms 模拟 IO 延迟）+ `dataSource` 默认单例。
  - 新增 `src/useCalendarData.ts`：`{ events, status, error, reload, createEvent, updateEvent,
    deleteEvent }`，挂载即 `list()`，mutation 后静默重拉，StrictMode 双跑用 `aliveRef` 防竞态。
  - `App.tsx`：删除三个事件 localStorage key / state / 三个持久化 effect / `allEvents` 四层
    `useMemo`；改为消费 hook。`inputToCalEvent` → `inputToDraft`（产出无 id 的 `EventDraft`）。
    canvas 新增 loading（spinner）/ error（可重试）/ empty（无任何事件 → 新建 CTA）三态。
  - `styles/app.css`：新增 `.data-state` 系列样式 + `data-state-spin` 关键帧。
- 与原计划的偏差：无。UI 偏好（`ui-prefs`）按计划保留在 App 内未走数据源。
- 验证结果：`tsc --noEmit` ✅ · `vite build`（548KB JS / 104KB CSS）✅ · `check-docs` ✅ ·
  `check-arch`（178 文件无违规）✅ · 浏览器（5180）：首屏 loading→scheduler 完整渲染 6 资源 +
  种子事件，控制台零错误，数据经新数据源链路流通。
- 剩余问题：无后端，默认实现仍 localStorage；接口已对齐真后端形态，替换时只改 `dataSource` 单例一处。
