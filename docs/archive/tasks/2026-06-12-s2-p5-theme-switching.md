# swell-calendar-s2 · P5 切片：明暗 / 强调色 / 密度切换

> 进度真源见 [2026-06-10-s2-app-roadmap.md](./2026-06-10-s2-app-roadmap.md) 的 P5 行。
> 本切片收口 P5 最后未完成部分：把当前写死的 `light / seafoam / regular` 解耦成真实可切配置。

## 背景

P5 前三片已经完成新建、搜索筛选、编辑删除，但主题相关配置仍停留在移植稿默认值：

- `main.tsx` 的 S2 `Provider` 写死 `colorScheme="light"`
- `App.tsx` 的 `CONFIG.theme / accent / density` 是常量，未持久化
- `SEAFOAM_THEME` 把 calendar 引擎主题写死成 seafoam，切 accent 后不会同步
- 根节点没有 `data-density`，密度切换也没有真实落点

这导致设置按钮仍是装饰性 UI，P5 无法宣告完成。

## 目标

- 顶栏设置按钮打开轻量设置面板。
- 支持切换：
  - 明暗：`light` / `dark`
  - 强调色：`seafoam` / `blue` / `indigo` / `magenta`
  - 密度：`compact` / `regular` / `comfy`
- 配置即时生效并持久化到 `localStorage`。
- `packages/calendar` 引擎主题跟随 CSS 变量，不再写死 seafoam。

## 方案

- **状态收敛**
  - 新增 `ui-prefs` 持久化键，统一保存 `theme / accent / density`
  - `App.tsx` 用 state 托管偏好，并负责把 `data-theme / data-accent / data-density` 写回 `documentElement`
- **Provider 解耦**
  - 把 `Provider` 从 `main.tsx` 挪回 `App.tsx`，让 `colorScheme` 跟随 `prefs.theme`
- **引擎主题变量化**
  - 现有 seafoam 主题改成 CSS 变量表达（`var(--accent-bg)` / `var(--accent-tint)` / `var(--text-2)` 等）
  - 这样根节点 accent/theme 改变后，scheduler / timeline 会自动跟随，不需要为每种配色硬编码一份 theme object
- **设置面板**
  - 复用现有 overlay 模式，新增 `SettingsPanel`
  - 由顶栏设置按钮锚定，点击外部关闭
- **密度落点**
  - app 样式新增 `data-density` 变量分支，控制 sidebar/topbar/subbar/chip 等壳层密度
  - timeline 通过 `timeline.rowHeight` 跟随密度；time-grid 通过 app 侧 CSS 覆盖最小高度，保持视觉比例接近

## 非目标

- 不补“今天 / 上一期 / 下一期”真实日期导航
- 不实现独立的主题预设保存/分享
- 不改事件分类色板语义（分类色仍按 `cat-*` token 体系）

## 验证计划

- `pnpm --filter swell-calendar-s2 exec tsc --noEmit`
- `pnpm --filter swell-calendar-s2 build`
- `node scripts/check-docs.mjs`
- `node scripts/check-arch.mjs`
- 浏览器验证：
  - 设置面板可打开/关闭
  - 明暗/强调色/密度切换即时生效
  - scheduler / timeline 跟随 accent 与 theme
  - 刷新后配置保留

## 风险与回滚

- 风险：S2 组件的内部样式仍有少量默认色烘焙，需继续通过现有 `UNSAFE_className + CSS` 覆盖焦点环/CTA。
- 风险：calendar time-grid 没有原生 density API，本次只能通过 app 侧高度变量做近似收敛。
- 回滚：删除设置面板与 `ui-prefs` 持久化，恢复默认 root attrs / Provider 即可。

## 实施结果

- `App.tsx`
  - 新增 `ui-prefs` 持久化层，统一托管 `theme / accent / density`
  - `Provider` 改为跟随 `prefs.theme`
  - root 同步写入 `data-theme / data-accent / data-density`
  - calendar 引擎主题从写死 seafoam 改为 CSS 变量驱动，scheduler / timeline 跟随 root 配置
  - timeline 增加按密度映射的 `rowHeight`
- `shell.tsx`
  - 设置按钮接入真实点击行为，锚定设置面板
- `overlays.tsx`
  - 新增 `SettingsPanel`，提供明暗 / 强调色 / 密度切换
- `app.css`
  - 新增 `data-density` 变量分支
  - 新增设置面板样式
  - time-grid 最小高度改为随密度变化
- `main.tsx`
  - 移除写死 `colorScheme="light"` 的外层 Provider

## 验证结果

- `pnpm --filter swell-calendar-s2 exec tsc --noEmit` ✅
- `pnpm --filter swell-calendar-s2 build` ✅
- `node scripts/check-docs.mjs` ✅
- `node scripts/check-arch.mjs` ✅
- Codex in-app browser 验证 ✅
  - 已成功启动 `http://127.0.0.1:5180/`
  - 顶栏「设置」可正常拉起 `SettingsPanel`
  - 在真实页面切到 `dark + indigo + comfy` 后，`documentElement` 的 `data-theme/data-accent/data-density` 分别为 `dark / indigo / comfy`
  - 截图确认设置面板、深色外壳、indigo 强调色与舒展密度均已生效

## 剩余风险

- `comfy / compact` 对 scheduler time-grid 的密度调节仍是宿主侧近似方案，不是 calendar 内核原生密度 API；后续如果进入真产品化，建议补库级配置口。
