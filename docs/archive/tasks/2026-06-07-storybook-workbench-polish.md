# 2026-06-07 storybook workbench polish

## 背景

当前 `packages/calendar` 的 Storybook 已能承载基础组件演示与回归场景，但工作台体验仍偏默认：

- 右侧 / 下方 addons 面板默认展开，干扰预览聚焦
- 全局预览区缺少统一舞台包装，`Calendar` 与 `Example` stories 的观感都偏“开发态”
- 左侧目录虽然已完成中文分组，但整体工作台还没有形成稳定的演示氛围

## 目标

- 默认隐藏 addons / panel，让画布优先聚焦故事本身
- 统一 Storybook 工作台的视觉风格，让预览更像“组件展厅”而不是原始开发面板
- 为 `Calendar` 类大画布故事和 `Example` 类小组件故事提供不同密度的预览舞台

## 非目标

- 不修改 `Calendar` 组件公开 API
- 不重写现有 stories 的交互逻辑
- 不引入第三方 Storybook UI addon

## 影响范围

- `packages/calendar/.storybook/main.ts`
- `packages/calendar/.storybook/preview.ts`
- `packages/calendar/.storybook/manager.ts`
- 如有需要，新增 Storybook 预览样式文件

## 方案

1. `manager` 层

- 通过 `addons.setConfig` 默认隐藏 addons panel
- 保持 panel 可手动打开，不移除既有功能
- 统一 Storybook 管理端的基础主题与品牌文案

2. `preview` 层

- 增加全局 decorator，统一画布背景、留白和舞台外壳
- `日历/` 下的 stories 保持大画布展示，但增加更克制的背景和容器边界
- `Example` 类故事使用居中卡片化舞台，改善默认小组件演示观感

3. 验证

- 启动本地 Storybook，确认 addons panel 默认隐藏
- 目视检查 `Calendar` 与 `Example` 两类故事的舞台布局
- 保证不影响既有 story 渲染与交互测试

## 验证方式

- `node scripts/check-docs.mjs`
- `node scripts/check-arch.mjs`
- `pnpm --filter swell-calendar exec tsc --noEmit`
- `pnpm --filter swell-calendar test`
- 本地 Storybook 人工验收

## 本次实现

- 新增 `packages/calendar/.storybook/manager.ts`
  - 默认隐藏 addons / panel
  - 保留手动打开能力
  - 隐藏低价值的 `zoom` / `eject` 工具按钮，减少顶部噪音
  - 统一 Storybook 管理端主题与品牌信息
- 更新 `packages/calendar/.storybook/preview.ts`
  - 增加全局 decorator，为 story 画布提供统一舞台包装
  - `日历/` 目录故事使用更克制的大画布舞台，不再叠加厚重卡片感
  - 非日历故事使用更轻的居中卡片式舞台，提升组件演示观感
  - 增加轻量头部信息条，强化“展厅 / workbench”氛围

## 本次验证结果

- `node scripts/check-docs.mjs`
- `node scripts/check-arch.mjs`
- `pnpm --filter swell-calendar exec tsc --noEmit`
- `pnpm --filter swell-calendar exec storybook build`

说明：

- 包内脚本 `pnpm --filter swell-calendar build-storybook` 依赖本机 `nvm use 20`，当前环境缺少 `nvm`，因此改用 `pnpm --filter swell-calendar exec storybook build` 直接验证 Storybook 配置可构建
