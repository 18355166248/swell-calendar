# Mobiscroll Scheduler 对齐路线图

> 本计划取代 `PLAN3-codex.md`，基于 PLAN3 review 修正与代码现状不符的标注、补充用户决策（`isAllday`/`allDay` 收敛、ResourceInfo 收敛、Phase 1A 拆三段），并增补了 timeline 不退化、控制器演进、命名约定等结构性问题。
> 主参考样例：`Mobiscroll React Scheduler Desktop Week View`
> <https://demo.mobiscroll.com/react/scheduler/desktop-week-view>
> 本轮对齐的是桌面端 `scheduler` 的产品行为、布局和交互闭环，不追求 Mobiscroll 的 API 兼容，也不复刻其内建弹窗 UI。

---

## 0. 与 PLAN3 的关系

- PLAN4 为本轮唯一有效版本
- PLAN3 冻结不再更新，保留作为历史记录
- PLAN4 落地后，后续修订继续在 PLAN4 上 patch，不再增量生成 PLAN5 / PLAN6

PLAN4 相对 PLAN3 的主要修订：

1. 修正 6 处与代码现状不符的标注（见 §3 矩阵"现状描述"列与脚注）
2. `isAllday → allDay` 收敛为本轮 Phase 1A 任务
3. `ResourceInfo` 的 `parentId / hidden` 与新增 `children / visibleResourceIds` 一并在 Phase 2 收敛
4. Phase 1A 拆分为 1A.1 / 1A.2 / 1A.3 三段
5. 失败 payload 增加 `policySource` 字段取代 `'policy'` 单值
6. 补充 timeline 不退化保障、控制器演进策略、与 v2-foundation 衔接、回归保护、命名约定

---

## 1. Summary

- **目标范围**：以 `Mobiscroll React Scheduler Desktop Week View` 为主参考，完成桌面端 `scheduler` 的核心业务闭环
- **设计原则**：行为对齐而非 API 兼容；宿主受控而非组件内部乐观状态机
- **视图边界**：`scheduler` 是近期核心；`timeline` 仅保证不退化；`agenda` 与移动端适配不进入本轮
- **实现节奏**：Phase 0 文档与 API 定版 → Phase 1A.1 API 重命名 → Phase 1A.2 布局基线 → Phase 1A.3 模板与回调 → Phase 1B 交互闭环 → Phase 2 资源调度 → Phase 3 高级调度
- **数据所有权**：组件只发交互意图、校验结果和失败原因，最终事件数据始终以宿主传入的 `props.events` 为准
- **字段处理原则**：仓库内已存在的字段（`allDay / editable / resizable / resourceId / resourceIds / timezone / recurrence` 等）视为"行为接入"任务而非"字段新增"，避免重复造字段

---

## 2. 对齐基线

### 2.1 主参考样例

- 参考样例：`Mobiscroll React Scheduler Desktop Week View`
- URL：<https://demo.mobiscroll.com/react/scheduler/desktop-week-view>

### 2.2 本轮对齐的内容

- 桌面端 scheduler 的时间网格体验
- 资源列布局
- 全天区与跨天事件表现
- 创建、拖拽、resize、失败反馈的交互闭环
- 资源显隐、资源分组、共享事件等资源调度能力
- recurrence、timezone、external DnD 等高级能力的接口与路线图

### 2.3 本轮不对齐的内容

- agenda 视图
- 移动端适配
- Mobiscroll 弹窗、表单、内建 CRUD 界面
- API 字段名兼容
- `connections`、`eventList`、打印模式、虚拟化、大数据滚动优化、键盘无障碍

---

## 3. 能力矩阵（Mobiscroll × 本库 × Scope）

> 本表用于控 scope。凡是标记为“公开承诺”的能力，后续改动必须同步 `SPEC`、测试与迁移文档；标记为“内部已有，未承诺”的能力，不得仅凭字段暴露或 story 存在就对外宣称已支持。

