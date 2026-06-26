# 日视图长按空白处触发创建日程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移动端日视图长按空白处松手后，触发创建日程面板（桌面点击空白亦同）。

**Architecture:** 在 `TimeGridView.tsx` 的 `onClickSelection` 回调中，复用 `onSelectionEnd` 已有的事件创建逻辑。无需修改 `useDrag` 或 `useGridSelection` 的接口。

**Tech Stack:** React, TypeScript, swell-calendar 引擎内部 hooks

---

### Task 1: 在 `docs/tasks/` 建任务文档

**Files:**
- Create: `docs/tasks/2026-06-26-mobile-longpress-create.md`

- [ ] **Step 1: 创建任务文档**

```markdown
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
4. 只读模式：无触发

## 风险
无重大风险；桌面新增点击创建为有意行为（Google Calendar 同款）。

## 状态
实现中
```

- [ ] **Step 2: 确认文件已保存**

---

### Task 2: 修改 `TimeGridView.tsx`

**Files:**
- Modify: `packages/calendar/src/components/timeGrid/TimeGridView.tsx`（`handleMouseDown` 附近，约第 330–355 行）

当前 `handleMouseDown` 的 `onClickSelection` 对非 scheduler 视图是空操作。在其中加入与 `onSelectionEnd` 相同的创建调用。

- [ ] **Step 1: 定位当前 `onClickSelection`**

打开 `packages/calendar/src/components/timeGrid/TimeGridView.tsx`，找到 `handleMouseDown = useGridSelection(...)` 块（约第 330 行）。当前代码：

```ts
onClickSelection: (selection) => {
  if (currentView === 'scheduler') {
    callbacks?.onCellClick?.(createRangeSelectionInfo(timeGridData, selection, currentView));
  }
},
```

- [ ] **Step 2: 修改 `onClickSelection`，加入创建逻辑**

将 `onClickSelection` 替换为：

```ts
onClickSelection: (selection) => {
  if (currentView === 'scheduler') {
    callbacks?.onCellClick?.(createRangeSelectionInfo(timeGridData, selection, currentView));
    return;
  }

  const event = createEventFromTimeGridSelection(timeGridData, selection);
  callbacks?.onRangeSelect?.(createRangeSelectionInfo(timeGridData, selection, currentView));

  if (
    shouldAcceptEventChange(options, callbacks, {
      action: 'create',
      view: currentView,
      event,
      existingEvents: events.map((uiModel) => uiModel.model.toEventObject()),
    })
  ) {
    callbacks?.onEventCreate?.({ event });
  }
},
```

- [ ] **Step 3: 类型检查**

```bash
cd /Users/xmly/Swell/code/swell-calendar
pnpm --filter @swell-calendar/calendar tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 4: 提交**

```bash
git add packages/calendar/src/components/timeGrid/TimeGridView.tsx docs/tasks/2026-06-26-mobile-longpress-create.md
git commit -m "feat(mobile): 日视图长按空白处触发新建日程"
```

---

### Task 3: 更新 SPEC.md

**Files:**
- Modify: `packages/calendar/SPEC.md`（搜索 `onRangeSelect` 或 `onEventCreate` 相关描述）

- [ ] **Step 1: 在 SPEC 中追加行为说明**

找到 `onEventCreate` 的描述段落，在"触发时机"里补充：

> 移动端日视图（及周视图）：触控长按空白时间格 400ms 后抬手，以长按格为开始时间触发；桌面：点击空白格触发（单格选区）。

- [ ] **Step 2: 提交**

```bash
git add packages/calendar/SPEC.md
git commit -m "docs(spec): 补充 onEventCreate 移动端长按触发说明"
```
