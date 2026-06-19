# 2026-06-18 资源显隐回调闭环（onResourceVisibilityChange）

> 参考样例：Mobiscroll React Scheduler Desktop Week View
> https://demo.mobiscroll.com/react/scheduler/desktop-week-view

## 背景

`scheduler` / `timeline` 的资源显隐能力已存在：宿主通过 `SchedulerOptions.visibleResourceIds`（兼容 `ResourceInfo.hidden`）控制哪些资源列可见，渲染链已闭环（见 `controller/scheduler-resources.ts` 的 `getFlattenedVisibleResources`）。

但当前**显隐完全是宿主单向 prop 驱动**：库内 `ResourceSidebar` 只有分组折叠（`onToggleCollapse`，内部 store state），**没有任何"显示/隐藏某个资源"的交互控件**，也没有回调把显隐意图回传给宿主。对照 Mobiscroll 桌面 scheduler 的资源勾选显隐体验，本库缺这层"库内触发 → 宿主受控回填"的闭环，宿主只能自建一套侧栏 UI 才能让用户在日历内切换资源可见性。

`docs/tasks/2026-06-18-post-s2-backlog.md` 已将本项列为 A 档 P1，属低风险 API 收尾。

## 目标

- 在 `ResourceSidebar` 每个资源行加入**显隐切换控件**（眼睛 / 勾选图标），用户点击即切换该资源的可见性。
- 新增回调 `onResourceVisibilityChange`，在用户通过该控件切换显隐时触发，payload 携带**切换后的完整可见资源 id 集合**与本次被切换的资源信息。
- 严格遵循宿主受控模式（PLAN4 §4.1）：库内**不维护独立的显隐 state**，控件 emit 意图后由宿主回写 `visibleResourceIds`，渲染始终以 prop 为准。
- 同步 `SPEC.md`（资源显隐条目 + callbacks 清单）与 backlog A 档状态。

## 非目标

- 不把分组折叠（`collapsed` / `toggleCollapse`）对外暴露成回调（按用户决策，本轮只做显隐；折叠保持库内 state，留作后续 backlog）。
- 不引入"非受控显隐"模式——库内不缓存一份独立于 `visibleResourceIds` 的可见性状态。
- 不改变 `getFlattenedVisibleResources` 的既有过滤优先级（`visibleResourceIds` 胜过 `hidden`，见 PLAN4 §5.3）。
- 不新增 `visibleResourceIds` / `hidden` 之外的第三套显隐入口。
- 不为 month / week / day 视图加资源显隐（这些视图无资源概念）。

## 影响范围

- 代码：
  - `packages/calendar/src/types/callbacks.type.ts`：新增 `CalendarResourceVisibilityChangeInfo` 与 `onResourceVisibilityChange`。
  - `packages/calendar/src/components/scheduler/ResourceSidebar.tsx`：新增显隐控件 + `onToggleVisibility` prop。
  - `packages/calendar/src/components/view/Scheduler.tsx`：装配显隐控件 → 计算 next 可见集 → 派发回调。
  - `packages/calendar/src/components/view/Timeline.tsx`：若复用同一 sidebar，则同步接线（待实现时确认 timeline 是否走 `ResourceSidebar`）。
  - `packages/calendar/src/index.ts`：导出新回调 info 类型。
  - 可能新增 `controller/` 纯函数：根据「当前可见集 + 被切换 id + 全量资源」计算 next `visibleResourceIds`（保持组件层无业务逻辑）。
- 文档：
  - `packages/calendar/SPEC.md`（资源显隐条目 + callbacks 段）
  - `docs/tasks/2026-06-18-post-s2-backlog.md`（A 档状态回填）
  - `docs/tasks/2026-06-18-resource-visibility-change.md`（本文件）
- 运行时行为：sidebar 新增显隐控件；未提供 `onResourceVisibilityChange` 的宿主行为不变（控件可在无回调时禁用或不渲染——见方案待定项）。

## 现状