| 能力 | Mobiscroll | 本库现状 | 公开状态 | 现状描述 | Phase |
|------|------------|----------|----------|---------|-------|
| 时间网格基础 | ✅ | ✅ | 公开承诺 | `Scheduler.tsx` 已基于独立 scheduler pipeline + `TimeGrid` 渲染 | 1A.2 已落地 |
| 资源列（多列） | ✅ | ✅ | 公开承诺 | `resources[]` 已进入 `SchedulerOptions` | 已落地 |
| 事件渲染 + 碰撞布局 | ✅ | ✅ | 公开承诺 | scheduler 已复用稳定碰撞布局并支持同槽位排序 | 已落地 |
| 拖拽创建 / 移动 / resize | ✅ | ✅ | 公开承诺 | 全局 gate 与受控回调已接入 | 1B 已落地 |
| `invalid` 禁用区间 + 遮罩 | ✅ | ✅ | 公开承诺 | `invalid` 为主名，运行时兼容 `blockedTimes` | 1A.1 已落地 |
| `colors` 背景有效时段 | ✅ | ✅ | 公开承诺 | scheduler / timeline 已支持背景区段与 `invalid` 分层 | 1A.2 已落地 |
| all-day lane（scheduler 内） | ✅ | ✅ | 公开承诺 | scheduler 顶部全天事件栏已接入 | 1A.2 已落地 |
| 多日事件在 scheduler 分段 | ✅ | ✅ | 公开承诺 | 多日 time 事件按资源与日期切分后渲染 | 1A.2 已落地 |
| header / event template 收敛 | ✅ | ✅ | 公开承诺 | scheduler 模板插槽已纳入公开类型 | 1A.3 已落地 |
| 拖拽时间 tooltip | ✅ | ✅ | 公开承诺 | move / resize 过程中已有时间提示 | 1A.2 已落地 |
| per-event 编辑性 | ✅ | ✅ | 公开承诺 | `editable / draggable / resizable` 已进入 scheduler 校验链 | 1B 已落地 |
| overlap policy | ✅ | ✅ | 公开承诺 | 全局 `eventOverlap` + per-event `overlap` 已接入 | 1B 已落地 |
| `bufferBefore` / `bufferAfter` | ✅ | ✅ | 公开承诺 | buffer 已参与 overlap 判定，不影响视觉长度 | 1B 已落地 |
| failed callbacks | ✅ | ✅ | 公开承诺 | `onEventCreateFailed` / `onEventUpdateFailed` 已接入 | 1B 已落地 |
| delete | ✅ | ✅ | 公开承诺 | 聚焦事件后支持 `Delete/Backspace` 删除 | 1B 已落地 |
| 资源显隐 | ✅ | ✅ | 公开承诺 | `visibleResourceIds` 已作为显隐主入口 | 2 已落地 |
| 资源分组 / 折叠 | ✅ | ✅ | 公开承诺 | `children` / `collapsed` + sidebar 已接入 | 2 已落地 |
| shared events | ✅ | ✅ | 公开承诺 | `resourceIds` 已进入 scheduler 布局链 | 2 已落地 |
| 资源级交互限制 | ✅ | ✅ | 公开承诺 | `eventDragInTime` / `eventResize` / `eventOverlap` 已接入 | 2 已落地 |
| 跨资源拖动 gate | ✅ | ✅ | 公开承诺 | 全局 / 资源级 / per-event `dragBetweenResources` 已接入 | 2 已落地 |
| recurrence 展开 | ✅ | 🟡 | 内部已有，未承诺 | 字段已暴露，但未进入视口展开与编辑链 | 3 已落地 |
| recurring exception | ✅ | ✅ | 公开承诺 | 跳过/替换已接入 scheduler 渲染链 | 3 已落地 |
| 编辑作用域 | ✅ | ❌ | 未承诺 | 无运行时能力 | 3 后置 |
| timezone | ✅ | ✅ | 公开承诺 | 数据→显示时区转换已接入 scheduler 渲染链 | 3 已落地 |
| external drag & drop | ✅ | ✅ | 公开承诺 | `onExternalDrop` / `onExternalDropFailed` 已接入 | 3 已落地 |
| 跨实例拖拽 | ✅ | ✅ | 公开承诺 | `onCrossInstanceDragEnd` / `onCrossInstanceDrop` 已接入 | 3 已落地 |
| agenda / 移动端 / connections / eventList / 虚拟化 / 打印 / a11y | ✅ | ❌ | 未承诺 | 远期 backlog，不在当前对齐范围 | 远期 backlog |

### 3.1 Scope 控制规则

- `公开承诺`：
  - 必须在 `SPEC` 中出现
  - 必须至少有单测或 Storybook 场景覆盖
  - 破坏性修改必须走 docs-first
- `内部已有，未承诺`：
  - 允许保留字段、预留类型或局部实验实现
  - 不得在 README、SPEC、对外说明中写成“已支持”
  - 若要升级为公开能力，必须先更新 `SPEC` 和本矩阵
- `未承诺`：
  - 不允许通过“近似能力”对外替代宣称
  - 不纳入当前 phase 完成标准

---

## 4. 核心产品决策

### 4.1 宿主受控

本库采用宿主受控模式：

