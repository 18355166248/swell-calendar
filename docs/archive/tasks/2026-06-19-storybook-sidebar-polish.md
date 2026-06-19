## 背景

当前 `packages/calendar` 的 Storybook 已完成品牌首页和基础 manager 主题切换，但左侧 sidebar 仍然偏默认工具导航质感：

- 分组层级只靠缩进和默认图标表达，信息密度低
- `概览 / 视图 / 调度器 / 回归测试` 这些关键入口没有视觉优先级
- 导航文案已经中文化，但缺少 badge / 副标题 / 语义提示

这会让 Storybook 首页已经“像展厅”，但左侧菜单仍然像默认开发工具，第一印象断裂。

## 目标

- 在当前 Storybook 9.0.14 基础上优化 sidebar，不进行版本升级
- 为左侧关键导航项增加更清晰的视觉层级和语义提示
- 保持现有 story id、排序和交互回归入口稳定
- 将 sidebar 渲染语义收口到可测试配置层，而不是散落在 manager 里硬编码

## 非目标

- 不升级到 Storybook 10
- 不替换为完全自定义的 Storybook sidebar 容器
- 不修改 stories 的 `meta.title` 真源
- 不改公开 API、组件运行时逻辑或发布产物

## 影响范围

- 代码：
  - `packages/calendar/.storybook/manager.ts`
  - `packages/calendar/.storybook/manager.css`
  - `packages/calendar/.storybook/preview.ts`
  - `packages/calendar/src/stories/showcase.ts`
  - `packages/calendar/src/stories/showcase.spec.ts`
- 文档：
  - `docs/tasks/2026-06-19-storybook-sidebar-polish.md`
- 运行时行为：
  - 仅影响 Storybook manager 左侧导航的标签渲染与视觉样式

## 现状

- `packages/calendar/.storybook/manager.ts` 已通过 `addons.setConfig()` 接管 manager 主题，但只做到 token 层，没有深度改 sidebar item 的内容结构。
- 当前 Storybook 9.0.14 已支持 `sidebar.renderLabel`，因此无需升级即可自定义导航项展示。
- `packages/calendar/.storybook/preview.ts` 里仍重复声明了一份 sidebar 排序，和 `showcase.ts` 的排序真源存在重复。

## 方案

### 1. 抽出 sidebar 语义配置

在 `showcase.ts` 中新增 sidebar item meta 生成逻辑，统一管理：

- 哪些分组需要 badge
- 哪些关键入口需要副标题
- 哪些项属于 `brand / feature / qa / neutral` 语义
- 哪些项要在侧栏里被强调

### 2. 使用 `sidebar.renderLabel` 重绘左侧标签

在 `manager.ts` 里保留现有主题配置，并增加：

- `sidebar.renderLabel`
- 基于 meta 的 badge + 标题 + caption 结构

目标不是替换 Storybook sidebar，而是在默认 sidebar 中，把“关键路径”做成更像品牌化导航。

### 3. 增加 manager 专用样式层

新增 `manager.css`，仅负责 sidebar label 内部结构样式：

- badge
- caption
- root / feature / QA 语义色
- 关键项强调层级

避免依赖 Storybook 内部不稳定的 Emotion hash 类名，尽量只样式化我们自己渲染出来的 DOM。

### 4. 收口 story sort 真源

让 `preview.ts` 直接复用 `showcase.ts` 的排序配置，减少后续 sidebar 调整时的重复维护成本。

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [x] `pnpm --filter swell-calendar exec tsc --noEmit`
- [x] `pnpm --filter swell-calendar test -- src/stories/showcase.spec.ts`
- [x] `pnpm --filter swell-calendar exec storybook build`
- [x] Storybook 浏览器人工验收：关键 badge/caption、选中态与深层 story 可读性

## 风险与回滚

- 风险：`renderLabel` 自定义过重，导致选中态或深层 story 可读性下降
- 风险：manager 样式若依赖 Storybook 私有类名，升级时会脆弱
- 回滚方式：移除 `sidebar.renderLabel` 与 `manager.css`，恢复默认 label 渲染

## 实施结果

- 实际改动：
  - 新增 `packages/calendar/.storybook/manager.css`，为 Storybook manager 左侧导航提供 badge、caption、语义色和强调层级样式。
  - 更新 `packages/calendar/.storybook/manager.ts`，在现有主题配置基础上接入 `sidebar.renderLabel`，把关键导航项渲染成 badge + 标题 + 副标题结构。
  - 更新 `packages/calendar/src/stories/showcase.ts`，新增 sidebar meta 真源，统一描述 `brand / feature / qa / neutral` 语义。
  - 更新 `packages/calendar/src/stories/showcase.spec.ts`，补充 sidebar meta 单测，锁定旗舰能力与 QA 分组的标签语义。
- 与原计划的偏差：
  - 原计划想把 `preview.ts` 的 `storySort` 完全收口到 `showcase.ts` 常量，但 Storybook 9 的 CSF 解析要求 `options.storySort` 必须内联字面量，外部常量会导致构建失败，因此保留了排序重复定义。
- 验证结果：
  - `node scripts/check-docs.mjs` 通过
  - `node scripts/check-arch.mjs` 通过
  - `pnpm --filter swell-calendar exec tsc --noEmit` 通过
  - `pnpm --filter swell-calendar test -- src/stories/showcase.spec.ts` 通过（5 tests）
  - `pnpm --filter swell-calendar exec storybook build` 通过
  - 2026-06-19 本地 Storybook 人工验收通过：
    - 左侧导航的 `HOME / CORE / FLAG / LIB` badge 与 caption 正常显示
    - 当前选中项高亮、根分组层级和品牌色语义可读性正常
    - manager 侧栏与 preview 舞台风格一致，未见明显串样
    - 已补本地浏览器验收记录，结论与机械检查一致
- 剩余问题：
  - 侧栏更深层的折叠/展开交互仍主要依赖 Storybook 默认容器行为；后续如继续强化导航体验，可再补针对深层子项的专门 storybook harness 断言。
