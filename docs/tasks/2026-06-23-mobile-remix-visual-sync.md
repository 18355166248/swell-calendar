# Mobile Remix Visual Sync

## 背景

`claude-design/mobile/swellcalendar-remix/project/swell-calendar-mobile.html` 是 Claude Design 导出的移动端日历原型入口。本次只针对 `apps/swell-calendar-s2` 移动端与该 HTML 源文件的两处差异做小范围优化。

## 目标

- 以 `claude-design/mobile/swellcalendar-remix/project/swell-calendar-mobile.html` 和本地预览 `http://127.0.0.1:8080/swell-calendar-mobile.html` 为视觉来源。
- 修正移动端顶部区域与周条的浅灰背景，以及日历内容区白底。
- 修正移动端时间列表滚动边界：顶部日期 / 全天区域不参与滚动，只有下方时间列表滚动。
- 移动端日 / 多日时间轴展示完整 24 小时。
- 修正移动端列表视图：固定日期行跟随顶部区域，列表内后续日期不再吸顶。

## 非目标

- 不调整日期、mock 数据、事件内容或周起始。
- 不调整 `packages/calendar` 公开 API、能力边界或生产组件架构。
- 不引入新的运行时依赖。
- 不参考或恢复本地截图目录；不处理桌面端样式。

## 影响范围

- `apps/swell-calendar-s2/src/appCalendarConfig.ts`
- `apps/swell-calendar-s2/src/appCalendarConfig.spec.ts`
- `apps/swell-calendar-s2/src/App.tsx`
- `apps/swell-calendar-s2/src/styles/app.css`
- `packages/calendar/src/components/view/Agenda.tsx`
- `packages/calendar/src/css/responsive.scss`

## 方案

- 增加移动端 top zone 背景变量，对齐设计稿 `--m-topzone`。
- 将 `.app--mobile` / `.canvas--mobile` 背景收敛为日历内容白底。
- 将移动端 canvas 改为不滚动，仅让 `.swell-calendar-time` 面板滚动。
- 移动端 `week.hourStart/hourEnd` 使用 `0/24`，桌面仍保持 `8/20`。
- 移动端 agenda 增加固定日期 header，滚动区内日期 header 取消 sticky。
- 移动端按路由初始化视图，确保直接打开 `/app/calendar/agenda` 时进入列表视图。

## 验证

- `node scripts/check-docs.mjs`：通过。
- `node scripts/check-arch.mjs`：通过。
- `pnpm --filter swell-calendar-s2 exec tsc --noEmit`：通过。
- `pnpm --filter swell-calendar-s2 build`：通过；仅保留既有 `mockjs` eval 与 chunk size 警告。
- `pnpm --filter swell-calendar-s2 test -- src/appCalendarConfig.spec.ts`：通过；沙箱下有 Vite WebSocket `EPERM` 噪声但退出码为 0。
- 浏览器移动 viewport 验证：顶部 / 周条背景为 `oklch(0.955 0.003 270)`，app / canvas / 日期标题 / 全天行为白底；canvas 为 `overflow:hidden`，时间面板为 `overflow-y:auto`。
- 浏览器移动 viewport 验证：时间轴从 `00:00` 开始，grid 高度约 `1248px`。
- 浏览器移动 viewport 验证：`/app/calendar/agenda` 进入列表视图；固定日期行在 `.swell-calendar-agenda-scroll` 外，背景为 `oklch(0.955 0.003 270)`；滚动区内日期行 `position: static`。

## 最终方案

- 仅在 `apps/swell-calendar-s2/src/styles/app.css` 调整移动端样式变量和滚动边界。
- 顶部导航与周条使用设计稿浅灰 top zone；日历主体维持白底。
- 移动端外层 canvas 不再作为滚动容器，顶部日期 / 全天区域保留在时间列表上方；下方 `.swell-calendar-time` 单独滚动。
- 移动端日 / 多日视图时间轴展示 `00:00-24:00`；桌面时间范围不变。
- 移动端列表视图使用设计稿同款固定日期行，后续日期行跟随列表内容自然滚动。
- 未调整日期、mock 数据、周起始、事件内容或 `packages/calendar` API。

## 风险

- 本次只做样式边界修正，不处理更大范围的像素级还原差异。
