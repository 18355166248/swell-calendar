# Mobile Remix Visual Sync

## 背景

`claude-design/mobile/swellcalendar-remix/project/swell-calendar-mobile.html` 是 Claude Design 导出的移动端日历原型入口。最新参考稿已切换为更贴近 iOS 日历的红色强调、底部导航和节假日展示，需要同步当前页面表现。

## 目标

- 以 `claude-design/mobile/swellcalendar-remix/project/ref/` 下的日、多日、月、列表参考图为视觉来源。
- 优化移动端原型的顶部导航、周日期条、时间轴、月视图、列表视图和底部导航。
- 保持现有 React UMD 原型结构和轻交互能力，继续支持日 / 多日 / 月 / 列表切换。

## 非目标

- 不调整 `packages/calendar` 公开 API、能力边界或生产组件架构。
- 不引入新的运行时依赖。
- 不处理桌面端 `swell-calendar.html` 或打印页。

## 影响范围

- `claude-design/mobile/swellcalendar-remix/project/mobile-app.jsx`
- `claude-design/mobile/swellcalendar-remix/project/mobile-views.jsx`
- `claude-design/mobile/swellcalendar-remix/project/mobile.css`
- `claude-design/mobile/swellcalendar-remix/project/data.js`

## 方案

- 将原型强调色收敛为 iOS 日历红，并补齐底部 `今天 / 日历 / 收件箱` 导航。
- 调整顶部操作区，使用参考稿中的返回月份、视图图标、搜索和新增操作。
- 重新整理日期条、时间轴和全天区样式，使选中态、当前时间线、节日 chip 与参考稿一致。
- 月视图补齐大标题、节假日 / 调休标记、跨日条和更高密度事件 chip。
- 列表视图改为参考稿的大字号分组列表与右侧时间布局。

## 验证

- `node scripts/check-docs.mjs`：通过。
- `node scripts/check-arch.mjs`：通过。
- `node --check claude-design/mobile/swellcalendar-remix/project/data.js`：通过。
- 使用 TypeScript `transpileModule` 对 `mobile-app.jsx`、`mobile-views.jsx` 做 JSX 转译检查：通过。

## 最终方案

- 将移动端原型切换到最新参考稿的 iOS 日历红色视觉体系，补齐顶部图标操作区和底部 `今天 / 日历 / 收件箱` 导航。
- 将日 / 多日视图锚定到 2026 年 6 月 19 日所在周，补齐端午节、夏至、当前时间线和消费日历事件样例。
- 将月视图切换到 2026 年 5 月参考稿语境，补齐大标题、休 / 班标记、节气 chip 和高密度事件展示。
- 将列表视图改为参考稿的大字号分组列表，保留事件点击打开详情 sheet 的轻交互。

## 风险

- 该目录是 Claude Design 导出原型，不是生产包代码；验证以源文件和原型入口为主。
- 参考图为静态截图，细节如真实滚动位置和系统状态栏时间以视觉近似处理。
- 未启动浏览器截图对比；本次按导出包源码与参考图做静态实现同步。
