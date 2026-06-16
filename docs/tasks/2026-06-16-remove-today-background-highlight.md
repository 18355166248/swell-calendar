## 背景

`apps/swell-calendar-s2` 当前把主日历的“今天”列配置成整列浅色背景，实际使用中会抢视觉焦点，影响阅读事件内容。

## 目标

- 去掉主日历中“今天”整块背景高亮
- 保留日期标题本身的高亮能力，不改事件颜色与其他交互

## 非目标

- 不调整公共组件库的 API / 类型
- 不改 MiniCalendar、自定义弹层或事件卡片样式

## 影响范围

- 代码：`apps/swell-calendar-s2/src/App.tsx`、`apps/swell-calendar-s2/src/styles/app.css`
- 文档：新增本任务单
- 运行时行为：day / week / timeline 的 today 列不再整块染色；month 的 today 单元格不再整格染底

## 现状

- S2 app 通过 `theme` 把 week / timeline 的 `todayBackgroundColor` 覆写为 `var(--accent-tint)`。
- month 视图仍沿用组件库默认 `.month-cell-today` 底色。

## 方案

- app 侧把 today 背景主题改为透明，避免继续整列染色。
- 渲染层对“透明 today 背景”做兼容：当 today 背景被显式关闭时，继续回退到周末或默认底色，避免今天恰好落在周末时把周末浅染也一起吞掉。
- 在 app 样式里覆盖 month today 单元格背景，只保留日期标题高亮。

## 文档变更

- [x] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [ ] `pnpm lint`
- [x] `pnpm --filter swell-calendar exec tsc --noEmit`
- [x] `pnpm --filter swell-calendar-s2 exec tsc --noEmit`

## 风险与回滚

- 风险：today 落在周末时，如果背景回退逻辑不完整，可能误丢周末浅染。
- 回滚方式：恢复 `App.tsx` 的 today 背景主题与 month 覆盖样式。

## 实施结果

实现完成后补充：

- 实际改动：S2 app 去掉 today 整块背景高亮，并补齐 today=透明时的背景回退逻辑。
- 与原计划的偏差：无。
- 验证结果：见文末命令执行结果。
- 剩余问题：未跑全量 `pnpm lint` / `pnpm test`。
