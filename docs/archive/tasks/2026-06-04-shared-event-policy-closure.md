# 2026-06-04 shared event policy closure

## 背景

功能审计显示，`scheduler` 已将 `shared events` 作为公开承诺能力，但资源级策略的实现还没有完全收口。

当前一个事件可以通过 `resourceIds` 同时出现在多个资源列中，但资源级：

- `eventDragInTime`
- `eventResize`
- `eventOverlap`
- `eventDragBetweenResources`

在校验时仍主要按第一个资源处理，和“共享事件属于多个资源”的语义不完全一致。

## 目标

- 为 shared events 定死资源级策略语义
- 在 `SPEC` 中写清楚 shared events 与资源级策略的关系
- 补单测，覆盖 overlap / resource policy / cross-resource move
- 收口当前实现，不再只按 `resourceIds[0]` 判定

## 非目标

- 不进入 `recurrence / timezone / external DnD`
- 不调整 `shared events` 的渲染布局语义
- 不改 timeline / month 逻辑

## 影响范围

- 文档：
  - `packages/calendar/SPEC.md`
  - `docs/tasks/2026-06-04-shared-event-policy-closure.md`
- 代码：
  - `packages/calendar/src/controller/scheduler-validation.ts`
  - `packages/calendar/src/controller/scheduler-validation.spec.ts`
  - `packages/calendar/src/controller/scheduler-overlap.spec.ts`

## 方案

shared events 的资源级策略采用保守语义：

1. 一个事件命中的所有关联资源都参与资源级策略判定
2. 布尔优先级：
   - 任一关联资源显式 `false`：拒绝
   - 否则任一关联资源显式 `true`：允许
   - 否则回退到全局策略或现有默认语义
3. `dragBetweenResources` 对 source / target 资源同时生效：
   - 旧关联资源集合参与判定
   - 目标资源也参与判定

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `pnpm --filter swell-calendar test -- scheduler-validation scheduler-overlap`

## 实施结果

- 实际改动：
  - 在 `SPEC` 中明确 shared events 的资源级策略语义：命中的所有资源共同参与判定，`false > true > fallback`
  - 更新 `scheduler-validation.ts`，不再只按 `resourceIds[0]` 处理资源级策略
  - `eventDragInTime / eventResize` 改为检查所有命中资源
  - `eventDragBetweenResources` 改为同时检查 source 资源集合与 target 资源
  - `eventOverlap` 改为按所有命中资源归并后再参与与全局策略的优先级判断
  - 补充 shared event 的资源策略单测
- 验证结果：
  - `node scripts/check-docs.mjs` 通过
  - `pnpm --filter swell-calendar test -- scheduler-validation scheduler-overlap` 通过
  - 测试总结果为 `11 files / 150 tests passed`
- 剩余问题：
  - `shared events` 的布局与资源策略闭环已收口，但 `month` 状态定义仍需单独收敛
  - `recurrence / timezone / external DnD` 仍未进入实现范围