- 显隐过滤真源：`controller/scheduler-resources.ts:111` `getFlattenedVisibleResources(resources, visibleResourceIds, collapsedIds)`，`visibleResourceIds` 非空时按白名单过滤，否则 fallback 到 `hidden`。
- `ResourceSidebar`（`components/scheduler/ResourceSidebar.tsx`）：props 为 `resources / collapsedIds / onToggleCollapse / width`，只渲染层级 + 折叠箭头，无显隐控件。
- 折叠状态在 store（`collapsedResourceIds` + `toggleCollapse`，`Scheduler.tsx:41-43`），属库内 state；显隐则纯 prop。
- callbacks 真源：`types/callbacks.type.ts` 的 `CalendarCallbacks`（无 `onResourceVisibilityChange`）。
- SPEC：`资源显隐` 已标 ✅（`SPEC.md:65`），但描述仅 "`visibleResourceIds` 可控制可见资源"，无库内交互与回调。

## 方案

### 1. 回调类型（types 层）

```ts
export interface CalendarResourceVisibilityChangeInfo {
  /** 被切换的资源 id */
  resourceId: string;
  /** 切换后该资源是否可见 */
  visible: boolean;
  /** 切换后的完整可见资源 id 集合（宿主应据此回写 visibleResourceIds） */
  visibleResourceIds: string[];
}
```

`CalendarCallbacks` 增 `onResourceVisibilityChange?: (info: CalendarResourceVisibilityChangeInfo) => void;`

### 2. next 可见集计算（controller 层）

新增纯函数（落点 `controller/scheduler-resources.ts`，与现有显隐过滤同源）：

```
computeNextVisibleResourceIds(allResources, currentVisibleIds | undefined, hidden 派生, toggledId) -> string[]
```

- 当前无显式 `visibleResourceIds` 时，先由"全量资源减去 `hidden`"派生出当前可见基线，再对 `toggledId` 取反。
- 输出始终是显式 id 数组，宿主回写后即进入 `visibleResourceIds` 主入口（与 `hidden` 优先级规则一致）。

### 3. Sidebar 显隐控件（component 层）

- `ResourceSidebar` 新增可选 prop `onToggleVisibility?: (resourceId: string) => void` 与 `visibleResourceIds?` 信息以渲染当前显隐态（具体传 visible 集还是 per-row boolean，待实现时取最简）。
- 每行加一个显隐图标按钮；点击 `stopPropagation` 后调用 `onToggleVisibility`，避免与折叠点击冲突。
- 控件仅在宿主提供 `onResourceVisibilityChange` 时渲染/启用（待定项 A）。

### 4. Scheduler 装配（component 层，仅派发意图）

- `Scheduler.tsx` 把 `onToggleVisibility` 接到 sidebar：收到 `toggledId` → 调 `computeNextVisibleResourceIds` → 调 `onResourceVisibilityChange({ resourceId, visible, visibleResourceIds })`。
- 不在组件内修改任何显隐 state；渲染继续以 `schedulerOptions.visibleResourceIds` 为准（宿主回写后自然重渲染）。

### 挂载点决策（已定）

- **挂载点 = 资源列头**：显隐控件挂在 `SchedulerHeader` 的资源列头（`schedulerResourceHeader` 区域），而非 `ResourceSidebar`。原因：`ResourceSidebar` 仅在 `hasHierarchy` 时渲染（`Scheduler.tsx:183`），平铺资源（主流用法）没有 sidebar；资源列头在平铺与分组下都存在，是唯一能统一覆盖两种布局的挂载点。
  - 列头按 `weekDates × resources` 重复渲染：显隐控件**只在每个资源的第一天列头出现一次**，避免每天重复 N 个按钮。
- **B. timeline 不在本轮**：`Timeline.tsx` 用 `ResourceList` 而非 `ResourceSidebar`，是另一套组件。本轮显隐控件只落 scheduler；timeline 显隐回调留作后续 backlog。
- **A. 无回调时控件是否渲染**：无 `onResourceVisibilityChange` 时不渲染显隐控件，避免点击无效。