- 组件内部可以产生拖拽、创建、resize、删除等交互意图
- 组件内部可以做同步基础校验
- 组件不会维护独立于 `props.events` 之外的长期"乐观事件源"
- 宿主通过回调拿到变更意图后，自行决定是否更新 `events`
- 组件渲染始终以宿主传入的 `events` 为最终真值

### 4.2 多日事件在多资源场景中的渲染策略

固定为：

- 按资源分别显示
- 每个资源列独立分段、独立布局
- 不做跨资源列连续块
- 这样可以让布局规则、拖拽规则和 overlap 规则保持一致

### 4.3 `invalid` 与 `colors` 的优先级

固定为：

- `invalid` 决定是否允许交互
- `colors` 只负责背景表达
- 视觉层级：`colors` 在下，`invalid` 遮罩在上
- 命中 `invalid` 的区域不可创建、不可移动进入、不可 resize 覆盖

### 4.4 回调策略

- `onPageChange` 继续作为 view/date 变化的统一入口（现 `CalendarPageChangeInfo` 已含 `view: ViewType`，见 `callbacks.type.ts:5-8`）
- 不新增 `onViewChange`
- 失败回调只表示本库同步规则校验失败，不代表宿主网络失败或服务端失败
- Phase 1 不提供"建议合法值"或自动修正时间

### 4.5 timeline 的关系与不退化保障

- `timeline` 与 `scheduler` 继续保持独立视图
- 允许共享底层 `time/` / `model/` / `controller/` 算法
- 不允许在 `components/` 层互相耦合
- 本轮不为 `timeline` 新增 parity 目标

**不退化保障细则**（新增）：

- **同步迁移**：Phase 1A.1 的 `blockedTimes → invalid` 与 `isAllday → allDay` 在 timeline 同步迁移。timeline 的 `TimelineOptions extends SchedulerOptions`（`options.type.ts:92`）已继承，类型层一并迁移
- **回归锚点**：timeline 现有 Storybook 场景全部作为每个 Phase 验收时的必跑项
- **责任归属**：任何 scheduler 侧改动若涉及 `controller/time/model/` 共享算法，负责人需同时回归 timeline

---

## 5. 公共 API 收敛方案

### 5.1 `CalendarOptions.scheduler`

#### 当前公开基线（已进入 `SPEC`）

- `resources?: ResourceInfo[]`
- `hourStart?: number`
- `hourEnd?: number`
- `invalid?: InvalidRange[]`
- `blockedTimes?: BlockedTimeRange[]`（兼容别名）
- `colors?: ColoredRange[]`
- `dragToCreate?: boolean`
- `dragToMove?: boolean`
- `dragToResize?: boolean`
- `dragInTime?: boolean`
- `eventOverlap?: boolean`
- `visibleResourceIds?: string[]`
- `dragBetweenResources?: boolean`

#### 内部已有，未公开承诺

- 无。当前 `SchedulerOptions` 已落入实现的字段均已同步进 `SPEC`。

#### 继续后置

- `showAllDay`
- `cellWidth`
- `range`
- `resourceGrouping`
- `connections` / `eventList` / `maxEventStack` / 打印 / 虚拟化 / 按滚动加载

### 5.2 `EventObject`

> 对照 `events.type.ts:47-100`，下列字段部分已在仓库内存在。"行为接入"表示字段已存在、需将其串入 scheduler 校验链与渲染链；"新增"表示字段尚未定义。

#### 已有字段行为接入（不重复定义类型）

| 字段 | 位置 | 任务 Phase | 说明 |
|------|------|-----------|------|
| `allDay` | `events.type.ts:54` | 1A.1 | 与 `isAllday` 收敛，见 §5.2.1 |
| `editable` | `events.type.ts:91` | 1B | 接入 scheduler 校验链 |
| `draggable` | `events.type.ts:92` | 1B | 接入拖拽 gate |
| `resizable` | `events.type.ts:93` | 1B | 接入 resize gate |
| `resourceId / resourceIds` | `events.type.ts:98-99` | 2 | `resourceIds` 进入 shared event 布局 |
| `timezone` | `events.type.ts:65` | 3 | 进入时区换算 |
| `recurrence` | `events.type.ts:66` | 3 | 进入 recurrence 引擎 |

#### 新增字段

| 字段 | Phase | 说明 |
|------|-------|------|
| `order?: number` | 1A.2 | 同槽位排序 |
| `dragInTime?: boolean` | 1B | per-event |
| `overlap?: boolean` | 1B | per-event 覆盖全局 |
| `bufferBefore?: number` | 1B | 分钟，参与 overlap |
| `bufferAfter?: number` | 1B | 分钟，参与 overlap |
| `dragBetweenResources?: boolean` | 2 | per-event |
| `recurringException?: DateType[]` | 3 | — |
| `recurringExceptionRule?: RecurrenceRule` | 3 | — |

