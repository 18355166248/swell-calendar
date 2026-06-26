# 2026-06-26 recurrence 日视图点击修复

## 背景

日视图中用户创建的重复事件实例（例如标题为 `111` 的卡片）可见但点击后无法稳定打开详情/编辑入口。普通事件不受影响。

后续验证发现：进入详情后编辑重复实例时，宿主表单提交没有保留被点实例的 recurrence 元数据，导致：

- 选择「仅此次」时无法写入当前发生日期对应的 exception override。
- 选择「此次及之后」时虽然创建了新系列，但旧系列的 recurrence 截断结果没有写回，旧卡片仍继续出现。
- 选择「此次及之后」时，之后实例已生效但当前本次未生效：新系列继承父事件首日作为 start，且 weekly 规则可能仍锚定旧星期几，导致本次日期没有被新系列覆盖。
- 每周重复任务点击编辑时，表单重复选项显示为「不重复」而不是「每周」：展开实例不携带 recurrence，编辑态合并时覆盖掉了父事件规则。
- 每周重复任务在编辑表单中改成「每天」不生效：实例编辑提交没有把 recurrence 规则变化写入 scope controller，且 controller 的 `all` / `following` 分支会屏蔽 recurrence 字段。

## 目标

- 修复 day/week time-grid 中 recurrence 展开实例的轻点点击链路。
- 修复宿主 S2 demo 中重复实例表单编辑的 `single` / `following` 写回链路。
- 保持已有 recurrence 展开、拖拽、resize 与编辑作用域 API 不变。

## 非目标

- 不调整公开 API。
- 不改变 recurrence 规则计算与 exceptions 语义。
- 不重构 time-grid 拖拽状态机。

## 方案

recurrence 实例每次 render 都会重新 `new EventModel(inst)`，默认内部 `cid` 会变化；而 `TimeEvent` 的 React key 与拖拽 item type 都依赖 `cid`。轻点卡片时 pointerdown 会初始化拖拽状态并触发重渲染，重复实例因 key 变化被卸载，导致 pointerup 监听丢失，最终不会触发 `onEventClick`。

修复方式：

- recurrence 展开实例按稳定实例 id 生成内部 `__cid`。
- `EventModel` 初始化时尊重内部 `__cid`，让展开实例跨 render 保持相同 `cid`。
- 详情弹层保留原始引擎事件对象，点击「编辑」时保存 `recurrenceParentId` 与 `recurrenceOccurrenceDate`。
- 表单提交重复实例时先弹作用域选择，再通过 `applyRecurrenceEditScope` 写回父事件或创建新系列。
- `engineEventToDraft` raw 更新路径优先采用引擎侧最新 `recurrence`，保证 `following` 截断后的 `until` 不被旧 raw 覆盖。
- `following` 新系列显式从被编辑 occurrence 开始；若 weekly 实例改到新星期几，同步 `byWeekDays` 到新起点，避免当前本次被展开规则跳过。
- 宿主写回 `following` 时顺序等待旧系列截断完成后再创建新系列，降低并发写入造成旧卡片残留的风险。
- 重复实例进入编辑时，使用实例 draft 回填日期/时间，但显式保留父事件 `recurrence` / `recurringExceptions`，确保「每周」等重复规则在表单中正确选中。
- 表单提交重复实例时把用户选择的 recurrence 带入 changes；`all` scope 直接更新父事件规则，`following` scope 截断旧系列后用新规则创建后续系列；`single` scope 忽略 recurrence 规则变化，只保留本次覆盖字段。
- recurrence 规则在 daily / weekly / biweekly / none 间切换时清空旧规则 exceptions，避免旧发生日期污染新规则。

## 验证

- `node scripts/check-docs.mjs`：通过
- `node scripts/check-arch.mjs`：通过
- `./node_modules/.bin/tsc --noEmit -p packages/calendar/tsconfig.json`：通过
- `./node_modules/.bin/tsc --noEmit -p apps/swell-calendar-s2/tsconfig.json`：通过
- `packages/calendar/node_modules/.bin/vitest run src/controller/scheduler-recurrence.spec.ts`：通过（16 tests；沙箱内 Vite WebSocket 监听 `0.0.0.0:24678` 报 EPERM，但测试进程最终通过）
- `node_modules/.pnpm/node_modules/.bin/vitest run apps/swell-calendar-s2/src/calendarData.spec.ts`：通过（21 tests；同样有 Vite WebSocket EPERM 提示但测试通过）
- `cd packages/calendar && node_modules/.bin/vitest run src/controller/recurrence-edit-scope.spec.ts`：通过（19 tests；沙箱内 Vite WebSocket 监听 `0.0.0.0:24678` 报 EPERM，但测试进程最终通过）
- in-app browser：刷新 `/app/calendar/day` 后，点击标题为 `111` 的 recurrence 日视图卡片可打开详情弹层；点击「编辑」后进入编辑表单并回填标题 `111`
- in-app browser：刷新 `/app/calendar/week` 后，编辑重复实例并选择「仅此次」，只有被选中的 6/28 实例变为 `single-scope-ok`；选择「此次及之后」后，旧系列只保留 6/26，新系列 6/27、6/28 均变为 `following-scope-ok`
- in-app browser：在 `/app/calendar/day` 中编辑 6/26 的重复实例并选择「此次及之后」后，当前本次卡片立即变为 `following-current-ok`；切到 6/27 后后续实例同样为 `following-current-ok`
- in-app browser：在 `/app/calendar/week` 中打开标题 `33` 的每周重复实例并点击编辑，重复选项中「每周」按钮为 `seg-pill on`
- in-app browser：在 `/app/calendar/day` 中打开标题 `33` 的重复实例编辑表单，依次点击「每天 / 每周 / 双周 / 不重复 / 每周 / 每天」，每一步都只有当前按钮为 `seg-pill on`
- in-app browser：将标题 `33` 从「每周」改为「每天」并选择「全部」后，6/26 与 6/27 均出现 `33`；重新打开 6/27 实例编辑，重复选项中「每天」按钮为 `seg-pill on`

## 风险

- 稳定 `__cid` 是内部字段，不作为公开宿主 API 使用。
- hash 碰撞概率很低；若未来需要完全消除，可把 recurrence 实例缓存上移到 controller 层。
