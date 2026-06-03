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

**Storybook 交互测试核心：**
- `@storybook/addon-interactions` 安装并注册到 `.storybook/main.ts`
- `@storybook/test-runner` 安装
- TimeEvent 新增 3 个 `data-testid`：卡片容器、resize 上/下手柄
- AlldayEvent 新增 `data-testid` 属性支持测试选择器
- 4 个 Scheduler stories 增加 `play` 函数：
  - **Delete**：键盘自动化（聚焦 → Delete → 验证日志 + DOM 移除）
  - **Templates**：渲染验证（卡片数量、自定义 header 格式、资源名称）
  - **OverlapPolicy**：渲染验证（overlap=false/true 卡片存在）
  - **BufferTimes**：渲染验证（buffer 事件卡片存在）
- test-runner 全量通过：25 tests, 8 suites passed

**Test-Runner 基础设施补全：**
- `.storybook/test-runner.ts` — Storybook test-runner 配置（preVisit/postVisit 钩子）
- `jest-playwright.config.js` — jest-playwright 浏览器启动配置，支持 HEADED 模式
- `test-runner-jest.config.js` — Jest 配置，支持 headed 演示模式和 SERVER/LAUNCH 切换
- `package.json` 新增 `test:storybook` 和 `test:storybook:headed` 脚本

**ESLint import-sort 规则全量应用：**
- `eslint.config.js` 启用 `eslint-plugin-simple-import-sort` + `eslint-plugin-unused-imports` 自动修复
- 全量文件（~90 个）import 语句按规则重排：`react/lodash → @/constants → @/contexts → @/helpers → @/types → 相对路径`

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

# headed 演示模式（弹出浏览器窗口，慢动作演示）
HEADED=true pnpm --filter swell-calendar test:storybook
```

## 影响范围

- `packages/calendar/.storybook/main.ts` — 注册 addon-interactions
- `packages/calendar/.storybook/test-runner.ts` — test-runner 配置
- `packages/calendar/jest-playwright.config.js` — Playwright 浏览器配置
- `packages/calendar/test-runner-jest.config.js` — Jest test-runner 配置
- `packages/calendar/package.json` — 新增 devDependencies + test:storybook 脚本
- `packages/calendar/eslint.config.js` — 启用 import-sort 规则
- `packages/calendar/src/components/events/TimeEvent.tsx` — 加 data-testid
- `packages/calendar/src/components/dayGrid/AlldayEvent.tsx` — 加 data-testid
- `packages/calendar/src/stories/Calendar/Scheduler.stories.tsx` — 加 play 函数
- `packages/calendar/src/components/**` — ~30 个组件 import 排序规范化
- `packages/calendar/src/contexts/**` — ~4 个 context import 排序规范化
- `packages/calendar/src/slices/**` — ~6 个 slice import 排序规范化
- `packages/calendar/src/controller/**` — ~5 个 controller import 排序规范化
- `packages/calendar/src/hooks/**` — ~6 个 hook import 排序规范化
- `packages/calendar/src/helpers/**` — ~4 个 helper import 排序规范化

## 风险

- `@storybook/addon-interactions` 最新版 v8.6.14 与 SB9 有 peer dep 版本警告，但功能正常。等 SB9 发布独立 v9 版后升级
- 拖拽自动化需要 react-testing-library 支持 React act() 包装或改用 Playwright 直接脚本
- import 排序变更触及面广但均为机械性修改，无运行时影响