#### 5.2.1 `isAllday → allDay` 收敛

**现状**：`events.type.ts:53-54` 同时存在 `isAllday?: boolean` 与 `allDay?: boolean`，双字段并存会让宿主侧无所适从。

**收敛策略**：

- **Phase 1A.1**：`allDay` 为主名；`isAllday` 保留但在类型文档注释标"deprecated alias"；运行时读取统一走 `allDay ?? isAllday`，写入统一到 `allDay`
- **Phase 1B**：类型层在 `isAllday` 上加 `@deprecated` JSDoc 标签
- **Phase 2**：类型层移除 `isAllday`，运行时归一化逻辑同步移除
- **不做**：不引入 runtime `console.warn`，保持组件库零噪音
- **MIGRATION.md**：在 Phase 1A.1 交付 `isAllday → allDay` 的 search-replace 模板

### 5.3 `ResourceInfo`

#### 现状盘点（`options.type.ts:97-107`）

当前已有：`id` / `name` / `parentId` / `color` / `backgroundColor` / `hidden` / `order` / `width` / `meta`。

#### Phase 2 新增

- `children?: ResourceInfo[]`
- `collapsed?: boolean`
- `eventDragInTime?: boolean`
- `eventDragBetweenResources?: boolean`
- `eventResize?: boolean`
- `eventOverlap?: boolean`

#### 收敛策略

**`parentId` 与 `children`**：

- Phase 2：`children` 为主入口；`parentId` 保留兼容
- 运行时：若宿主提供 `children`，引擎以 `children` 为唯一真源并派生 `parentId`；若宿主只提供 `parentId`，引擎按扁平列表展开为 `children`
- Phase 3 起 `parentId` 标记 deprecated（类型层 JSDoc）
- 不在本轮移除 `parentId`

**`hidden` 与 `visibleResourceIds`**：

- Phase 2：`visibleResourceIds`（在 `CalendarOptions.scheduler` 上）为主入口；`hidden`（在 `ResourceInfo` 上）保留兼容
- 优先级钉死：两者同时提供时，**`visibleResourceIds` 胜**（显式 id 列表比 per-resource 布尔更精准）
- `visibleResourceIds` 缺省时 fallback 到 `hidden`
- Phase 3 起 `hidden` 标记 deprecated
- 不在本轮移除 `hidden`

**策略优先级（保留 PLAN3）**：

- 事件级覆盖资源级
- 资源级覆盖全局默认

### 5.4 Callbacks

#### 保留现有（`callbacks.type.ts:41-48`）

- `onEventClick` / `onPageChange` / `onRangeSelect` / `onEventCreate` / `onEventUpdate` / `onValidateEventChange`

#### 当前公开基线

- `onCellClick`
- `onEventHover`
- `onEventCreateFailed`
- `onEventUpdateFailed`
- `onEventDelete`

#### 内部已有，未公开承诺

- 无。当前 callbacks 暴露项与 `SPEC` 已对齐。

#### 继续后置

- `onResourceVisibilityChange`

#### 失败回调 payload

```ts
type CalendarEventChangeFailReason =
  | 'invalid'
  | 'overlap'
  | 'readonly'
  | 'policy';

type CalendarPolicySource =
  | 'event'      // per-event editable/draggable/resizable/overlap
  | 'resource'   // resource-level event*
  | 'view';      // 全局 dragToMove / dragToResize / dragInTime / eventOverlap

interface CalendarEventChangeFailedInfo {
  reason: CalendarEventChangeFailReason;
  // 仅当 reason === 'policy' 时必填，指明策略来源
  policySource?: CalendarPolicySource;
  action: 'create' | 'move' | 'resize' | 'delete';
  event: EventObject;
  previousEvent?: EventObjectWithDefaultValues;
}
```

**设计说明**：

- 采用"`reason` + `policySource`"而非拆分 `reason` union，降低宿主侧 switch 改动面
- `action: 'delete'` 在 Phase 1B 要求同步扩展 `callbacks.type.ts:32` 的 `CalendarEventChangeAction` union
- Phase 1 不增加"推荐合法值"或自动吸附回传

---

## 6. 命名收敛与迁移方案

### 6.1 `blockedTimes → invalid`

