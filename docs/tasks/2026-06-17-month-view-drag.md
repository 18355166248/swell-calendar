# 月视图拖拽交互（move / resize / create）

> 文件名：`2026-06-17-month-view-drag.md`
> 对标参考：mobiscroll React Scheduler 月视图（switching-calendar-scheduler-agenda demo）

## 背景

月视图（`components/view/Month.tsx` + `month/MonthGrid.tsx` + `month/MonthEvent.tsx`）当前事件卡片只有点击，没有任何拖拽能力。`SPEC.md` 标注月视图为 🟡「交互能力仍未扩展」。Timeline 视图已实现完整的日粒度拖拽（move / resize / create），月视图本质上是它的二维版本（周行 × 日列，事件为跨天全天条），可镜像其分层落地。

## 目标

分三步为月视图补齐拖拽能力，与 scheduler / timeline 保持一致的开关、校验、回调语义：

1. **拖动移动（换天）**：按住事件条拖到另一日期格子，按天平移 `start/end`，保留时长与跨天天数 → `onEventUpdate`。
2. **两端 resize（改跨天天数）**：拖动事件条左/右边缘改 `start` 或 `end` 日期 → `onEventUpdate`。
3. **空白拖拽创建**：在空白日期格子横向框选生成全天事件 → `onEventCreate`。

本任务文档覆盖三步整体设计；实现按步推进，每步独立可验证。三步（move / resize / create）均已完成。

## 非目标

- 不做时分级拖拽（月视图为日粒度，时分保持不变）。
- 不做跨实例拖动 / 跨日历桥（month 不接入 cross-instance bridge）。
- 不做 overlap / invalid 区间校验（与 timeline 首版一致，后续增量）。
- 不改 day / week / scheduler / timeline 既有交互。

## 影响范围

- 代码：
  - 新增 `controller/month-interaction.ts`（纯函数：命中测试 + move/resize/create 改写）
  - 新增 `controller/month-validation.ts`（开关 + per-event + onValidateEventChange 校验）
  - 新增 `components/month/MonthInteractionContext.tsx`（finder / commit / 预览 setter）✅ 已完成（move + resize：MonthDragPreview / MonthGridPositionResult / MonthInteractionValue + Provider/useMonthInteraction；create 后续扩展）
  - 新增 `hooks/month/useMonthEventDrag.ts`（基于 `useDrag` 的 per-event 交互）✅ 已完成（支持 move + resize：flatOffset 求 dayDelta，输出幽灵条预览并提交 commitMove/commitResize）
  - 改 `components/month/MonthGrid.tsx`（gridRef + 幽灵预览条 + Provider）✅ 已完成（挂载 MonthInteractionProvider，注入 gridPositionFinder/commitMove/commitResize/setDragPreview；move / resize 都经 shouldAcceptMonthEventChange 校验后触发 onEventUpdate；仅在 dragPreview.weekIndex 匹配的周行渲染幽灵条，跨周多段后续扩展）
  - 改 `components/month/MonthEvent.tsx`（move 手柄 onMouseDown；step2 加 resize 手柄）✅ 已完成（新增 weekIndex prop，绑定拖拽移动与左右 resize 手柄；仅事件真实起止段显示手柄，保留 onClick 打开事件）
  - 改 `types/options.type.ts` `MonthOptions`（新增 `dragToMove/dragToResize/dragToCreate`）
  - 改 `slices/options.slice.ts`（`initializeMonthOptions` 默认值）
- 文档：`SPEC.md`（月视图能力升级 + 拖拽测试覆盖表加 Month 行）、本任务文档
- 运行时行为：月视图事件可拖动改期与左右 resize（受开关与 `isReadOnly` 控制；默认开启 move/resize/create，`isReadOnly` 时全关）

## 现状

- `MonthGrid` 用周行百分比布局，每个 `month-cell` 是一个日期格；事件在 `month-event-layer` 内用 `MonthEvent` 绝对定位（`startCol` / `colspan` / `slotIndex` 三元组）。
- `MonthEvent` 仅 `onClick` → `onEventClick`，无 mousedown 拖拽。
- `MonthOptions` 仅含 `startDayOfWeek / dayNames / narrowWeekend / workweek / isAlways6Weeks / visibleWeeksCount / visibleEventCount`，无拖拽开关。
- 已有可复用基建：`hooks/common/useDrag.ts`、`slices/dnd.slice.ts`、`helpers/drag.ts`（`DRAGGING_TYPE_CREATE`）。
- Timeline 范本：`TimelineGrid.tsx`（gridPositionFinder + acceptAndDispatch + commitMove/Resize/Create + 幽灵条）、`useTimelineEventDrag.ts`、`timeline-calendar.ts`、`timeline-validation.ts`、`TimelineInteractionContext.tsx`。

## 方案

### 分层（镜像 Timeline）

```
controller/month-interaction.ts    纯函数，无 React
controller/month-validation.ts     校验
components/month/MonthInteractionContext.tsx   Context Provider/Hook
hooks/month/useMonthEventDrag.ts    useDrag 封装
components/month/MonthGrid.tsx      gridRef + 预览渲染 + Provider 挂载
components/month/MonthEvent.tsx     手柄绑定
```

