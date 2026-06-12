# Docs Archive

> 本目录存放已完成、且其关键结论已经沉淀进一级真源文档的历史工件。

## 归档规则

- `archive/tasks/`
  - 已完成的历史任务单
  - 其核心结论已经进入 `SPEC`、`WORKFLOW`、`ARCHITECTURE`、`MIGRATION` 或 `agent-plan/plan.md`
  - 保留原因主要是追溯上下文，而不是继续承担当前事实源职责

## 使用方式

- 需要当前规则时，不先读这里
- 需要追查某次治理、测试基建或历史方案的上下文时，再进入归档

---

## 按主题归类索引

> 所有文件物理位置均在 `tasks/` 下，以 `YYYY-MM-DD-` 前缀自然排序。
> 以下分组仅为方便检索，不涉及目录层级变动。

### A · 工程治理 / 测试基建（6 篇）

| 文件 | 摘要 |
|------|------|
| [2026-05-06-docs-first-governance.md](tasks/2026-05-06-docs-first-governance.md) | 确立 docs-first 治理规则 |
| [2026-05-07-pre-commit-test-gates.md](tasks/2026-05-07-pre-commit-test-gates.md) | Pre-commit / Pre-push 测试门禁 |
| [2026-05-07-vitest-test-foundation.md](tasks/2026-05-07-vitest-test-foundation.md) | Vitest 测试基建与提交门禁 |
| [2026-06-04-docs-information-architecture-cleanup.md](tasks/2026-06-04-docs-information-architecture-cleanup.md) | 文档信息架构清理 |
| [2026-06-04-feature-capability-audit.md](tasks/2026-06-04-feature-capability-audit.md) | Feature capability 审计 |
| [2026-06-04-scheduler-scope-freeze.md](tasks/2026-06-04-scheduler-scope-freeze.md) | Scheduler scope freeze |

### B · Scheduler 对齐 epic — PLAN4（17 篇）

| 文件 | 摘要 |
|------|------|
| [2026-05-06-scheduler-v2-foundation.md](tasks/2026-05-06-scheduler-v2-foundation.md) | Scheduler v2 基础架构 |
| [2026-05-07-scheduler-mobiscroll-parity-roadmap.md](tasks/2026-05-07-scheduler-mobiscroll-parity-roadmap.md) | Mobiscroll parity 路线图 |
| [2026-06-04-month-boundary-and-workweek-closure.md](tasks/2026-06-04-month-boundary-and-workweek-closure.md) | 月边界 & 工作周收口 |
| [2026-06-04-shared-event-policy-closure.md](tasks/2026-06-04-shared-event-policy-closure.md) | 共享事件策略收口 |
| [2026-06-05-recurring-exceptions-rendering.md](tasks/2026-06-05-recurring-exceptions-rendering.md) | Recurring exceptions 接入渲染链 |
| [2026-06-05-scheduler-timezone.md](tasks/2026-06-05-scheduler-timezone.md) | Scheduler timezone 接入渲染链 |
| [2026-06-06-cross-instance-dnd.md](tasks/2026-06-06-cross-instance-dnd.md) | 跨实例拖动 |
| [2026-06-06-drag-ghost-full-column-width.md](tasks/2026-06-06-drag-ghost-full-column-width.md) | 拖拽跟手影子对齐整列满宽 |
| [2026-06-06-external-dnd.md](tasks/2026-06-06-external-dnd.md) | External DnD 接入 |
| [2026-06-06-fix-resize-ghost-and-drop-flicker.md](tasks/2026-06-06-fix-resize-ghost-and-drop-flicker.md) | 修复 resize ghost + 拖拽落点回跳闪烁 |
| [2026-06-06-recurrence-edit-scope.md](tasks/2026-06-06-recurrence-edit-scope.md) | 编辑作用域（Recurrence Edit Scope） |
| [2026-06-06-resize-bidirectional-snap-autoscroll.md](tasks/2026-06-06-resize-bidirectional-snap-autoscroll.md) | 双向 resize + 吸附 + 边缘自动滚动 |
| [2026-06-07-drag-resize-test-hardening.md](tasks/2026-06-07-drag-resize-test-hardening.md) | 拖拽 / resize 自动化测试补强 |
| [2026-06-07-scheduler-mobiscroll-parity-polish.md](tasks/2026-06-07-scheduler-mobiscroll-parity-polish.md) | Mobiscroll parity polish |
| [2026-06-07-scheduler-phase3-closure.md](tasks/2026-06-07-scheduler-phase3-closure.md) | Scheduler Phase 3 收口 |
| [2026-06-07-timeline-calendar-rebuild.md](tasks/2026-06-07-timeline-calendar-rebuild.md) | Timeline 重建为日粒度 Calendar Timeline |
| [2026-06-08-drag-esc-cancel.md](tasks/2026-06-08-drag-esc-cancel.md) | 拖拽 ESC 取消 |

### C · Storybook 工具链（4 篇）

| 文件 | 摘要 |
|------|------|
| [2026-06-03-storybook-interaction-tests.md](tasks/2026-06-03-storybook-interaction-tests.md) | Storybook 交互测试与 test-runner 支持 |
| [2026-06-07-storybook-sidebar-cleanup.md](tasks/2026-06-07-storybook-sidebar-cleanup.md) | Storybook 侧边栏整理与中文化 |
| [2026-06-07-storybook-workbench-polish.md](tasks/2026-06-07-storybook-workbench-polish.md) | Storybook workbench polish |
| [2026-06-09-storybook-demo-prune.md](tasks/2026-06-09-storybook-demo-prune.md) | Storybook demo 精简（只保留可拖拽交互） |

### D · S2 外壳应用 epic（8 篇）

| 文件 | 摘要 |
|------|------|
| [2026-06-10-s2-app-roadmap.md](tasks/2026-06-10-s2-app-roadmap.md) | S2 路线图与进度（唯一进度真源） |
| [2026-06-10-s2-shell-app.md](tasks/2026-06-10-s2-shell-app.md) | Spectrum 2 外壳应用（apps/swell-calendar-s2） |
| [2026-06-10-timeline-theme.md](tasks/2026-06-10-timeline-theme.md) | Timeline 主题能力扩展 |
| [2026-06-11-s2-p5-create-event.md](tasks/2026-06-11-s2-p5-create-event.md) | P5 控件真功能化 — 新建落库 |
| [2026-06-11-s2-p5-search-filter.md](tasks/2026-06-11-s2-p5-search-filter.md) | P5 切片 — 搜索过滤 + 分类 chips 筛选 |
| [2026-06-12-s2-p5-event-edit-delete.md](tasks/2026-06-12-s2-p5-event-edit-delete.md) | P5 切片 — 事件编辑 / 删除（override 层） |
| [2026-06-12-s2-p5-theme-switching.md](tasks/2026-06-12-s2-p5-theme-switching.md) | P5 切片 — 明暗 / 强调色 / 密度切换 |
| [2026-06-12-s2-p6-data-source.md](tasks/2026-06-12-s2-p6-data-source.md) | P6 接真数据（数据源抽象 + 异步 CRUD + 状态态） |