| Phase | 行为 |
|-------|------|
| 1A.1 | `invalid` 设为主名；运行时兼容 `blockedTimes`；文档、Storybook、新代码示例全部使用 `invalid` |
| 1B | `blockedTimes` 在类型层和文档中标记 deprecated；`MIGRATION.md` 给出最小 diff 示例 |
| 2 | 移除 `blockedTimes`，类型与实现层只保留 `invalid` |

### 6.2 `isAllday → allDay`

| Phase | 行为 |
|-------|------|
| 1A.1 | `allDay` 设为主名；运行时 `allDay ?? isAllday`；写入统一到 `allDay`；文档示例切到 `allDay` |
| 1B | `isAllday` 类型层加 `@deprecated` JSDoc |
| 2 | 移除 `isAllday` |

### 6.3 统一原则

- 不引入 runtime `console.warn`
- MIGRATION.md 合并两次迁移为一节，给出 search-replace 模板与 TypeScript 兼容期写法
- 所有迁移都在 timeline 侧同步进行（见 §4.5）
- `parentId` / `hidden` 不在本轮移除，只在 Phase 3 进入 deprecated 状态

---

## 7. 架构落点

### 7.1 `time/`

- scheduler range 归一化
- hour division 计算
- recurrence 视口窗口展开（Phase 3）
- timezone 双层转换（Phase 3）

### 7.2 `model/`

- `EventModel` 保存归一化后的 `allDay` / buffer / recurrence / timezone 字段
- `ResourceModel` 或等价树形辅助结构（Phase 2）

### 7.3 `controller/` 演进策略

**现状**：`controller/scheduler.controller.ts` 已存在（约 230 行），包含 `getBlockedTimesByView / isBlockedEventChange / getBlockedTimeLayoutsForColumn / shouldAcceptEventChange`。

**演进节奏**（不做一次性大重构）：

| Phase | 动作 |
|-------|------|
| 1A.1 | 不拆分；仅在原文件内将 `blockedTimes` 相关 API 增加 `invalid` 同义导出 |
| 1A.2 | 新建 `controller/scheduler-layout.ts`，承接 all-day lane 布局 + 多日分段算法；原文件保留 |
| 1B | 新建 `controller/scheduler-validation.ts`，从原文件迁出校验相关函数（`isBlockedEventChange` / `shouldAcceptEventChange`）；原文件改为 re-export 聚合层 |
| 2 | 新建 `controller/scheduler-resources.ts` 承接 show/hide/group/collapse/shared |
| 3 | 新建 `controller/scheduler-recurrence.ts` |

**硬规则**：

- overlap、invalid、resource policy、recurrence scope 不能在组件里临时判断，必须下沉到 `controller/`
- 拆分过程通过 re-export 保持向后兼容，拆分 PR 不应触发 scheduler 视图回归
- 全天事件判定的唯一共享入口固定在 `controller/event.controller.ts`；week / day / scheduler / timeline 全部复用，不允许各视图单独实现 `allDay` 判断

### 7.4 `hooks/`

- 拖拽创建 / 拖拽移动 / resize
- external DnD / cross-instance DnD
- 交互中的失败分发

### 7.5 `components/`

目标布局：

```text
components/scheduler/
├── SchedulerHeader.tsx         # 已有
├── SchedulerAllDayLane.tsx     # Phase 1A.2 新建
├── SchedulerTimeGrid.tsx       # Phase 1A.2 新建（薄封装 TimeGrid）
├── SchedulerResourceColumns.tsx # Phase 1A.2 新建
├── ResourceSidebar.tsx         # Phase 2
├── ResourceGroupHeader.tsx     # Phase 2
└── DragTimeTooltip.tsx         # Phase 1A.2
```

组件边界固定为：只渲染、只派发交互意图、不做业务策略判断。

---

## 8. Phase Plan

### 8.0 与 `2026-05-06-scheduler-v2-foundation` 任务衔接

- v2-foundation 任务在 PLAN4 启动时标记 closed，未完成项迁入新任务 `2026-05-07-scheduler-mobiscroll-parity-roadmap.md`
- 不并行两份任务文档，避免 docs 双源
- v2-foundation 任务中已落地的 scheduler 拆分、SchedulerHeader、`onValidateEventChange`、`blockedTimes` 基础校验视为 Phase 0 之前的基线

---

### Phase 0：Docs & API Freeze

#### 交付物

- `docs/agent-plan/PLAN4-claude-code.md`（本文件）
- `docs/tasks/2026-05-07-scheduler-mobiscroll-parity-roadmap.md`
- `packages/calendar/SPEC.md` 重写
- `docs/ARCHITECTURE.md` 补 scheduler 子系统分层
- `docs/adrs/ADR-2026-05-scheduler-parity-scope.md`
- `docs/MIGRATION.md`（含 `blockedTimes → invalid` + `isAllday → allDay`）
- `docs/README.md` 增 Scheduler 路线图入口
- `docs/WORKFLOW.md` 增"复杂能力先写 feature matrix 再写实现"