数据流：`useDrag` 捕获鼠标 → `month-interaction` 命中测试得目标日 → `setDragPreview` 实时画幽灵条 → `mouseup` → `month-validation` 校验 → 通过则 `onEventUpdate`(move/resize) / `onEventCreate`(create)；未变更不提交。

### 命中测试

`getMonthDayOffsetFromPoint({ rect, clientX, clientY, weekCount, colCount, weeks })`：

- 由 `clientY - rect.top` 除以行高得 `weekIndex`（夹紧 `[0, weekCount-1]`）。
- 由 `clientX - rect.left` 除以列宽得 `colIndex`（夹紧 `[0, colCount-1]`）。
- 压平为「自网格首日起第几天」：`flatOffset = weekIndex * colCount + colIndex`。
- 也可返回目标 `DayjsTZDate`（`weeks[weekIndex][colIndex]`），供 move/resize 直接取日期。

注：`narrowWeekend` 下列宽不等。首版用等宽近似（`rect.width / colCount`）做命中测试；若 `narrowWeekend` 开启则按 `getRowStyleInfo` 的列宽数组做精确命中（与渲染共用同一份 `rowStyleInfo`）。

### 事件改写（纯函数）

- `computeMovedMonthEvent(prev, dayDelta)`：`start`/`end` 各 `addDate(dayDelta)`，时分不变，跨天天数不变。
- `computeResizedMonthEvent(prev, edge, dayDelta)`：`edge==='start'` 改 `start`，`edge==='end'` 改 `end`；夹紧保证 `start <= end`（至少 1 天）。
- `buildCreatedMonthEvent(startDate, endDate)`：生成全天事件（`isAllday: true`，`start` 取较早日 00:00，`end` 取较晚日 23:59:59 或次日 00:00，按既有全天约定）。

### 校验与开关（`month-validation.ts`）

镜像 `timeline-validation.ts` 的 `shouldAcceptTimelineEventChange`：

- `action` 对应开关：`move → dragToMove`、`resize → dragToResize`、`create → dragToCreate`。
- per-event：`editable !== false`、move/resize 额外查 `draggable`/`resizable`（与既有事件字段语义一致）。
- 宿主回调 `onValidateEventChange`（若存在）。
- 拒绝时触发 `onEventUpdateFailed` / `onEventCreateFailed`（若宿主提供）。

### 选项与默认值

`MonthOptions` 新增：

```ts
dragToMove?: boolean;
dragToResize?: boolean;
dragToCreate?: boolean;
```

`initializeMonthOptions` 默认：三者均 `true`；当顶层 `isReadOnly` 为真时，在归一化时强制三者为 `false`（与 scheduler/timeline 的只读语义一致）。

### 预览渲染

