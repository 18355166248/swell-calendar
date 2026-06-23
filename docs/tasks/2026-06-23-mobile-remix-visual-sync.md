# Mobile Remix Visual Sync

## 背景

`claude-design/mobile/swellcalendar-remix/project/swell-calendar-mobile.html` 是 Claude Design 导出的移动端日历原型入口。本次只针对 `apps/swell-calendar-s2` 移动端与该 HTML 源文件的两处差异做小范围优化。

## 目标

- 以 `claude-design/mobile/swellcalendar-remix/project/swell-calendar-mobile.html` 和本地预览 `http://127.0.0.1:8080/swell-calendar-mobile.html` 为视觉来源。
- 修正移动端顶部区域与周条的浅灰背景，以及日历内容区白底。
- 修正移动端时间列表滚动边界：顶部日期 / 全天区域不参与滚动，只有下方时间列表滚动。
- 移动端日 / 多日时间轴展示完整 24 小时。
- 修正移动端列表视图：固定日期行跟随顶部区域，列表内后续日期不再吸顶。
- 移动端周条支持左右滑动切换上一周 / 下一周，并在滑动时露出前后周日期。
- 移动端月视图改为 S2 宿主侧连续月份流，支持向前 2 年、向后 1 年纵向浏览。
- 移动端月视图非本月日期仅保留空白占位，避免相邻月份重复日期露出。
- 移动端月视图顶部返回区域显示当前可见年份，如 `2026年`。
- 移动端月视图选中态高亮同时包住日期数字和农历。
- 移动端连续月视图每个月内容区顶部显示月份分隔标题。
- 移动端列表视图上下滚动范围与月视图一致，支持当前月前 24 个月至后 12 个月。
- 移动端列表视图使用虚拟渲染，避免长日期窗口一次性渲染千级日期节点造成滚动卡顿。

## 非目标

- 不调整日期、mock 数据、事件内容或周起始。
- 不做无关的 `packages/calendar` 能力扩展或生产组件架构调整。
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
- 移动端周条固定星期行，只让日期 / 农历三周轨道滑动；统一用 pointer 手势识别点击与滑动：轻点按坐标选择当前周日期；水平拖动用 `transform` 1:1 跟手露出相邻周，超过阈值后先滑到相邻周，再复用 `onDateChange` 切换整周并无动画复位。
- 移动端 `month` 分支不再渲染通用 Calendar Month，改用 `MobileMonthScroller` 生成连续月份 section；顶部栏、月标题和星期行同属 topzone 且不参与滚动，滚动时只回填可见月份标题，不改选中日期。
- 连续月份网格中非本月 cell 保留占位高度，但隐藏日期、农历和事件内容，并禁用点击。
- 移动端月份标签和年份入口标签分离：月视图大标题始终显示 `M月`，顶部返回区域显示 `YYYY年`。
- 月视图日期 cell 增加 badge 包裹数字和农历，选中 / 今日状态在 badge 上绘制背景。
- 每个连续月份 section 在日期网格上方展示居中月份分隔，如 `12月`。
- 为 agenda 增加 `offset` 配置，S2 移动列表用 `offset + range` 覆盖与连续月视图一致的日期窗口，并初次进入时滚到当前日期。
- 为 agenda 增加可见日期变化回调，S2 移动列表滚动时仅同步顶部月份 label，不改选中日期。
- 在 `packages/calendar` 抽出通用 `useVirtualList`：用估算高度生成上下占位，只渲染视口附近 section，并用真实高度回填修正偏移；不引入新的运行时依赖。
- 移动端 agenda 与 S2 连续月视图共同复用 `useVirtualList`，避免各自复制滚动范围、占位和实测修正逻辑。
- Agenda 分组计算改用 `idsOfDay` 日期索引按天取事件，避免列表入口执行「完整日期范围 × 全量事件」扫描。
- S2 移动月视图在浏览器空闲时隐藏预热 Calendar agenda 引擎；切到列表时复用已初始化实例，避免切换瞬间重建 store / EventModel。

## 验证

- `node scripts/check-docs.mjs`：通过。
- `node scripts/check-arch.mjs`：通过。
- `pnpm --filter swell-calendar-s2 exec tsc --noEmit`：通过。
- `pnpm --filter swell-calendar-s2 build`：通过；仅保留既有 `mockjs` eval 与 chunk size 警告。
- `pnpm --filter swell-calendar-s2 test -- src/appCalendarConfig.spec.ts`：通过；沙箱下有 Vite WebSocket `EPERM` 噪声但退出码为 0。
- 浏览器移动 viewport 验证：顶部 / 周条背景为 `oklch(0.955 0.003 270)`，app / canvas / 日期标题 / 全天行为白底；canvas 为 `overflow:hidden`，时间面板为 `overflow-y:auto`。
- 浏览器移动 viewport 验证：时间轴从 `00:00` 开始，grid 高度约 `1248px`。
- 浏览器移动 viewport 验证：`/app/calendar/agenda` 进入列表视图；固定日期行在 `.swell-calendar-agenda-scroll` 外，背景为 `oklch(0.955 0.003 270)`；滚动区内日期行 `position: static`。
- 移动端周条滑动切周通过类型检查覆盖；右侧评论层会拦截真实拖拽事件，最终以代码路径和构建验证为准。

## 最终方案

- 仅在 `apps/swell-calendar-s2/src/styles/app.css` 调整移动端样式变量和滚动边界。
- 顶部导航与周条使用设计稿浅灰 top zone；日历主体维持白底。
- 移动端外层 canvas 不再作为滚动容器，顶部日期 / 全天区域保留在时间列表上方；下方 `.swell-calendar-time` 单独滚动。
- 移动端日 / 多日视图时间轴展示 `00:00-24:00`；桌面时间范围不变。
- 移动端列表视图使用设计稿同款固定日期行，后续日期行跟随列表内容自然滚动。
- 移动端周条支持左滑下一周、右滑上一周；星期行固定不滑动，日期 / 农历三周轨道横向偏移以露出前后周，松手后平滑滑入相邻周或回弹，并抑制滑动后的误点击。
- 移动端月视图使用 S2 专用连续滚动组件，月份范围为当前月前 24 个月至后 12 个月；顶部大月标题 / 星期行固定不滚，事件 chip 随日期格自然滚动。
- 相邻月份衔接处的非本月日期不再显示重复内容，只保留空白格占位。
- 月视图顶部返回区域显示年份；月视图大标题不显示年份。
- 月视图选中高亮由单独数字圆点调整为数字 + 农历整体高亮。
- 连续月流中每个月月初前显示月份分隔标题，辅助识别月份衔接。
- 月视图滚动到其他月份不会自动选中该月 1 号；只有点击日期才更新选中态。
- 移动端列表初始定位当前日期，但可向上滚动到前 2 年、向下滚动到后 1 年。
- 移动端列表长窗口仅渲染可见区域附近的日期 section，滚动性能不再随完整日期范围线性增长。
- 移动端列表切入时的分组计算按日期索引取数，性能不再随 `天数 × 事件数` 线性增长。
- 月视图切到列表时复用空闲预热的 agenda 引擎实例；隐藏预热阶段不做精确初始滚动，避免 1px 隐藏容器导致定位偏差。
- S2 连续月视图也接入同一套虚拟列表能力，只渲染视口附近月份 section。
- 未调整日期、mock 数据、周起始或事件内容；`packages/calendar` 新增 agenda `offset` 配置、列表可见日期回调与通用 `useVirtualList`。

## 风险

- 本次只做样式边界修正，不处理更大范围的像素级还原差异。