#### 文档写入规则

所有相关文档都必须写入：

```md
参考样例：Mobiscroll React Scheduler Desktop Week View
https://demo.mobiscroll.com/react/scheduler/desktop-week-view
```

#### 回归保护

- 不动任何代码
- `node scripts/check-docs.mjs` / `check-arch.mjs` 通过
- 现有 Storybook 全部保持绿

#### 退出条件

只看文档就能回答：

- 主参考项目是谁
- 近期范围是什么
- 宿主和组件谁拥有事件数据
- `invalid` / `allDay` / all-day lane / shared event 分别在哪个 phase
- 哪些能力明确不在本轮

---

### Phase 1A.1：API 重命名 + 配置开关

#### 用户能力

- 宿主可用 `invalid` / `colors` / `allDay` 替换旧字段
- 宿主可配置 `showAllDay` / `hourDivision` / `cellWidth` / `range`
- 旧字段 `blockedTimes` / `isAllday` 仍可用

#### API 范围

- `SchedulerOptions.invalid / colors / showAllDay / hourDivision / cellWidth / range`
- 运行时双名：`blockedTimes ⇄ invalid`、`isAllday ⇄ allDay`

#### 实现落点

- `controller/scheduler.controller.ts` 内增 `invalid` 同义导出
- `controller/event.controller.ts` 统一读取 `allDay ?? isAllday`
- `model/EventModel` 仅保存归一化后的 `allDay`
- `types/options.type.ts` / `types/events.type.ts` 增新字段
- MIGRATION.md 写完

#### 回归保护

- week / day / timeline 现有 Storybook 全部保持绿
- 现有 `blockedTimes` 使用者代码无需改动
- 现有 `isAllday` 使用者代码无需改动

#### 退出条件

- 所有现有 Storybook 仍绿
- SPEC + MIGRATION 示例同时展示新旧写法
- 类型层 `tsc --noEmit` 通过

---

### Phase 1A.2：Desktop Scheduler 布局基线

#### 用户能力

- scheduler 顶部有 all-day lane
- 全天事件能进入 all-day lane
- 多日事件能在 scheduler 中按资源正确分段
- `invalid` 区间有可视遮罩
- `colors` 能对指定时段做背景染色
- 拖拽过程中有时间 tooltip
- `EventObject.order` 控制同槽位排序

#### API 范围

- `EventObject.order`（新增）

#### 实现落点

- scheduler 从本 Phase 起不再直接把 `getWeekViewEvents(...).time` 作为最终布局输入；week 保持原链路，scheduler 改为独立 layout pipeline
- `controller/scheduler-layout.ts`（新建）承接 all-day 路由、跨日分段算法
- `components/scheduler/SchedulerAllDayLane.tsx`（新建）
- `components/scheduler/SchedulerTimeGrid.tsx`（新建，薄封装）
- `components/scheduler/DragTimeTooltip.tsx`（新建）
- 复用 week 视图的 `AlldayRow` 布局思路

#### 回归保护

- week / day 的 all-day 呈现不变
- timeline 的 blockedTimes 遮罩（已迁 invalid）不变
- `helpers/grid.ts:435-509` 的 `getWeekViewEvents` 行为仅对 week 视图保持不变；scheduler 从本 Phase 起只复用底层日期范围筛选能力，最终布局由 `controller/scheduler-layout.ts` 独立产出

#### 退出条件

- 新增 Storybook：`Scheduler/AllDayAndMultiDay` / `Scheduler/InvalidAndColors`
- 与 mobiscroll demo 对照核心布局与时间网格表现无明显偏差（对照标准见 ADR §"行为对齐衡量"）

---

### Phase 1A.3：模板与回调收敛

#### 用户能力

- 宿主可以替换 header / event 模板
- 空白 cell 点击可触发回调
- 事件 hover 可触发回调

#### API 范围

- `template.*` slot 收敛（具体 slot 清单在 SPEC.md 中钉）
- `onCellClick`
- `onEventHover`

#### 实现落点

- `slices/template.slice.ts` 增 scheduler 专属 slot
- `hooks/` 增 cell click / hover 意图分发

#### 回归保护

- 现有 template slot 全部保持向后兼容
- 现有 `onEventClick` 行为不变

#### 退出条件

