# 2026-05-06 scheduler v2 foundation

## 背景

当前 `swell-calendar` 已经有 `day/week/month(开发中)` 和一个基础 `scheduler` demo，但公开 API 仍停留在内部 store 驱动阶段，无法承接对齐 Mobiscroll Scheduler 所需的视图体系、资源模型和宿主生命周期。

## 目标

- 建立 v2 公共 API 的基础类型和宿主入口
- 扩展资源调度所需的数据模型
- 暴露命令式实例 API 和基础回调能力
- 为 `scheduler/timeline` 双视图能力铺路

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

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 无规格变更，仅补任务记录

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] `pnpm lint`
- [ ] `pnpm -r exec tsc --noEmit`

## 风险与回滚

- 风险：公开 API 先于内部实现成熟，可能出现“类型已开放但能力未全部生效”
- 回滚方式：保留内部 `CalendarApp + store` 用法，撤回新的对外导出
