# 2026-05-06 scheduler v2 foundation

## 背景

当前 `swell-calendar` 已经有 `day/week/month(开发中)` 和一个基础 `scheduler` demo，但公开 API 仍停留在内部 store 驱动阶段，无法承接对齐 Mobiscroll Scheduler 所需的视图体系、资源模型和宿主生命周期。

## 目标

- 建立 v2 公共 API 的基础类型和宿主入口
- 扩展资源调度所需的数据模型
- 暴露命令式实例 API 和基础回调能力
- 为 `scheduler/timeline` 双视图能力铺路
- 将 `scheduler` 与 `timeline` 视图从同一实现中拆开

## 非目标

- 不在本次实现完整 Mobiscroll 级 scheduler/timeline 产品能力
- 不实现 recurrence editor、agenda、移动端适配
- 不重写现有布局算法

## 影响范围

- 代码：公开类型、store、入口组件、打包导出
- 文档：`SPEC.md`、本任务文档
- 运行时：增加宿主 props + ref API，现有内部 stories 继续可用

## 方案

1. 新增 `EventCalendar` 公开宿主入口，内部创建和同步 store。
2. 扩展 `EventObject`、`ResourceInfo`、`Options`，加入 v2 基础字段。
3. 为 store 增加 `setDate`、`setEvents` 等基础能力。
4. 增加 `timeline` 视图类型，并允许 toolbar 根据配置显示视图按钮。
5. 建立 callbacks context，先打通 `onEventClick` 和 `onPageChange`。
6. 修正包导出面，统一到 `src/index.ts`。
7. 将 `timeline` 保持为横向资源时间轴，将 `scheduler` 重构为垂直 time-grid + 资源列。

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 更新本任务文档，记录 scheduler/timeline 拆分结果

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [ ] `pnpm lint`
- [x] `pnpm --filter swell-calendar exec tsc --noEmit`
- [x] `pnpm --filter swell-calendar build`

## 风险与回滚

- 风险：公开 API 先于内部实现成熟，可能出现“类型已开放但能力未全部生效”
- 回滚方式：保留内部 `CalendarApp + store` 用法，撤回新的对外导出

## 实施结果

- `timeline` 保持为横向资源时间轴，迁移到独立的 `view/Timeline.tsx`
- `scheduler` 重构为垂直 `TimeGrid`，按“日期 × 资源”生成列
- `TimeGrid` 现在会基于列上的 `resourceId` 过滤事件，支持资源列归属
- 新增 `SchedulerHeader`，在资源调度视图顶部展示日期组和资源列头
- `TimeGrid` 现在会向宿主发出 `onRangeSelect` / `onEventCreate`，调度视图可感知资源化时间区间选择
- 时间事件拖拽移动结束后会发出 `onEventUpdate`，宿主可接管真正的数据提交
- 时间事件 resize 结束后也会发出 `onEventUpdate`，当前先覆盖单列 time-grid 事件
- `create/move/resize` 在进入宿主回调前可通过 `onValidateEventChange` 做同步拦截
- `create/move/resize` 现在还会先走内建 `blockedTimes` 校验，适合封禁时间段场景
- 当前范围仍是 Phase 0/1 底座建设，未包含 Mobiscroll 级别的 overlap policy、blocked time、agenda、递归展开和移动端适配