### 已知 UX 缺口与配套（列头方案自带）

- 隐藏某资源后，该资源列从列头彻底消失 → 库内无处可"恢复显示"。
- 配套方案：在 scheduler 头部左侧 gutter（或 header 行）提供轻量"显示已隐藏资源 N"入口，点开可勾选恢复被隐藏的资源；恢复同样走 `onResourceVisibilityChange` 受控回填。该入口仅在存在被隐藏资源且宿主提供回调时出现。

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`（资源显隐条目 + callbacks 段）
- [ ] 更新 `docs/ARCHITECTURE.md`（如新增 controller 函数不改变分层，可不动）
- [ ] 新增或更新 ADR（无范围/原则变化，预计不需要）
- [ ] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs` ✅（14 个变更文件）
- [x] `node scripts/check-arch.mjs` ✅（192 文件，无分层违规）
- [ ] `pnpm lint`（pnpm 不在本机 PATH，跳过；tsc 已覆盖类型）
- [x] `tsc --noEmit`（`packages/calendar/tsconfig.json`）✅
- [x] 全量测试 ✅（vitest `--root packages/calendar`，36 文件 / 349 用例全通过）
- [x] 新增 `computeNextVisibleResourceIds` 单测（显式 `visibleResourceIds` / fallback-to-hidden / 树形三条路径）
- [x] 新增 Storybook：`日历/调度器/高级能力 — 资源显隐受控闭环`（`ResourceVisibility`，含 play 测试）
- [x] 浏览器验证（Storybook iframe）：隐藏会议室 A → 列 21→14、出现「已隐藏 1」；菜单恢复 → 列回到 21、入口消失；无 console 错误
- [ ] 回归：现有折叠交互、`visibleResourceIds` prop 过滤、timeline 资源列不退化（已由全量测试 + 类型检查覆盖；timeline 未改动）

## 风险与回滚

- 风险：sidebar 当前仅在 `hasHierarchy` 时渲染，平铺资源无 sidebar；显隐控件需要解决无层级场景的挂载点（待定项 C），否则平铺资源无法在库内显隐。
  - 缓解：实现前先确认挂载策略；若放宽 sidebar 显示条件，需回归无层级 scheduler 布局。
- 风险：受控回填依赖宿主正确把 `visibleResourceIds` 回写，宿主不回写则点击无视觉反馈（符合受控模式，但需在 SPEC / Storybook 明确说明）。
  - 缓解：文档强调受控语义；Storybook 给出标准回写示例。
- 回滚方式：移除 sidebar 显隐控件、`onResourceVisibilityChange` 回调与 `computeNextVisibleResourceIds`，sidebar 退回纯折叠形态即可，不影响 `visibleResourceIds` prop 路径。

## 实施结果

- 实际改动：
  - `types/callbacks.type.ts`：新增 `CalendarResourceVisibilityChangeInfo` 与 `CalendarCallbacks.onResourceVisibilityChange`。
  - `controller/scheduler-resources.ts`：新增纯函数 `computeNextVisibleResourceIds`（当前可见基线 = 显式 `visibleResourceIds` 或「全量减 hidden」，对 `toggledId` 取反，按扁平自然序归一）。
  - `components/scheduler/SchedulerHeader.tsx`：新增可选 `onToggleVisibility`，在每个资源「首日」列头渲染隐藏按钮（`stopPropagation`，避免逐日重复）。
  - `components/scheduler/HiddenResourcesControl.tsx`（新建）：头部 gutter 的「已隐藏 N」恢复入口 + 点击外部关闭的浮层菜单。
  - `components/view/Scheduler.tsx`：接 `useCalendarCallbacks`，派发 `onResourceVisibilityChange`；派生「按显隐隐藏（不含折叠）」的资源列表；两种布局模式（固定列宽 / Panel）均挂载隐藏按钮与恢复入口；无回调时不渲染控件。
  - `index.ts`：导出 `CalendarResourceVisibilityChangeInfo`。
  - `controller/scheduler-resources.spec.ts`：新增 4 条 `computeNextVisibleResourceIds` 用例。
  - `stories/Calendar/Scheduler.shared.tsx` + `Scheduler.Advanced.stories.tsx`：新增 `ResourceVisibility` 故事（受控回填 + play 测试）。
  - `SPEC.md`：资源显隐能力行补充列头控件/恢复入口/受控回调；callbacks 块新增 `onResourceVisibilityChange`。
