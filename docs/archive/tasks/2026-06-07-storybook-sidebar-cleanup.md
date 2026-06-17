# 2026-06-07 Storybook 侧边栏整理与中文化

## 背景

当前 Storybook 左侧导航存在两个问题：

- `Scheduler` 示例过多，全部堆在同一个分组下，展开后过长、查找成本高。
- 视图和示例名称以英文/技术名为主，不利于日常快速浏览和给业务/设计同学演示。

这次改动目标是只整理 Storybook 展示层的信息架构，不改组件能力与交互行为。

## 目标

- 将 Storybook 左侧目录按视图和能力做更清晰的分类。
- 将常用 demo 名称改为中文。
- 将 `Scheduler` 示例拆为多个子分组，降低单组长度。

## 非目标

- 不修改 `packages/calendar/SPEC.md`，本次无产品能力和 API 变化。
- 不删除已有关键 demo，只做重组和命名收敛。
- 不修改 demo 的核心交互逻辑与自动化断言。

## 影响范围

- 代码：
  - `packages/calendar/src/stories/Calendar/*.stories.tsx`
  - `packages/calendar/src/stories/Calendar/Scheduler.shared.tsx`
  - `packages/calendar/scripts/drag-resize-pointer-regression.mjs`
- 文档：
  - 本任务文档
- 运行时行为：
  - 仅影响 Storybook 左侧目录结构、story 标题和部分 story id

## 现状

- `Day / Week / Month / Timeline / App` 入口名称较直白但偏英文。
- `Scheduler.stories.tsx` 单文件同时承载基础展示、约束能力、交互、集成能力和回归测试，左侧目录噪音较高。

## 方案

- 顶层统一改为中文目录，如 `日历/视图/日视图`、`日历/调度器/交互`。
- `Scheduler` 原故事文件改为共享模块，仅保留故事定义与公共 helper。
- 新建多个按主题划分的 `.stories.tsx` 文件承接不同分类：
  - 基础
  - 交互
  - 约束与资源
  - 高级能力
  - 回归测试
- 对每个 story 增加中文 `name`，保证左侧展示语言统一。
- 同步修正依赖特定 story id 的脚本默认地址。

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [x] `pnpm --filter swell-calendar exec eslint src/stories/Calendar/*.stories.tsx src/stories/Calendar/Scheduler.shared.tsx packages/calendar/scripts/drag-resize-pointer-regression.mjs`
- [x] `pnpm --filter swell-calendar exec tsc --noEmit`
- [ ] `pnpm --filter swell-calendar test`

## 风险与回滚

- 风险：story id 变化会影响依赖固定 URL 的手工书签或脚本入口。
- 回滚方式：恢复 story 文件命名与 `meta.title` / `name` 配置。

## 实施结果

- 实际改动：
  - `Day / Week / Month / Timeline / App` 入口统一改为中文目录与中文 story 名称。
  - `Scheduler.stories.tsx` 拆为共享模块 `Scheduler.shared.tsx` + 5 个中文分类故事文件：
    - `Scheduler.Basic.stories.tsx`
    - `Scheduler.Interactions.stories.tsx`
    - `Scheduler.Constraints.stories.tsx`
    - `Scheduler.Advanced.stories.tsx`
    - `Scheduler.Regression.stories.tsx`
  - 浏览器级拖拽回归脚本默认 story id 已同步到新分类路径。
- 与原计划的偏差：
  - 未删除已有关键 demo，采用“重组分类 + 中文化”而非进一步裁剪能力样例，优先降低迁移风险。
- 验证结果：
  - `node scripts/check-docs.mjs` 通过
  - `node scripts/check-arch.mjs` 通过
  - `pnpm --filter swell-calendar exec eslint src/stories/Calendar/*.stories.tsx src/stories/Calendar/Scheduler.shared.tsx scripts/drag-resize-pointer-regression.mjs` 通过
  - `pnpm --filter swell-calendar exec tsc --noEmit` 通过
- 剩余问题：
  - 当前命令行环境未连上活动的 Storybook dev server，暂未直接截图核对左侧导航渲染效果；源码与类型层已完成收敛。
