# 2026-06-19 Week 全天行宽度溢出修复

## 背景

Storybook `日历 / 应用示例 / 周视图整页应用` 中，week 视图顶部全天行存在宽度错乱问题：全天事件看起来会超过日历主体宽度，且整条全天区域会比下方时间网格略宽一截，影响 demo 观看与真实布局可信度。

从页面现象看，问题集中在 week/day 共用的 `AlldayRow` 渲染链，而不是 Storybook 外壳本身。

## 目标

- 修复 week 视图全天行事件容器超过日历可视宽度的问题
- 修复 week/day 顶部全天行与下方时间网格因滚动条缺少右侧补偿而产生的轻微错位
- 保证左侧 `全天` gutter 保留时，事件内容区只占剩余可视宽度，不再额外右溢
- 补最小回归测试，锁住这条布局约束

## 非目标

- 不改 week/day 事件布局算法本身
- 不调整全天事件视觉样式、配色或文案
- 不修改公开 API 或 store 结构

## 影响范围

- 代码：
  - `packages/calendar/src/components/dayGrid/AlldayRow.tsx`
  - `packages/calendar/src/components/dayGrid/AlldayRow.spec.tsx`
  - `packages/calendar/src/components/dayGrid/AlldayEvent.tsx`
  - `packages/calendar/src/components/dayGrid/AlldayEvent.spec.tsx`
  - `packages/calendar/src/components/dayGridCommon/GridHeader.tsx`
  - `packages/calendar/src/components/dayGridCommon/GridHeader.spec.tsx`
  - `packages/calendar/src/components/view/Week.tsx`
  - `packages/calendar/src/components/view/Day.tsx`
- 文档：
  - `docs/tasks/2026-06-19-week-allday-row-overflow.md`
- 运行时行为：
  - week/day 视图全天事件内容区宽度计算更准确

## 现状

- 第一层问题：
  - `AlldayRow` 之前把事件容器渲染为 `position:absolute; inset:0; marginLeft`
  - 这会导致事件容器整体向右偏移，但自身宽度仍按整行 100% 计算
  - 结果是在存在左侧 gutter 时，事件区有效宽度 = 100% + `marginLeft`，表现为全天条超出日历宽度
- 第二层问题：
  - `Week` / `Day` 视图的时间主体面板会出现竖向滚动条，但顶部 `GridHeader` 与 `AlldayRow` 没有像 `Scheduler` 一样为滚动条预留右侧补偿
  - 结果是顶部标题/全天区域会比下方实际可滚动时间网格略宽，视觉上呈现“左侧对齐了，但整体还是突出一截”
- 第三层问题：
  - 全天事件卡片自身没有像 time-grid 事件那样给列边界留出轻微左内缩
  - 结果是首列全天卡片会直接压到第一条列分隔线，视觉上像“卡片左侧又突出了一点”
- 第四层问题：
  - `AlldayRow` 之前仍是“左 label + 右事件层”都挂在同一个绝对定位容器上，事件区的起点靠 `left: marginLeft` 推出来
  - 这种做法在视觉上很容易和真实网格边界产生 1px 级别偏差，表现为“左侧总觉得还突出一点”

## 方案

- 保留左侧 `全天` label 区域
- 把事件容器从“整行铺满后再 margin-left”改成“左边界直接从 gutter 之后开始”
- 继续把 `Scheduler` 已有的滚动条补偿思路同步到 `Week` / `Day`：
  - 在时间面板测量 `scrollbarWidth`
  - 把补偿值传给 `GridHeader` 和 `AlldayRow`
  - 顶部区域统一预留右侧 inset，和下方时间网格保持等宽
- 给 `AlldayEvent` 自身增加一个极小的左内缩，并把宽度同步扣减，避免首列卡片压到列边界线
- 把 `AlldayRow` 改成真实的两列结构：
  - 左侧 label 是固定宽度列
  - 右侧事件区是单独的内容盒子
  - 右侧滚动条补偿落在内容盒子上，而不是继续靠绝对定位的 left/right 拼边界
- 用最小组件级测试锁定两条约束：
  - `AlldayRow` 不能再用 `marginLeft` 扩宽布局
  - `GridHeader` / `AlldayRow` 都能接受右侧滚动条补偿
  - `AlldayEvent` 首列卡片必须保留左内缩

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [x] `pnpm --filter swell-calendar test -- src/components/dayGrid/AlldayRow.spec.tsx`
- [x] `pnpm --filter swell-calendar test -- src/components/dayGrid/AlldayEvent.spec.tsx`
- [x] `pnpm --filter swell-calendar test -- src/components/dayGridCommon/GridHeader.spec.tsx`
- [x] `pnpm --filter swell-calendar exec tsc --noEmit`
- [x] `pnpm --filter swell-calendar exec storybook build`
- [x] Storybook 浏览器人工验收：`日历 / 应用示例 / 周视图整页应用`

## 风险与回滚

- 风险：若顶部 right inset 传递或测量时机不对，可能造成 week/day 头部与时间网格反向收窄
- 回滚方式：恢复 `AlldayRow` 事件容器的原始 `marginLeft` 实现

## 实施结果

- 实际改动：
  - 在 `packages/calendar/src/components/dayGrid/AlldayRow.tsx` 中，把全天事件容器从 `inset: 0 + marginLeft` 改为 `left: marginLeft; right: 0; top: 0; bottom: 0`，让内容区直接从 gutter 后开始布局，不再额外放大整体宽度。
  - 新增 `packages/calendar/src/components/dayGrid/AlldayRow.spec.tsx`，用组件级回归测试锁定“有 gutter 时事件层必须用 absolute inset，而不是 marginLeft 扩宽布局”。
- 本轮补充改动：
  - 在 `Week.tsx` / `Day.tsx` 中补上时间面板滚动条测量，并把 `scrollbarWidth` 作为顶部区域 right inset 传给 `GridHeader` / `AlldayRow`。
  - 在 `GridHeader.tsx` 与 `AlldayRow.tsx` 中增加右侧补偿能力，让顶部标题行和全天行与下方时间网格保持同一可视宽度。
  - 新增 `GridHeader.spec.tsx`，锁定标题行的右侧补偿行为。
  - 在 `AlldayEvent.tsx` 中给全天卡片增加 1px 左内缩，并同步缩减宽度，避免首列卡片压到列边界线；新增 `AlldayEvent.spec.tsx` 锁定这一点。
- 与原计划的偏差：
  - 有。最初只修掉了 `AlldayRow` 的左侧 inset 问题，但浏览器复查后发现还存在滚动条补偿缺失这一层原因，因此补充了 week/day 顶部对齐修复。
- 验证结果：
  - `pnpm --filter swell-calendar test -- src/components/dayGrid/AlldayRow.spec.tsx` 通过
  - `pnpm --filter swell-calendar test -- src/components/dayGrid/AlldayEvent.spec.tsx` 通过
  - `pnpm --filter swell-calendar test -- src/components/dayGridCommon/GridHeader.spec.tsx` 通过
  - `pnpm --filter swell-calendar exec tsc --noEmit` 通过
  - `node scripts/check-docs.mjs` 通过
  - `node scripts/check-arch.mjs` 通过
  - `pnpm --filter swell-calendar exec storybook build` 通过
  - 2026-06-19 本地 Storybook 人工验收通过：`日历 / 应用示例 / 周视图整页应用` 顶部全天行与下方时间网格未见额外整页滚动，未再出现明显右侧溢出
- 剩余问题：
  - Storybook build 仍有既有 warning：`addon-interactions` 顺序提示、Sass legacy JS API 提示与大 chunk 警告，本次未处理。
