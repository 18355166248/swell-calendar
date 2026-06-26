# 设计文档：日视图长按空白处触发新建日程

**日期**：2026-06-26  
**状态**：已批准，待实现

---

## 背景

移动端日视图（Day view）当前支持「长按 400ms + 拖拽」划定时间范围后创建日程。  
但长按后直接松手（不拖拽）什么都不发生，用户无法通过轻触式操作创建日程。

---

## 目标

**长按空白处后松手 → 弹出创建日程面板**（与拖拽创建走同一路径，移动端以全屏 page 样式展示）。

---

## 方案：修改 `onClickSelection`（方案 A）

### 根因分析

`useGridSelection` 在触控设备使用 `delayTouchStart: 400` 长按激活。激活后，若用户未拖拽直接松手，`draggingState` 仍为 `INIT`，走 "click" 路径 → `onClickSelection`。

`TimeGridView` 中 `onClickSelection` 对非 scheduler 视图当前为空操作（只有 scheduler 会回调 `onCellClick`），导致长按松手无效。

### 修改点

**文件**：`packages/calendar/src/components/timeGrid/TimeGridView.tsx`

`onSelectionEnd` 已有完整的创建逻辑：

```ts
onSelectionEnd: (selection) => {
  const event = createEventFromTimeGridSelection(timeGridData, selection);
  callbacks?.onRangeSelect?.(createRangeSelectionInfo(...));
  if (shouldAcceptEventChange(options, callbacks, { action: 'create', ... })) {
    callbacks?.onEventCreate?.({ event });
  }
}
```

在 `onClickSelection` 中加入相同逻辑（已有 `setGridSelectionByPosition` 在内部将单击位置设为单格选区）。

### 行为变化

| 场景 | 修改前 | 修改后 |
|------|--------|--------|
| 移动端：长按 400ms + 松手 | 无响应 | 弹出创建面板（以长按位置时间预填） |
| 移动端：长按 + 拖拽 | 创建多格事件 | 不变 |
| 桌面：点击空白 | 无响应 | 创建单格事件（附加效果，符合业界惯例） |
| 桌面：拖拽选区 | 创建多格事件 | 不变 |

### 不涉及范围

- `useDrag`、`useGridSelection` 接口不变
- 周视图（Week）同样受益（相同路径），但此任务聚焦日视图
- 不新增 haptic 反馈（长按激活时 `useDrag` 暂无触觉反馈，可后续迭代）

---

## 验证标准

1. 移动端日视图，长按空白区域 400ms 后松手 → 打开创建面板，时间与长按位置一致
2. 长按 + 拖拽 → 仍可多格选区创建
3. 桌面：单击空白 → 弹出创建对话框
4. 只读模式（`isReadOnly: true`）→ 无任何触发
