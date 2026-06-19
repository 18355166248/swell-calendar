# 2026-06-19 Storybook 品牌展厅化改造

## 背景

当前 `packages/calendar` 的 Storybook 已具备：

- 中文化导航与首页入口
- workbench 包裹层
- 交互回归与 `test-storybook` 基座

但整体气质仍偏“开发工具态”：

- 视觉层级偏素，缺少品牌感和高级感
- 首页更像说明页，不像真正的展厅入口
- preview / docs / manager 三层品牌表达没有共用语义
- Storybook 虽然能演示能力，但不够像一个可以对外展示的产品面

## 目标

- 在**不迁移 Storybook** 的前提下，把展示层升级成高质感品牌展厅
- 抽出一套可复用的 showcase 设计令牌，统一 preview / docs / manager 视觉语义
- 重做首页、导航排序与展示舞台，让访问路径更清晰
- 保留现有 stories、交互测试和回归链路，不影响组件库公开 API

## 非目标

- 不迁移到 Histoire、Ladle、Dumi 或独立文档站
- 不修改 `CalendarProps`、`CalendarOptions` 或对外导出类型
- 不重写现有交互 story 的业务逻辑
- 不扩展到组件库运行时主题系统，本次只作用于 Storybook 展示层

## 影响范围

- 代码：
  - `packages/calendar/.storybook/preview.ts`
  - `packages/calendar/.storybook/manager.ts`
  - `packages/calendar/src/stories/Overview.mdx`
  - `packages/calendar/src/stories/showcase.ts`
  - `packages/calendar/src/stories/showcase.css`
  - `packages/calendar/src/stories/showcase.spec.ts`
- 文档：
  - `docs/tasks/2026-06-19-storybook-brand-showcase.md`
- 运行时行为：
  - 仅影响 Storybook 首页、导航排序、预览舞台与 manager 主题
  - 不影响发布库与组件运行时 API

## 现状

- 首页 `Overview.mdx` 已替换默认模板，但仍以说明性信息为主，首屏冲击力不足
- `.storybook/preview.ts` 已有统一舞台，但仍偏轻量包装，缺少品牌化层级
- `.storybook/manager.ts` 目前为偏通用的深色紫色主题，不够成熟克制
- 调度器 stories 已按“基础 / 交互 / 高级能力 / 回归测试”拆分，但展示语义仍未系统化

## 方案

### 1. 建立 showcase 配置层

新增 `src/stories/showcase.ts`，统一承载：

- 设计令牌（色彩 / 字体 / 边框 / 阴影 / 背景层级）
- 导航排序真源
- Story 分类函数（品牌展示 vs Internal QA / docs vs calendar stage）
- 首页使用的视图卡片、能力标签与浏览路径数据

### 2. 重做首页为品牌展厅入口

升级 `Overview.mdx`：

- Hero 首屏：价值主张 + 三个核心信号
- 五视图矩阵：以卡片方式导览核心场景
- Scheduler 旗舰能力区：突出资源、recurrence、timezone、DnD
- 推荐浏览路径：引导首次访问者按“首页 → 视图 → 调度器 → 回归”浏览

### 3. 重做 preview 舞台

`preview.ts` 改为使用 showcase 配置层：

- 日历 story 使用高质感产品展台样式
- docs 模式单独包一层 branded shell
- 顶部信息条改为品牌化的 eyebrow / 标题 / 场景说明
- 对回归场景单独标识为 `Internal QA`，避免破坏整体第一印象

### 4. 重做 manager 主题

`manager.ts` 从当前紫色深色主题切换到更成熟的暖中性色 + 铜棕强调色体系：

- 更克制的品牌 logo
- 更高端的背景、边框、搜索框和选中态
- 保持工具可用，但整体更像产品展厅后台

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
- [ ] Storybook 人工验收：首页、导航排序、Day / Month / Scheduler / Timeline 舞台、docs/canvas 不互相污染

## 风险与回滚

- 风险：若直接改 `meta.title` 会破坏既有 story id 与回归脚本入口
  - 缓解：本轮优先通过排序、首页和壳层升级改善体验，尽量不改 story 标题真源
- 风险：preview / docs / manager 三层主题分裂
  - 缓解：统一收口到 `showcase.ts`
- 回滚方式：移除 showcase 配置层，恢复 `preview.ts`、`manager.ts` 与旧版 `Overview.mdx`

## 实施结果

- 实际改动：
  - 新增 `packages/calendar/src/stories/showcase.ts`，作为 Storybook 展示层真源，统一管理品牌令牌、导航排序、场景分层和首页内容数据。
  - 新增 `packages/calendar/src/stories/showcase.css`，为 docs 首页提供独立的品牌展厅样式，不污染组件运行时样式。
  - 新增 `packages/calendar/src/stories/showcase.spec.ts`，用 Vitest 锁定导航排序、品牌主题色和场景分类语义。
  - 重写 `packages/calendar/src/stories/Overview.mdx`：从说明页升级为品牌首页，加入 Hero、五视图矩阵、Scheduler 旗舰能力区和推荐浏览路径。
  - 重写 `packages/calendar/.storybook/preview.ts` 的展示壳层：引入品牌化顶部信息条、按 story 分类切换舞台语义，并为 docs 模式单独包裹 branded shell。
  - 重写 `packages/calendar/.storybook/manager.ts` 主题：从紫色深色工具风格切到更成熟的暖中性色 + 铜棕强调色体系，统一品牌 logo、背景和交互控件质感。
- 与原计划的偏差：
  - 未修改既有 story 的 `meta.title` 真源，只通过排序、首页和装饰器壳层升级导航体验，优先规避 story id 变化对回归脚本的影响。
  - 未补 `docs/ARCHITECTURE.md` / `SPEC.md` / ADR：本次仅影响 Storybook 展示层，不涉及公开 API、运行时架构或长期工程机制变化。
- 验证结果：
  - `node scripts/check-docs.mjs` 通过
  - `node scripts/check-arch.mjs` 通过
  - `pnpm --filter swell-calendar exec tsc --noEmit` 通过
  - `pnpm --filter swell-calendar test -- src/stories/showcase.spec.ts` 通过（4 tests）
  - `pnpm --filter swell-calendar exec storybook build` 通过
- 剩余问题：
  - 还未做浏览器内人工视觉验收，因此首页首屏、导航质感和各核心视图舞台的最终观感仍需你在本地 Storybook 中确认。
  - Storybook 构建仍有既有 warning：`@storybook/addon-interactions` 顺序提示、Sass legacy JS API 提示和大 chunk 警告；本次未处理这些非阻断问题。