- 与原计划的偏差：
  - 挂载点由初定的「sidebar 控件」改为「资源列头」——因 `ResourceSidebar` 仅在 `hasHierarchy` 时渲染，平铺资源（主流用法）无 sidebar；列头是唯一统一覆盖两种布局的挂载点（已记入"挂载点决策"）。
  - 因列头方案隐藏后列消失、库内无恢复入口，新增配套组件 `HiddenResourcesControl`（计划中已预判为"已知 UX 缺口与配套"）。
  - timeline 未接入（用 `ResourceList` 而非 `ResourceSidebar`），按计划留作后续 backlog。
- 验证结果：见上方验证计划，机械检查 + 类型 + 全量测试 + 浏览器受控闭环均通过；无 console 错误。
- 剩余问题：
  - Storybook 截图工具在本机持续超时（渲染器问题，与改动无关），已用 DOM 状态断言替代视觉证据。
  - timeline 资源显隐回调留待后续 backlog。
  - 列头隐藏按钮当前用字符 `⊘` 占位，未走主题化图标系统；如需统一图标风格可后续打磨。

## 附带修复：scheduler 默认模式时间网格未铺满高度

> 与本任务非同一需求，但在改 `Scheduler.tsx` 时发现并一并修复，记录在此以便追溯。

- 现象：scheduler 默认（百分比列宽）模式下，时间网格只有约 72px 高，下方大片留白，未铺满容器（固定列宽 `columnWidth` 模式正常）。
- 根因：
  1. `Layout` 只识别其**直接子节点**中的 Panel 来决定「最后一个面板吃掉剩余高度」。默认模式下 scheduler 的 Panel 嵌在 `scheduler-scroll` / 内容列等包裹层里，探测失效，`time` 面板退回 `DEFAULT_PANEL_HEIGHT`（72px）。
  2. `.scheduler-scroll` 仅有 `flex: 1`，但 `Layout` 根节点是 `display: block`，flex 不生效，容器塌缩到内容高度，内部 `height: 100%` 链一起塌缩。
- 修复（均对齐已正常的 `columnWidth` 分支做法）：
  - 默认分支 `time` 区域由 `<Panel name="time">` 改为 `flex: 1; min-height: 0; overflow-y: auto` 的普通 div，不再依赖 Panel 自动吃满机制。
  - 默认分支 `.scheduler-scroll` 显式补 `height: 100%`。
- 验证：浏览器内时间网格高度 72px → 1128px（= 视图 1203 − 列头 75），无 console 错误；全量测试与类型检查通过。
- 影响面：仅 scheduler 默认模式；`columnWidth` 分支、week/day/timeline 未改动。

### 附带修复 2：Storybook 双滚动条（harness，非库）

- 现象：scheduler 高度修复后，右侧出现 2 条竖向滚动条；所有日历 story（日/周/月/调度/时间线）皆然。
- 排查结论：日历组件自身只有 1 条预期的内部滚动（时间网格 24h 内容），视图恰好填满容器（底边 = 视口底）。第 2 条是**整页滚动**，来自 Storybook 装饰器 `.storybook/preview.ts` 的 `getWorkbenchStyles`：`shell` 用 `minHeight:100vh` + `padding:16px`，`stage` 用 `minHeight:calc(100vh-54px)`，尺寸叠加把整页撑出约 25px → 每个日历 story 都多一条整页滚动条。属 harness 装饰器问题，不影响发布库与 S2 宿主。
- 修复：日历 story 的 `shell` 改为 `height:100vh` + `display:flex/column` + `overflow:hidden`，`stage` 改为 `flex:1; min-height:0`，用 flex 填充替代脆弱的 `calc`。
- 验证（浏览器逐视图）：日/周/月/调度/时间线 `pageOverflow` 均为 0；竖向滚动条数：调度=1（时间网格）、周=1、日=1、月=0、时间线=0（时间线保留预期的横向滚动）。
- 影响面：仅 `.storybook/preview.ts` 装饰器；不改任何库代码。

