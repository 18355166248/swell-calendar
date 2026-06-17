# 移除拖拽 ESC 取消能力

## 背景

当前仓库在 day / week / scheduler / timeline / month 的拖拽链路里支持按 `Escape` 取消进行中的拖拽，并在 Storybook 中保留了多个「ESC 取消拖拽」demo。当前需求明确认为这组交互无价值，且 demo 噪音高，需要连同底层实现一起移除。

## 目标

- 删除所有「ESC 取消拖拽」相关 demo。
- 移除拖拽底座 `useDrag` 的 `Escape -> cancel` 能力。
- 清理为 ESC 取消服务的取消态、提交流程分支和测试。

## 非目标

- 不移除 `Enter / Space` 触发事件点击的键盘可达性。
- 不调整普通鼠标拖拽 / resize / create 的既有提交逻辑。
- 不处理与本次改动无关的历史 Storybook 失败。

## 影响范围

- 代码：
  - `hooks/common/useDrag.ts`
  - `types/dnd.type.ts`
  - `slices/dnd.slice.ts`
  - `hooks/event/useDraggingEvent.ts`
  - `hooks/TimeGrid/*`
  - `hooks/Timeline/*`
  - `hooks/month/useMonthEventDrag.ts`
  - `components/events/TimeEvent.tsx`
  - `stories/Calendar/*`
- 文档：
  - `packages/calendar/SPEC.md`
  - 本任务文档
- 运行时行为：
  - 拖拽过程中按 `Escape` 不再中断本次拖拽；仅鼠标释放决定是否提交。

## 现状

- `useDrag` 在拖拽开始后向 `document` 绑定 `keydown`，按 `Escape` 会触发 `onPressESCKey` 并把 DnD 状态置为 `CANCELED`。
- time-grid / timeline / month 都接了这条取消链，用于清预览、清 CSS 类，并在提交流程里通过 `isDraggingCanceled` 跳过提交。
- Storybook 里保留了多个专门演示 `ESC` 取消拖拽的 demo。

## 方案

- 删除 `DragListeners.onPressESCKey` 与 `useDrag` 内部的键盘监听，只保留鼠标驱动拖拽。
- 删除 `DraggingState.CANCELED`、`dnd.cancelDrag()` 及其测试；拖拽状态只保留 `IDLE / INIT / DRAGGING`。
- 删除 `useDraggingEvent.isDraggingCanceled` 及所有提交门控分支，把拖拽结束统一收敛为 `mouseup -> reset -> 提交/清理`。
- 删除 day / week / scheduler 中专门的 `ESC 取消拖拽` stories。
- 同步 `SPEC.md`：移除拖拽测试覆盖里的 `ESC 取消` 列，并删掉 backlog 中关于 timeline `ESC 取消` 的描述。

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`
- [x] 更新 `docs/ARCHITECTURE.md`（无结构变更；本次仅删除交互分支与 demo，未改变分层）
- [ ] 新增或更新 ADR
- [x] 补任务记录（本文件）

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [x] `pnpm lint`
- [x] `pnpm -r exec tsc --noEmit`
- [x] `pnpm test`

## 风险与回滚

- 风险：
  - 删除 `CANCELED` 状态后，如果还有残留分支依赖该状态，可能导致跨实例拖拽或影子清理逻辑失效。
  - Storybook 交互用例删除后，测试覆盖表需要同步收缩，避免文档与实现脱节。
- 回滚方式：
  - 恢复 `useDrag` 的键盘监听与 `dnd` 取消态，再恢复 stories / tests。

## 实施结果

- 实际改动：
  - 删除 `useDrag` 的 `Escape` 键监听，`DragListeners` 不再暴露 `onPressESCKey`。
  - 删除 `DraggingState.CANCELED` 与 `dnd.cancelDrag()`，拖拽状态机收敛为 `IDLE / INIT / DRAGGING`。
  - 删除 `useDraggingEvent.isDraggingCanceled` 及 time-grid / timeline / month / TimeEvent / cross-instance 里的取消分支。
  - 删除 Day / Week / Scheduler 的 `ESC 取消拖拽` stories，并同步收缩相关单测。
  - 更新 `SPEC.md` 拖拽测试覆盖表，移除 `ESC 取消` 列；删掉 timeline backlog 中的 `ESC 取消` 描述。
- 与原计划的偏差：
  - 未更新 `docs/ARCHITECTURE.md`。原因是本次没有引入新模块或依赖方向调整，属于既有结构内的功能删减。
- 验证结果：
  - `node scripts/check-docs.mjs` 通过。
  - `node scripts/check-arch.mjs` 通过。
  - `pnpm --filter swell-calendar lint` 通过。
  - `pnpm --filter swell-calendar exec tsc --noEmit` 通过。
  - `pnpm --filter swell-calendar test` 通过，测试由 315 条收缩到 306 条，符合删除 ESC demo / 测试预期。
- 剩余问题：
  - 仓库里仍有与本次无关的既有 Storybook 失败（此前已确认在 scheduler 侧），本次未顺手处理。