- 新增 Storybook：`Scheduler/Templates`
- 宿主可以用 template 替换 header 与 event 呈现

---

### Phase 1B：Desktop Scheduler 交互闭环

#### 用户能力

- 可按事件粒度控制是否可拖、可改时间、可 resize（接入已有字段 `editable / draggable / resizable`）
- 全局 overlap 与 per-event overlap 协作
- `bufferBefore` / `bufferAfter` 参与冲突判定
- create / move / resize / delete 命中规则时有失败回调
- 宿主只用受控 `events` 和 callbacks 就能接管交互结果

#### API 范围

- `SchedulerOptions.eventOverlap / dragToCreate / dragToMove / dragToResize / dragInTime`
- `EventObject.dragInTime / overlap / bufferBefore / bufferAfter`（新增）
- `EventObject.editable / draggable / resizable`（行为接入）
- `onEventCreateFailed` / `onEventUpdateFailed` / `onEventDelete`
- 扩展 `CalendarEventChangeAction` union 为 `'create' | 'move' | 'resize' | 'delete'`
- `isAllday` 标记 deprecated
- `blockedTimes` 标记 deprecated

#### 实现落点

- `controller/scheduler-validation.ts`（从 `scheduler.controller.ts` 迁出）
- `hooks/TimeGrid/*` 接入统一校验与失败分发

#### 回归保护

- `onValidateEventChange` 现有行为不变
- `blockedTimes` 校验路径仍可用（通过 invalid 同义）
- `callbacks.type.ts:32` union 扩展不破坏现有 callers

#### 退出条件

- 新增 Storybook：`Scheduler/ValidationPolicies` / `Scheduler/FailedCallbacks` / `Scheduler/Delete`
- 宿主无需依赖组件内部本地状态，只通过回调和受控 `events` 即可实现更新与拒绝
- 失败 payload 的 `policySource` 在 Storybook 中演示三种来源

---

### Phase 2：Resource Scheduling

#### 用户能力

- 资源可运行时 show/hide（通过 `visibleResourceIds`，兼容 `hidden`）
- 资源可 group / collapse（通过 `children`，兼容 `parentId`）
- 单个事件可绑定多个资源（行为接入 `resourceIds`）
- 资源级交互限制生效
- 资源背景和 summary slot 可定制

#### API 范围

- `SchedulerOptions.visibleResourceIds / resourceGrouping / dragBetweenResources`
- `ResourceInfo.children / collapsed / eventDragInTime / eventDragBetweenResources / eventResize / eventOverlap`
- `EventObject.dragBetweenResources`（新增）
- `EventObject.resourceIds`（行为接入）
- `onResourceVisibilityChange`
- `parentId` / `hidden` 标记 deprecated

#### 实现落点

- `controller/scheduler-resources.ts`（新建）
- `model/ResourceModel`（新建）
- `components/scheduler/ResourceSidebar.tsx` / `ResourceGroupHeader.tsx`

#### 回归保护

- 现有 `parentId` / `hidden` 使用者代码无需改动
- timeline 的资源列行为不变

#### 退出条件

- 新增 Storybook：`Scheduler/ResourceVisibilityAndGrouping` / `Scheduler/SharedEvents`
- 运行时切换资源显隐不丢滚动位置
- 共享事件在多个资源列同时正确渲染

---

### Phase 3：Advanced Scheduling

#### 用户能力

- recurrence 在视口窗口内展开（行为接入 `recurrence`）
- recurring exception 能跳过或替换实例
- 编辑作用域支持本次 / 本次及以后 / 全部
- 数据时区和显示时区可分离（行为接入 `timezone`）
- external DnD 和跨实例 DnD 通过 hooks / callbacks 输出完整 intent

#### API 范围

- `EventObject.recurringException` / `recurringExceptionRule`（新增）
- `EventObject.recurrence / timezone`（行为接入）
- `parentId` / `hidden` 在本 Phase 标记 deprecated，不在本轮移除
- `isAllday` / `blockedTimes` 已在 Phase 2 移除，不再进入本 Phase 范围

#### 实现落点

- `time/recurrence-window` / `time/timezone`
- `controller/scheduler-recurrence.ts`（新建）
- `hooks/` 外部拖拽与跨实例拖拽

#### 回归保护

- 不对非 recurrence 事件产生任何行为变化
- 非 timezone 配置下渲染结果与之前一致

#### 退出条件

- 新增 Storybook：`Scheduler/Recurrence` / `Scheduler/Timezone` / `Scheduler/ExternalDnDMock`
- 高级调度能力不破坏宿主受控数据流，也不要求内建弹窗编辑器

---

## 9. Test Plan

