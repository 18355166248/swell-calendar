# 移动端日视图长按空白处创建日程

## 目标

长按空白处松手后弹出创建面板，与拖拽创建走同一回调路径。

## 范围

- 修改：`packages/calendar/src/components/timeGrid/TimeGridView.tsx`
- 不改：`useDrag`、`useGridSelection` 接口

## 方案

在 `onClickSelection` 里加入 `onEventCreate` 调用逻辑（同 `onSelectionEnd`）。

## 验证

1. 移动端：长按 400ms 松手 → 打开创建面板，时间与长按位置一致
2. 移动端：长按 + 拖拽 → 多格选区创建（不变）
3. 桌面：单击空白 → 弹出创建对话框
4. 只读模式（`isReadOnly: true`）→ 无触发

## 风险

无重大风险；桌面新增点击创建为有意行为（Google Calendar 同款）。

## 状态

已完成
