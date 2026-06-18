# 下沉宿主侧异步数据装配件到 packages/calendar

> 文件名：`2026-06-15-hoist-data-source-hook.md`

## 背景

`apps/swell-calendar-s2` 在 P6 把事件 CRUD 收敛到了一对宿主侧装配件：

- `dataSource.ts` 的 `CalendarDataSource` 异步 CRUD 契约
- `useCalendarData.ts` 的 loading/ready/error 三态 + CRUD + StrictMode 安全 + mutation 静默重拉 hook

这两件除了被绑死在 app 的 `CalEvent` / `EventDraft` 类型上，本体与引擎无关、与具体存储无关，是任何"把 Calendar 接到异步数据"的宿主都会重写一遍的样板。把它们泛型化后下沉到包，可让后续宿主零样板接入。

## 目标

- 在 `packages/calendar` 暴露泛型契约 `CalendarDataSource<TEvent, TDraft>`
- 暴露泛型 hook `useCalendarDataSource<TEvent, TDraft>`，行为与 app 现有 `useCalendarData` 等价
- app 改为从 `swell-calendar` 引入这两者，删除本地副本

## 非目标

- 不下沉 `LocalStorageDataSource`（含 demo 四层叠加持久化语义，属 app 演示策略）
- 不下沉 `calendarData.ts` 的 `CalEvent ↔ EventObject` 转换与 `BASE_DATE` 天偏移模型（强 app 耦合）
- 不改变引擎"只消费 `EventObject` props、数据获取归宿主"的边界——这是**宿主侧可选工具**，不进渲染/交互引擎本体

## 影响范围

- 代码：
  - 新增 `packages/calendar/src/types/dataSource.type.ts`（layer 0）
  - 新增 `packages/calendar/src/hooks/data/useCalendarDataSource.ts`（layer 8）
  - `packages/calendar/src/index.ts` 增导出
  - `apps/swell-calendar-s2/src/dataSource.ts` 改为复用包内契约，仅保留 `LocalStorageDataSource`
  - 删除 `apps/swell-calendar-s2/src/useCalendarData.ts`，app 改引包内 hook
- 文档：`packages/calendar/SPEC.md` 新增「宿主侧数据装配（可选）」小节
- 运行时行为：等价；唯一差异是通用失败兜底文案由中文改为中性英文（`e.message` 优先级不变，localStorage 实现几乎不触发兜底）

## 现状

app 的 hook/契约硬绑 `CalEvent`，无法被其他宿主复用；任何新宿主都要重抄一份三态 + StrictMode 安全逻辑。

## 方案

- 契约泛型化：`CalendarDataSource<TEvent, TDraft = Omit<TEvent, 'id'>>`，四个方法签名不变
- hook 泛型化：`useCalendarDataSource<TEvent, TDraft>(source)`，逻辑逐行搬运（loading/ready/error、`aliveRef` StrictMode 守卫、mutation 后 `refresh(false)` 静默重拉）
- 失败兜底文案改为中性英文，避免把 locale 烤进库；`e.message` 优先级保持
- app `LocalStorageDataSource implements CalendarDataSource<CalEvent>`，其余消费方按新名字接线

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`（无分层变化，hook 落 layer 8、type 落 layer 0，符合既有约束）
- [ ] 新增或更新 ADR
- [x] 仅补任务记录 + SPEC 小节

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] `pnpm --filter swell-calendar exec tsc --noEmit`
- [ ] s2 app `tsc --noEmit`

## 风险与回滚

- 风险：泛型默认 `TDraft = Omit<TEvent,'id'>` 与 app 显式 `EventDraft` 推断需对齐；失败文案语言变化（极低频路径）
- 回滚方式：还原 app 两文件 + 移除包内两文件与导出，单提交可整体 revert

## 实施结果

- 实际改动：
  - 新增 `packages/calendar/src/types/dataSource.type.ts`（`CalendarDataSource<TEvent, TDraft>`，layer 0）
  - 新增 `packages/calendar/src/hooks/data/useCalendarDataSource.ts`（泛型 hook + `CalendarDataStatus` / `UseCalendarDataSourceResult`，layer 8）
  - `packages/calendar/src/index.ts` 导出上述三者
  - `apps/swell-calendar-s2/src/dataSource.ts`：删本地 `CalendarDataSource` 接口，改 `import type { CalendarDataSource } from 'swell-calendar'`，新增 `AppDataSource = CalendarDataSource<CalEvent, EventDraft>` 别名
  - 删除 `apps/swell-calendar-s2/src/useCalendarData.ts`，`App.tsx` 改用包内 `useCalendarDataSource`
- 与原计划的偏差：无；`LocalStorageDataSource` 与 `calendarData.ts` 按计划留在 app
- 验证结果：
  - `node scripts/check-arch.mjs` ✅（183 文件无分层违规）
  - `node scripts/check-docs.mjs` ✅
  - 包 `tsc --noEmit` ✅
  - `vite build` 重建 dist ✅，新导出进入 `dist/index.d.ts`
  - app `tsc --noEmit` ✅
- 剩余问题：通用失败兜底文案由中文改为中性英文（`Failed to load calendar data` / `Calendar data operation failed`），`Error.message` 优先级不变，仅极低频兜底路径可见
