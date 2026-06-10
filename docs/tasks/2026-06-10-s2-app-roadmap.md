# swell-calendar-s2 · 路线图与进度（后续唯一进度真源）

> 本文件是 `apps/swell-calendar-s2` 的活进度表。每完成一个阶段，勾选并补「完成记录」。
> 单阶段的目标/范围/验证细节，写到对应 `docs/tasks/YYYY-MM-DD-*.md`，本文件只维护「阶段、状态、验收、落点」。

## 背景

把 Claude Design 的 swell-calendar 设计稿落成真实可用的日程调度界面。设计稿是一套自定义 CSS 变量
手写的 Spectrum 2 近似（非真实 S2 组件），handoff README 要求像素级还原。当前策略：
先忠实移植 CSS 出像素级成品，再逐步替换为真 S2 组件、挂活 `packages/calendar` 拖拽引擎、接真数据。

相关文档：

- 移植主任务：[2026-06-10-s2-shell-app.md](./2026-06-10-s2-shell-app.md)
- 库的 timeline 主题（Path B，暂缓）：[2026-06-10-timeline-theme.md](./2026-06-10-timeline-theme.md)
- 设计源（本地，未入库）：`swell-video-download-remix/project/`

## 进度总览

| 阶段 | 内容 | 状态 | 落点 |
| ---- | ---- | ---- | ---- |
| P0 | 文档门禁 + 任务文档 | ✅ 完成 2026-06-10 | `docs/tasks/` |
| P1 | 脚手架 + S2 macro 链路验证 | ✅ 完成 2026-06-10 | `apps/swell-calendar-s2` |
| P2 | 忠实移植设计稿（5 视图 + overlays） | ✅ 完成 2026-06-10 | `apps/swell-calendar-s2/src` |
| P3 | 真实 S2 组件替换外围控件 | ⬜ 未开始 | `src/shell.tsx`、`src/overlays.tsx` |
| P4 | 挂活 `packages/calendar` 拖拽引擎 + timeline 主题 | ⬜ 未开始 | `src/views.tsx` + `packages/calendar` |
| P5 | 控件真功能化（主题切换 / 搜索 / 筛选 / 新建落库） | ⬜ 未开始 | `apps/swell-calendar-s2/src` |
| P6 | 接真数据（替换 mock SWELL，事件 CRUD） | ⬜ 未开始 | `apps/swell-calendar-s2/src` |

图例：✅ 完成 · 🟡 进行中 · ⬜ 未开始 · ⏸ 暂缓

---

## P3 · 真实 S2 组件替换外围控件 ⬜

把不破坏像素观感的外围控件换成 `@react-spectrum/s2`（依赖与 macro 链路 P1 已就绪）。

- 范围：顶栏「新建/今天」按钮、搜索框、视图分段切换、通知/设置图标按钮；侧栏 CTA。
- 不动：中间网格/事件卡（无 S2 等价物，保留移植版）。
- 取舍：S2 组件有自己的精确度量，**可能偏离设计像素**——逐个控件评估，偏差大的保留 CSS 版。
- 验收：被替换控件用真 S2；`style()` macro 生效；视觉 diff 可接受；tsc/lint 通过。
- 风险：S2 Provider 的 `page.css` 全局背景与设计 `--bg-app` 冲突——若启用 Provider 需隔离背景层。

## P4 · 挂活引擎 + timeline 主题 ⬜

把 week/scheduler 的**静态**视图换成 `packages/calendar` 的真引擎（拖拽移动/resize/空白创建/车道堆叠），
并用设计 token 重新着色。**前置 = 完成 [timeline-theme](./2026-06-10-timeline-theme.md)**（给库加 timeline 主题切片，
因为 timeline.scss 现为硬编码 hex，宿主无法用主题面还原设计）。

- 步骤：① 先做 timeline-theme（改 `theme.type.ts` + `SPEC.md`，docs-first）；
  ② app 用 `workspace:*` 依赖 calendar 并构建；③ 用设计 token 经 ThemeStore 注入着色。
- 验收：week/scheduler 可拖拽，视觉贴设计；calendar 默认主题零行为回归；`pnpm check` 通过。
- 风险：calendar 主题注入策略「不注入全局 CSS 变量」，着色落点要与现有方式一致。

## P5 · 控件真功能化 ⬜

设计稿里固定为默认的开关做成真功能。

- 范围：明暗/强调色/密度切换（设计 CSS 已支持 `data-theme`/`data-accent` + density）；
  搜索过滤；分类 chips 筛选；新建对话框真正落库到本地状态。
- 验收：切换即时生效并持久化（localStorage）；筛选/搜索影响渲染；新建后出现在视图里。

## P6 · 接真数据 ⬜

- 范围：抽象数据源接口，替换 `src/data.ts` 的 mock SWELL；事件 CRUD 走真实后端/本地存储。
- 验收：增删改查闭环；空态/加载/错误态有处理。

---

## 完成记录

### 2026-06-10 · P0 + P1 + P2 完成

- 在既有 pnpm+turbo monorepo 新建 `apps/swell-calendar-s2`（Vite + react-ts），workspace 自动纳入。
- S2@1.4.0 + unplugin-parcel-macros@0.2.0 链路验证通过（后因移植策略改为不引 S2 runtime，依赖暂留）。
- 忠实移植设计稿：3 份 CSS + data/icons/shell/views/overlays/App，剔除编辑器 tweaks 面板，固定默认配置。
- 验证：tsc / check-docs / check-arch 通过；浏览器实测 scheduler/week/timeline + rich popover 像素级还原。
- 提交：`feat/s2-shell-app` 分支，commit `e86d8f5`。