`MonthGrid` 内 `dragPreview` state：move/resize 时在落点周行渲染半透明幽灵条（用与 `MonthEvent` 相同的 `startCol/colspan/top` 定位算法）；create 时在框选范围渲染。跨周的多段渲染首版简化为「主落点周行单段高亮」，避免一次性引入多段布局复杂度（可在 step1 收尾评估是否需要补多段）。

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`（月视图能力行升级；拖拽测试覆盖表新增 Month 行）
- [x] `packages/calendar/SPEC.md` `month?:` 选项块新增 `dragToMove/dragToResize/dragToCreate` 三个开关（Step 1 已落地）
- [x] 更新 `docs/ARCHITECTURE.md`（无结构变更；新增模块均落在既有 controller / hooks / components 分层内，无需改动真源）
- [ ] 新增或更新 ADR（无需）
- [x] 补任务记录（本文件，设计阶段已建）

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [x] `pnpm lint`
- [x] `pnpm -r exec tsc --noEmit`
- [x] `pnpm test`（含新增 `month-interaction.spec.ts` ✅ / `month-validation.spec.ts` ✅ / `month.controller.spec.ts` 布局与溢出 ✅）
- [x] Storybook 交互测试 `MonthDragMove`：模拟拖拽换天，断言 `onEventUpdate` 入参的新 `start/end`
- [x] Storybook 交互测试 `MonthDragResize`：模拟拖拽右边缘延长结束日期，断言仅 `end` 变化
- [x] Storybook 交互测试 `MonthDragCreate`：空白横向框选创建全天事件
- [x] Storybook 交互测试 `MonthDragCreateCrossWeek`：跨周框选，断言占位阴影分两段且创建跨周事件
- [x] Storybook 用例 `MonthEventOverflow`：单元格事件占满后折叠为「+N 更多」

### 测试覆盖补强（2026-06-17 追加）

为「不同拖拽 / resize / 新建 / 换行 / 占满展示」补齐分层测试，并把拖拽数学从 hooks 下沉到 `controller/month-interaction.ts` 以便纯函数单测：

- 新增纯函数 `splitFlatRangeIntoWeekSegments`（区间按周切多段，换行渲染核心）、`computeMovePreviewRange`、`computeResizePreviewRange`；`useMonthEventDrag` / `useMonthCreate` / `MonthGrid` 改为复用之，行为不变。
- `month-interaction.spec.ts`：补 split（同周 / 跨两周 / 跨三周 / 整周占满 / 越界 / 空区间）、move 预览（同周 / 换行 / 末尾夹紧）、resize 预览（左右延长 / 双向夹紧）共 13 条。
- `month.controller.spec.ts`：补 `getMonthEventRows` 布局（单日 / 同周多日 colspan / 跨周换行分两周裁剪 / slotIndex 堆叠 / 占满溢出 `overflowByCol` / 多列溢出计数）共 6 条。

## 风险与回滚

- 风险：
  - `narrowWeekend` 下命中测试列宽不等，等宽近似会偏移 → 用 `rowStyleInfo` 列宽精确命中规避。
  - 跨周事件的幽灵条多段渲染复杂 → 首版单段落点高亮，降低范围。
  - 与现有 `onEventClick` 冲突（mousedown 后误判点击）→ 复用 `useDrag` 的 `MINIMUM_DRAG_MOUSE_DISTANCE` 阈值区分点击与拖拽。
- 回滚方式：新增能力全部在新增文件 + 选项开关后，回滚只需移除 `MonthEvent` 的手柄绑定与 `MonthGrid` 的 Provider/预览；选项默认可临时置 `false` 关闭。

## 实施结果

- 实际改动：
  - 第 3 步（create）：`controller/month-interaction.ts` 新增 `buildCreatedMonthEvent`（横向框选 [startDay,endDay] → 全天事件，自动校正起止顺序），补 3 条单测；新增 `hooks/month/useMonthCreate.ts`（基于 `useDrag` 的网格空白横拖创建，落点用 flatOffset 线性区间表达，预览首版仅渲染起点周行单段）；`MonthGrid.tsx` 增 `commitCreate`（经 `shouldAcceptMonthEventChange('create')` 校验后触发 `onEventCreate`）并把 `useMonthCreate` 绑定到周行 `onMouseDown`；`MonthEvent.tsx` 把事件主体 move 的 `onMouseDown` 包一层 `stopPropagation`，避免拖动事件时误触发空白创建；新增 Storybook 交互用例 `MonthDragCreate`。`useMonthCreate` 因在 Provider 提供方（MonthGrid）层绑定、无法消费自身 context，交互原语以参数注入而非 `useMonthInteraction`。
  - 新增 `controller/month-interaction.ts` 与 `controller/month-validation.ts`，补齐月视图 move 所需的命中测试、按天平移和校验链路，并分别补了 TDD 单测。
  - 新增 `components/month/MonthInteractionContext.tsx` 与 `hooks/month/useMonthEventDrag.ts`，把月视图事件拖拽状态与提交逻辑从组件层拆出，保持与 timeline 相同的分层风格；当前已覆盖 move + resize。
  - 改 `components/month/MonthGrid.tsx` / `MonthEvent.tsx` 接入 move + resize 交互：事件主体 `onMouseDown` 触发拖拽移动，左右边缘手柄触发 resize，Grid 负责落点换算、幽灵条预览和 `onEventUpdate` 提交。
  - 改 `types/options.type.ts` / `slices/options.slice.ts` / `controller/month.controller.spec.ts`，补齐 `MonthOptions.dragToMove/dragToResize/dragToCreate` 默认值、只读归一化和类型 fixture。
  - 更新 `packages/calendar/SPEC.md`，同步月视图能力描述、`month` 选项块和拖拽测试覆盖表；新增 `packages/calendar/src/stories/Calendar/Month.stories.tsx` 回归 `MonthDragMove` / `MonthDragResize` 交互用例。
- 与原计划的偏差：
  - `docs/ARCHITECTURE.md` 未改。原因是本次新增文件全部落在既有 `controller / hooks / components` 分层内，没有引入新的结构规则或依赖方向变化。
  - 幽灵条已支持跨周多段预览：`MonthDragPreview` 改为携带压平区间 `{ startFlat, endFlat }`，`MonthGrid` 按周切分，move / resize / create 跨周拖拽时每个所在周各渲染一段占位阴影（修复「向下换行拖拽占位阴影缺失」问题）。
- 验证结果：
  - `month-interaction.spec.ts` 11/11 通过；`month-validation.spec.ts` 4/4 通过。
  - 全量 `pnpm --filter swell-calendar test` 310 条测试通过，无回归。
  - `pnpm --filter swell-calendar lint` 通过。
  - `pnpm --filter swell-calendar exec tsc --noEmit` 通过。
  - `node scripts/check-docs.mjs` 与 `node scripts/check-arch.mjs` 通过。
  - Storybook 交互用例 `MonthDragMove` / `MonthDragResize` 已补齐；浏览器侧实测 `MonthDragMove` 与 `MonthDragResize` 均能完成回调断言，其中 `MonthDragResize` 已修正为跨周真实落点（06-12 → 06-14）。
- 剩余问题：
  - `narrowWeekend` 仍使用等宽列命中测试，尚未接入 `rowStyleInfo` 做精确列宽命中。
  - 仓库全量 Storybook runner 仍有月视图之外的既有失败（`Scheduler.Interactions` / `Scheduler.Regression`），本次未顺手处理。