### 附带修复 3：story 说明浮层挡住工具栏按钮（harness，非库）

- 现象：很多 demo 右上角的「行动记录」说明浮层（`absolute; top:12; right:12; z-index:10`）盖住了 `Toolbar` 的视图切换按钮（周/月/调度/时间线），无法点击。
- 根因：库内 `Toolbar`（高 65px）横跨顶部，按钮在右上；浮层 `top:12 right:12` 正好压在按钮上方且背景不透明、`z-index:10`。该浮层在 Day/Week/Month/Scheduler.shared 共 12 处内联重复。
- 修复：12 处浮层统一 `top:12 → top:73`（移到 65px 工具栏下方），并加 `pointer-events:none`（纯文字 HUD，永不拦截点击，双保险）。
- 验证（浏览器）：浮层 top 73、按钮底 49 → 无重叠；`elementFromPoint` 命中「时间线」按钮返回 BUTTON 本身（可点）；`pointer-events:none` 生效。
- 影响面：仅 4 个 story 文件的说明浮层；不改库代码。

### 附带清理：合并重复的简单拖拽 demo（harness，非库）

- 背景：调度器 demo 菜单里 `交互/垂直拖拽`（只 move）与 `交互/拖拽调整时长`（只 resize）是两个最简单的单一交互 demo，与 `回归测试` 组的综合 move+resize 守护重复。
- 处理：把两者合并为单个 `DragMoveAndResize`（菜单名「拖拽移动与调整时长」），同场景演示 move + resize，play 测试合并保留两类断言。删除 `DragVertical` / `DragResize` 两个导出及 `Scheduler.Interactions.stories.tsx` 的两个 wrapper。
- 结果：调度器菜单 12 → 11 项；其余 demo 各演示不同能力，全保留；回归两个（mouse / 真实 pointer 两条路径）不动。
- 验证：tsc ✅；浏览器内合并 story 三个事件（move-1 / move-fixed / resize-1）与底边 resize handle 均渲染，清洁 reload 后无新增 console 错误。
- 影响面：仅 `Scheduler.shared.tsx` + `Scheduler.Interactions.stories.tsx`；不改库代码。

### 附带清理 2：Storybook 首页优化 + 删除 EXAMPLE 菜单（harness，非库）

- 删除默认模板 EXAMPLE 菜单：移除 `src/stories/Example/` 下的 Button / Header / Page 故事与组件（9 个文件），菜单顶层只剩「Swell Calendar」与「日历」。
- 首页优化：将原占位 `Configure.mdx` 替换为 `src/stories/Overview.mdx`（标题 `Swell Calendar/概览`）——项目简介 + 五视图卡片 + 核心约定 + 调度器能力速览 + 对齐参考。
- 置顶：`.storybook/preview.ts` 增 `options.storySort.order = ['Swell Calendar', ['概览'], '日历']`，概览作为首页。
- 验证（浏览器）：`index.json` 已无 `Example/*`；概览页标题 / lead / 四张视图卡片 / 能力区 / 备注均渲染，committed DOM 干净。
- 已知无害项：Storybook MDX/addon-docs 渲染层会在 dev 控制台打出 `validateDOMNesting`（`<p>` 嵌套）告警，不产生任何 DOM 痕迹、不进生产构建、不影响页面；多轮结构调整后仍由 docs 渲染层产生，判定为可接受。
- 影响面：仅 `src/stories/Example/*`（删除）、`src/stories/Overview.mdx`（新增）、`.storybook/preview.ts`（storySort）；不改库代码。
