# Scheduler 固定列宽 + 水平滚动

## 背景

Scheduler 视图默认使用百分比列宽，所有列挤在视口内。当资源数 × 天数较多时，列宽过窄导致内容不可读。需要支持固定列宽模式，超出视口时通过水平滚动查看。

参考：https://demo.mobiscroll.com/react/scheduler/customize-scheduler-column-width

## 目标

- SchedulerOptions 新增 `columnWidth?: number` 配置项
- 设置后每列宽度固定为指定像素值，总宽度超出视口时显示水平滚动条
- Header、全天事件区、时间网格在同一水平滚动容器中同步滚动
- 左侧时间 gutter 保持可见（sticky）
- 不影响默认模式（无 columnWidth 时行为不变）

## 非目标

- 不做列宽拖拽调整
- 不做虚拟滚动（当前 10 资源 × 7 天 = 70 列，性能可接受）

## 影响范围

- 代码：packages/calendar/src/components/view/Scheduler.tsx、SchedulerHeader.tsx、SchedulerAllDayLane.tsx、TimeGridView.tsx、TimeColumn.tsx、helpers/grid.ts、types/options.type.ts
- 文档：packages/calendar/SPEC.md（scheduler 配置项）
- 运行时行为：设置 columnWidth 后 scheduler 视图布局模式变化

## 方案

### 引擎层（packages/calendar）

1. **SchedulerOptions** 新增 `columnWidth?: number`
2. **createSchedulerColumnsData** 支持像素宽度：传入 columnWidth 时 `width` 为像素值，否则百分比
3. **SchedulerHeader / SchedulerAllDayLane** 新增 `columnWidth` prop，按像素渲染
4. **TimeGridView** 新增 `columnWidth` prop，scrollArea 和 time-columns 使用像素宽度
5. **TimeColumn** 新增 `style` prop 用于外部覆盖（sticky 定位等）
6. **Scheduler.tsx** 双路径渲染：
   - `columnWidth` 模式：绕过 Panel 系统，header/allday/time 用纯 div 包在单一 `overflow-x: auto` 容器中
   - 默认模式：保持 Panel 系统不变
   - gutter 列：header 留白 + 全天留白 + TimeColumn（height: 200%, minHeight: 900px），通过原生 addEventListener 同步 scrollTop

### 宿主层（apps/swell-calendar-s2）

- App.tsx scheduler 配置添加 `columnWidth: 120`

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md` — 无架构变更
- [ ] 新增或更新 ADR — 无需
- [ ] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [x] `pnpm --filter swell-calendar exec tsc --noEmit`
- [x] `pnpm --filter swell-calendar-s2 exec tsc --noEmit`
- [ ] `pnpm test` — 待确认

## 风险与回滚

- 风险：SCSS 变更（.scheduler-scroll min-width:0）需要重新构建 package CSS 才能生效，HMR 不会自动拾取
- 回滚方式：git revert 即可，不影响其他视图

## 实施结果

- 实际改动：12 个文件
- 与原计划的偏差：无
- 验证结果：TypeScript 编译通过、架构检查通过、浏览器 DOM 检查确认水平滚动正常（scrollWidth 8544 vs clientWidth 1616）
- 剩余问题：垂直滚动同步需要在实际用户交互中进一步验证（程序化 scrollTop 设置的 scroll 事件时序可能与 React 事件有差异，已改用原生 addEventListener 确保可靠性）
