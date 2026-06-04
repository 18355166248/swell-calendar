# 步骤 01：文档与命名归一化

> 参考样例：Mobiscroll React Scheduler Desktop Week View
> https://demo.mobiscroll.com/react/scheduler/desktop-week-view
> 本文档是执行附件。当前 phase 状态与公开能力口径一律以 [plan.md](./plan.md) 和 `SPEC.md` 为准。

本阶段对应 [plan.md](./plan.md) 的 `Phase 0` 和 `Phase 1A.1`。目标是先把文档、命名和共享判定入口收敛好，不碰 scheduler 布局。

## 当前状态

- 总状态：`[x] 已完成`
- 说明：本文档对应的命名收敛与兼容窗口已经落地，后续只在 `SPEC` / `MIGRATION` 中做事实同步，不再回到本 phase 扩功能

## 步骤清单

- [x] Step 1：补齐文档工件
- [x] Step 2：引入 `invalid` 类型，不改旧行为
- [x] Step 3：接入 `invalid` 运行时兼容
- [x] Step 4：统一 `allDay` / `isAllday` 归一化入口
- [x] Step 5：写清兼容期文档与迁移说明

## 目标

- 补齐实施所需 docs 工件。
- 引入 `invalid`，同时兼容 `blockedTimes`。
- 统一 `allDay ?? isAllday` 的唯一判定入口。
- 保证 `Day` / `Week` / `Timeline` 现有行为不退化。

## Step 1：补齐文档工件

内容：

- 完成 `docs/tasks/2026-05-07-scheduler-mobiscroll-parity-roadmap.md`
- 完成 `docs/MIGRATION.md`
- 在 `docs/README.md` 增加 scheduler 路线图入口
- 在 `packages/calendar/SPEC.md`、`docs/ARCHITECTURE.md`、ADR 中写入主参考样例

最小验证：

- `node scripts/check-docs.mjs`

通过标准：

- 只看 docs 就能知道主参考地址、phase 边界和迁移窗口

## Step 2：引入 `invalid` 类型，不改旧行为

内容：

- 在 `WeekOptions`、`SchedulerOptions`、`TimelineOptions` 中新增 `invalid`
- 保留 `blockedTimes`
- 暂不改 UI 和 controller 行为

最小验证：

- `pnpm -r exec tsc --noEmit`

通过标准：

- 新旧字段类型都可通过
- 现有 stories 不变

## Step 3：接入 `invalid` 运行时兼容

内容：

- 统一读取入口：优先 `invalid`，否则 `blockedTimes`
- 仅改共享读取逻辑，不做分散条件分支
- 同步覆盖 scheduler / timeline / week / day 的 blocked range 读取

推荐落点：

- `controller/scheduler.controller.ts`
- options 初始化与 normalize 逻辑

最小验证：

- 旧 `blockedTimes` scheduler story 仍可工作
- 新增最小 `invalid` case 后也能工作

通过标准：

- 新旧字段同时受支持
- `Timeline` 的 blocked 遮罩不退化

## Step 4：统一 `allDay` / `isAllday` 归一化入口

内容：

- 固定唯一判定入口在 `controller/event.controller.ts`
- 统一使用 `allDay ?? isAllday`
- `EventModel` 只保存归一化结果，不再承担第二套全天判定逻辑
- 所有视图都通过共享入口消费全天判定

不要做：

- 不在 `Day` / `Week` / `Scheduler` / `Timeline` 各自再写一套判定

最小验证：

- `Day` / `Week` 的全天事件显示不变
- `pnpm -r exec tsc --noEmit`

通过标准：

- 旧 `isAllday` 数据仍能渲染
- 新 `allDay` 数据也能渲染

## Step 5：写清兼容期文档与迁移说明

内容：

- 在 `MIGRATION.md` 中写出：
  - `blockedTimes -> invalid`
  - `isAllday -> allDay`
- 给出 search-replace 模板和兼容期写法
- 这一步可以只改文档；`@deprecated` 注释可作为紧接着的小步实现

最小验证：

- `node scripts/check-docs.mjs`

通过标准：

- 宿主侧可以直接照文档迁移，不依赖聊天上下文

## 阶段回归清单

每完成一步都回归：

- `Day`
- `Week`
- `Timeline`
- 现有 `Scheduler`

## 退出条件

- `invalid` 和 `allDay` 已成为文档主名
- `blockedTimes` 和 `isAllday` 仍兼容
- 全天事件判定入口只剩一处
- 布局和交互行为尚未变化
