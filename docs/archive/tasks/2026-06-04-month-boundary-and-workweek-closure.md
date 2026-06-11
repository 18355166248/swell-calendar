# 2026-06-04 month boundary and workweek closure

## 背景

功能审计显示，`Month` 视图当前处于“可用，但边界不稳定”的状态。

已确认的问题：

- `SPEC` 仍写月视图 `workweek` 待完善
- `Month.tsx` 已尝试按 `workweek` 过滤表头
- `month.controller.ts` 的 `getMonthWeeks()` 仍固定生成 7 列周矩阵，没有真正进入 `workweek` 语义
- `getMonthDayNames()` 在 `startDayOfWeek` 偏移后，标题标签仍按未偏移顺序取值，存在表头错位风险

这说明 month 目前不是“文档落后于实现”，而是“实现和规格都处于半闭环状态”。

## 目标

- 收紧 month 的真实支持边界
- 修复 `startDayOfWeek` 表头标签错位风险
- 让 month 的 `workweek` 真正进入周矩阵与渲染链
- 补 month 的最小测试，避免后续继续漂移

## 非目标

- 不扩展 month 的新功能范围
- 不处理 recurrence / timezone
- 不改 scheduler / timeline 逻辑

## 影响范围

- 文档：
  - `docs/tasks/2026-06-04-month-boundary-and-workweek-closure.md`
  - `packages/calendar/SPEC.md`
- 代码：
  - `packages/calendar/src/components/view/Month.tsx`
  - `packages/calendar/src/controller/month.controller.ts`
  - `packages/calendar/src/controller/month.controller.spec.ts`
  - `packages/calendar/src/stories/Calendar/Month.stories.tsx`

## 方案

1. `getMonthDayNames()` 改为按偏移后的真实 weekday 取 label
2. `getMonthWeeks()` 接入 `workweek`，输出与 month 表头一致的周矩阵
3. `MonthGrid` 使用实际列数渲染，而不是默认假定 7 列
4. 补 month controller 单测：
   - `startDayOfWeek` 生效
   - `workweek` 仅输出工作日列
5. 若闭环完成，同步把 `SPEC` 中 month 状态从“workweek 待完善”收紧为真实支持描述

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `pnpm --filter swell-calendar test -- month.controller`

## 实施结果

- 实际改动：
  - 将 month 表头顺序逻辑下沉到 `month.controller.ts`，新增 `getMonthDayNames()`
  - 修复 `startDayOfWeek` 偏移后仍按原始索引取 label 的问题
  - `getMonthWeeks()` 进入 `workweek` 语义，周矩阵不再固定 7 列
  - 修复 month 周结束判断仍写死第 7 列的实现缺口
  - `getMonthEventRows()` 改为按实际列数处理 `overflow` 与 `endCol`
  - `Month.tsx` 改为向 `MonthGrid` 传入真实列数
  - 新增 `Workweek` story，补 month 的最小可视回归入口
  - `SPEC` 中 month 状态描述更新为支持 `startDayOfWeek` 与 `workweek`
- 验证结果：
  - `node scripts/check-docs.mjs` 通过
  - `node scripts/check-arch.mjs` 通过
  - `pnpm --filter swell-calendar test -- month.controller` 通过
  - 测试总结果为 `12 files / 154 tests passed`
- 剩余问题：
  - month 当前仍是“事件可用”状态，尚未扩展到 scheduler 级交互能力
  - month 的 story / 测试密度仍低于 scheduler，后续若继续扩 month，应先补更完整的回归面
