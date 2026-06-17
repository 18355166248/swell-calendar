# 2026-06-06 拖拽跟手影子对齐整列满宽（mobiscroll parity）

## 背景

scheduler 时间网格内拖动事件时，跟手影子（`MovingEventShadow` → `useTimeGridEventMove` 的 `movingEvent`）的宽度沿用了原卡片在重叠分栏中的窄宽度与左偏移：

```ts
// getMovingEventLayout 改前
left: targetColumn.left + (targetColumn.width * draggingEvent.left) / 100,
width: (targetColumn.width * draggingEvent.width) / 100,
```

对一张处于重叠分栏的窄卡片（如 `width=50%`），跟手影子也保持 50% 窄宽并带左偏移，与主参考样例 mobiscroll 的手感不一致。

## 主参考样例实测

对 https://demo.mobiscroll.com/react/scheduler/desktop-week-view 用脚本实测拖动一张窄重叠卡片（原宽 64px / `style_w:50%`）：

- 原卡片：`opacity = 0.5`，留在原位变半透明
- 跟手克隆：`style_w = 100%`（实测整列宽 128px），`style_left` 为空（贴合列左边缘），`opacity = 1`
- 跨列移动时克隆始终为整列满宽
- 松手后按落点重排分栏

即拖拽过程中跟手影子**丢弃重叠分栏的窄宽度/偏移，铺满整列**，松手才重新分栏。

## 目标

- 让 `getMovingEventLayout` 的跟手影子贴合目标列：`left = targetColumn.left`，`width = targetColumn.width`
- `top/height`（时间→位置）不变
- 原卡片半透明（`TimeEvent` 已有 `opacity:0.5`）、松手重排（落下回调后 `setRenderInfoOfUIModels` 重算）均不动

## 非目标

- 不改顶边/双向 resize（独立后置项）
- 不改吸附粒度、边缘自动滚动
- 不改重叠合并布局算法本身
- 不单独改跨实例拖拽：跟手影子由源侧 `MovingEventShadow` 统一渲染，本次改动自动覆盖

## 方案

`packages/calendar/src/hooks/TimeGrid/useTimeGridEventMove.ts` 的 `getMovingEventLayout`：

```ts
// 改后：跟手影子铺满目标列，丢弃重叠分栏的窄宽度与偏移（对齐 mobiscroll）
left: targetColumn.left,
width: targetColumn.width,
```

## 影响范围

- `packages/calendar/src/hooks/TimeGrid/useTimeGridEventMove.ts`
- `packages/calendar/src/hooks/TimeGrid/useTimeGridEventMove.spec.ts`（更新满宽断言）

## 验证

- `pnpm --filter swell-calendar test useTimeGridEventMove`
- `pnpm --filter swell-calendar exec tsc --noEmit`
- `node scripts/check-docs.mjs` / `node scripts/check-arch.mjs`

## 风险

- 跟手影子宽度变化仅影响拖拽过程视觉，不改落点时间/列计算与最终重排，行为风险低
