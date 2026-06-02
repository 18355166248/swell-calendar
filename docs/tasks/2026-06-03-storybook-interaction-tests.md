# 2026-06-03 Storybook 交互测试与 test-runner 支持

## 背景

Scheduler 组件的交互验证长期依赖人工操作（手动拖拽、手动 delete、手动检查模板渲染）。需要在 Storybook 中接入 `@storybook/test` + `@storybook/test-runner`，实现自动化交互测试，让每次改动后可在 CI 中自动跑全量 Story 交互测试。

## 目标

- 安装并配置 `@storybook/addon-interactions` 和 `@storybook/test-runner`
- 给 TimeEvent 组件加 `data-testid` 属性，支持测试选择器
- 为关键 Scheduler stories 编写 `play` 函数
- test-runner 全量通过

## 范围

### 已完成

- `@storybook/addon-interactions` 安装并注册到 `.storybook/main.ts`
- `@storybook/test-runner` 安装
- TimeEvent 新增 3 个 `data-testid`：卡片容器、resize 上/下手柄
- 4 个 Scheduler stories 增加 `play` 函数：
  - **Delete**：键盘自动化（聚焦 → Delete → 验证日志 + DOM 移除）
  - **Templates**：渲染验证（卡片数量、自定义 header 格式、资源名称）
  - **OverlapPolicy**：渲染验证（overlap=false/true 卡片存在）
  - **BufferTimes**：渲染验证（buffer 事件卡片存在）
- test-runner 全量通过：25 tests, 8 suites passed

### 未进入本轮

- 拖拽模拟（mousedown → mousemove → mouseup）在 `page.evaluate()` 环境下受限于 `useDrag` 的 React ref/useEffect 异步时序，`fireEvent` 无法可靠穿透
- 拖拽冲突验证（overlap/buffer）由 vitest controller 层单测覆盖：
  - `scheduler-overlap.spec.ts`（7 cases）
  - `scheduler-buffer.spec.ts`（5 cases）
  - `scheduler-validation.spec.ts`（13 cases）

## 验证

```bash
# 单元测试
pnpm --filter swell-calendar test     # 84 passed

# Storybook 交互测试（需先启动 Storybook）
npx test-storybook --url http://localhost:6006 --verbose   # 25 passed
```

## 影响范围

- `packages/calendar/.storybook/main.ts` — 注册 addon-interactions
- `packages/calendar/package.json` — 新增 devDependencies
- `packages/calendar/src/components/events/TimeEvent.tsx` — 加 data-testid
- `packages/calendar/src/stories/Calendar/Scheduler.stories.tsx` — 加 play 函数

## 风险

- `@storybook/addon-interactions` 最新版 v8.6.14 与 SB9 有 peer dep 版本警告，但功能正常。等 SB9 发布独立 v9 版后升级
- 拖拽自动化需要 react-testing-library 支持 React act() 包装或改用 Playwright 直接脚本
