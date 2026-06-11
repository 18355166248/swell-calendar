# 2026-06-07 拖拽 / resize 自动化测试补强

## 背景

最近一轮 scheduler 拖拽与 resize 交互连续修了多次：

- `fix(scheduler): eliminate resize ghost transparency, drop flicker, cid race, stuck guide, and tiny handle`
- `fix(drag): auto-recover from lost mouseup + fix useDraggingEvent closure race`

虽然当前自测已能覆盖主要路径，但回归仍主要靠手工在 Storybook 里反复拖拽发现。最近暴露的问题集中在：

- 拖拽状态机卡死（mouseup 丢失后永远停在 `DRAGGING`）
- `useDraggingEvent` 同批次 `setDragging -> reset` 的闭包竞态
- move / resize 后残留旧状态，导致其它卡片后续无法交互

这些问题都不是纯 controller 规则错误，而是 **hook + store + DOM 事件时序** 的回归。

## 目标

- 为拖拽状态机补一层比 Storybook `play` 更快、更稳的 hook 级自动化测试。
- 让最近两类高频回归可以在 `vitest` 中直接失败，而不是继续依赖人工拖拽复测。
- 再补一层可单独执行的浏览器级 pointer 回归，让真实鼠标路径也能进入自动化。

## 非目标

- 不修改 `packages/calendar/SPEC.md`，本次无公开 API / 行为边界变更。
- 不替换现有 Storybook `DragResizeRegression` 交互故事；它仍负责真实 DOM/布局回归。
- 不在本轮引入新的测试库（如 Testing Library / Playwright 单独工程）。

## 方案

### 1. `useDrag` 增加 DOM 级 hook 测试

覆盖：

- 鼠标按下 + 超过最小拖拽距离后进入 `DRAGGING`
- `mousemove` 过程中若 `buttons` 丢成 `0`，会自动走 `handleMouseUp`
- 自恢复后 store 回到 `IDLE`，且下一次拖拽仍可正常开始

这组测试直接锁住“半透明卡片卡死、后续全部无法拖拽/resize”的根因。

### 2. `useDraggingEvent` 增加 store 时序测试

覆盖：

- 同一批次内 `initDrag -> setDraggingEventUIModel -> setDragging -> reset`
  仍会正确标记 `isDraggingEnd`
- `clearDraggingEvent` 后可以无残留地跟踪下一张卡片
- resize 方向（`start` / `end`）仍能正确解析与重置

这组测试直接锁住最近修复的 closure race，不再只靠 Storybook 跨列 resize story 间接覆盖。

### 3. 独立 Playwright 脚本增加真实 pointer 浏览器回归

覆盖：

- 基于独立 story `DragResizePointerRegression`，不依赖 `fireEvent`
- 使用 Playwright `page.mouse` 执行真实拖拽 / resize 手势
- 通过独立脚本只跑这组慢测，不依赖当前与 Storybook 9 兼容性不稳定的 `test-storybook` 链

命令：

- `pnpm --filter swell-calendar test:drag:pointer`
- `pnpm --filter swell-calendar test:drag:pointer:headed`

这层测试主要兜真实浏览器中的命中、拖拽轨迹和跨列回归，不替代现有 `vitest` 快测。

## 影响范围

- `docs/tasks/2026-06-07-drag-resize-test-hardening.md`
- `packages/calendar/src/hooks/common/useDrag.spec.tsx`
- `packages/calendar/src/hooks/event/useDraggingEvent.integration.spec.tsx`
- `packages/calendar/src/stories/Calendar/Scheduler.stories.tsx`
- `packages/calendar/scripts/drag-resize-pointer-regression.mjs`
- `packages/calendar/package.json`

## 验证

- `pnpm --filter swell-calendar test`
- `pnpm --filter swell-calendar test:drag:pointer`
- `pnpm --filter swell-calendar exec tsc --noEmit`
- `node scripts/check-docs.mjs`
- `node scripts/check-arch.mjs`

## 风险

- hook 测试依赖 jsdom + React effect 刷新时序，写法需要尽量避免和实现细节耦合过深。
- 这层测试主要兜“状态机与事件时序”，仍不能替代真实布局与 hit area 的 Storybook 交互回归。
- 浏览器级 pointer 回归属于慢测，适合作为专项回归或提交前补跑，不建议替代全量 `vitest`。
- 该脚本要求目标 Storybook 实例已启动，并能通过 `STORYBOOK_URL` 访问。

## 完成状态

- 已完成：
  - `useDrag` lost mouseup 自恢复快测
  - `useDraggingEvent` closure race / 清理残留快测
  - `DragResizePointerRegression` 浏览器级真实指针回归与独立脚本入口
