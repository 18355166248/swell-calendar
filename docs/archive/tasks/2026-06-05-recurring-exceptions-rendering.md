# 2026-06-05 Phase 3 Step 32 — recurring exceptions 掋入渲染链

## 背景

Phase 3 Step 30 已完成 recurrence 视口内展开（`expandRecurrence`），和类型补充（`recurringExceptions` / `recurringExceptionRule`），Step 31 已实现视口内展开逻辑接入代码。 但 recurring exceptions 的跳过/替换逻辑尚未进入 scheduler 的渲染链， 当前 `scheduler-layout.ts` 中 `getSchedulerViewEvents` 未处理 recurrence 事件展开.

## 目标

 - 将 `expandRecurrence` 和 `recurringExceptions` 掋入 scheduler 的渲染链 - 带 `recurrence` 的事件在视口内展开为多个实例 - 例外日期（`recurringExceptions`）跳过实例或替换实例属性xiam 
 - 补 Scheduler/Recurrence Story 进行可视化验证
 - 更新 SPEC 和 agent-plan/05 文档

 ##  非目标

 - 不进入 timezone 鍩换
 不进入 external DnD / 跨实例拖动
 - 不改 timeline / month 逻辑
 - 不调整 recurrence 展开算法本身
 ## 影响范围

 - 文档：
   - `docs/tasks/2026-06-05-recurring-exceptions-rendering.md`（新建）
   - `packages/calendar/SPEC.md`（更新 recurring exceptions 描述）
   - `docs/agent-plan/05-advanced-scheduling.md`（更新 Step 32 状态）
 - 代码：
   - `packages/calendar/src/controller/scheduler-layout.ts`（接入 expandRecurrence）
   - `packages/calendar/src/controller/scheduler-recurrence.ts`（新建， 承接展开与 exceptions 复滤逻辑）
   - `packages/calendar/src/stories/Calendar/Scheduler.stories.tsx`（新增 Recurrence story）
 ## 方案

 1. 新建 `controller/scheduler-recurrence.ts`， 承接 `expandRecurrence` 并叠加 `recurringExceptions` 的跳过/替换逻辑
    - 辐索带 `recurrence` 的事件
    - 调用 `expandRecurrence` 在视口内展开
    - 对每个展开实例：
      - 检查 `recurringExceptions` 是否包含该日期
      - 如果 `skipped: true`， 不渲染
      - 如果有 `overrides`, 合并 overrides 到实例的事件属性
      - 如果不在 exceptions 中, 正常渲染为独立实例
    - 返回展开后的 `EventUIModel[]`
 2. 在 `scheduler-layout.ts` 的 `getSchedulerViewEvents` 中接入 recurrence 展开
    - 对 events 中有 `recurrence` 的事件调用展开逻辑
    - 展开后的实例继承原事件的 `resourceId / resourceIds / color / backgroundColor` 等视觉属性
    - 展开后的实例分配新 `id`（`${原id}-${展开日期}`）
 3. 新增 Scheduler/Recurrence Story
    - 展示 daily / weekly / monthly recurrence 在 scheduler 中的渲染
    - 展示 recurring exceptions 的跳过/替换效果
 ## 验证计划

 - [ ] `node scripts/check-docs.mjs`
 - [ ] `node scripts/check-arch.mjs`
 - [ ] `pnpm --filter swell-calendar exec tsc --noEmit`
 - [ ] `pnpm --filter swell-calendar test`
 - [ ] `pnpm lint`
 ## 风险与回滚

 - 风险: 展开后的实例与原事件共享 `resourceId`， 可能影响 overlap / dragBetweenResources 刣验策略判定
   - 回滚方式: 新增文件可独立删除，`scheduler-layout.ts` 改动可回退