每个 phase 固定三层验证：

### 9.1 文档与约束

- `node scripts/check-docs.mjs`
- `node scripts/check-arch.mjs`

### 9.2 代码质量

- `pnpm lint`
- `pnpm -r exec tsc --noEmit`

### 9.3 行为验证

- controller / time 层单元测试
- Storybook 对照场景
- 必要时补手动对照 `Mobiscroll React Scheduler Desktop Week View`

### 9.4 目标 Storybook 集合

| 集合 | 引入 Phase |
|------|-----------|
| `Scheduler/Core` | 0（现有） |
| `Scheduler/AllDayAndMultiDay` | 1A.2 |
| `Scheduler/InvalidAndColors` | 1A.2 |
| `Scheduler/Templates` | 1A.3 |
| `Scheduler/ValidationPolicies` | 1B |
| `Scheduler/FailedCallbacks` | 1B |
| `Scheduler/Delete` | 1B |
| `Scheduler/ResourceVisibilityAndGrouping` | 2 |
| `Scheduler/SharedEvents` | 2 |
| `Scheduler/Recurrence` | 3 |
| `Scheduler/Timezone` | 3 |
| `Scheduler/ExternalDnDMock` | 3 |

### 9.5 回归基线

每个 Phase 验收时必跑：

- week / day / month / timeline 现有 Storybook 全部绿
- 现有 `controller/` 单测全部绿
- 旧字段（`blockedTimes` / `isAllday` / `parentId` / `hidden`）在兼容期内示例代码可运行

---

## 10. 文档写入规则

后续所有与 scheduler 路线图相关的长期文档，都必须写入以下信息：

```md
参考样例：Mobiscroll React Scheduler Desktop Week View
https://demo.mobiscroll.com/react/scheduler/desktop-week-view
```

至少要出现在：

- `docs/agent-plan/PLAN4-claude-code.md`
- `docs/tasks/2026-05-07-scheduler-mobiscroll-parity-roadmap.md`
- `packages/calendar/SPEC.md`
- `docs/adrs/ADR-2026-05-scheduler-parity-scope.md`
- `docs/README.md`

禁止只写："mobiscroll demo" / "desktop week view" / "付费组件参考"。必须同时保留：`Mobiscroll` + `React Scheduler Desktop Week View` + 完整 URL。

---

## 11. ADR 补充清单

`docs/adrs/ADR-2026-05-scheduler-parity-scope.md` 必须包含以下章节：

1. **决策范围**：采用行为对齐而非 API 兼容
2. **视图边界**：scheduler / timeline 独立视图；允许共享 controller / model / time；禁止 components 互相耦合
3. **数据所有权**：宿主受控；本库不维护独立乐观状态机；失败回调只表示本库同步校验失败
4. **行为对齐衡量方式**（新增）：
   - 每个能力提供一对截图（mobiscroll demo vs 本库 Storybook）作为验收附件
   - 对照粒度：交互路径相同 + 视觉相近，不要求像素级一致
   - 验收人在 Phase 0 任务文档里指定
   - 不把 Storybook 截图自动化差异比对作为门禁，避免脆弱测试
5. **命名收敛**（新增）：
   - 优先 mobiscroll 命名以降低对齐成本
   - 布尔字段：新字段用动词/形容词（`editable / resizable / draggable`），已有 `is*` 字段保留兼容期后移除
   - 时间数值字段：单位统一为分钟（`bufferBefore: number`）
   - 双字段共存期不超过 2 个 Phase
6. **迁移规则**（新增）：
   - 不引入 runtime `console.warn`
   - 类型层 JSDoc `@deprecated` 标签作为唯一提醒途径
   - MIGRATION.md 给出 search-replace 模板

---

## 12. Assumptions

- 目标是"桌面端 scheduler 核心可用"，不是一次性交付全部 Mobiscroll 能力
- `scheduler` 优先级高于 `month` 完整化和 `timeline` 增强
- 本库不内建业务弹窗、数据请求和远端同步
- 所有策略判断必须放在 `controller/`，组件只做渲染和意图派发
- 计划中的"已有"与"新增"必须以当前仓库真实实现为准，不以目标状态倒推
- **仓库内已存在的字段视为"行为接入"任务而非"字段新增"**（新增假设）
- **命名收敛（`isAllday → allDay` / `blockedTimes → invalid` / `parentId → children` / `hidden → visibleResourceIds`）在本轮合并推进，不拆分独立排期**（新增假设）
- **timeline 的不退化保障通过"同步迁移 + 回归 Storybook"实现，不引入独立 parity 目标**（新增假设）
