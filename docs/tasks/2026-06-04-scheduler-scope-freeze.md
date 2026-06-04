# 2026-06-04 scheduler scope freeze

## 背景

当前 `swell-calendar` 已经积累了较多 `scheduler` 能力，但仓库内对“哪些能力已正式支持、哪些仅为字段暴露、哪些仍属后置范围”的表述开始出现偏差：

- `SPEC`、`AGENTS`、路线图和迁移文档存在不一致
- phase 状态与实现状态没有同步更新
- 部分能力已进入实现和 stories，但未完整进入公开规格

继续扩展功能会放大这类偏差，导致对标 `Mobiscroll React Scheduler Desktop Week View` 时范围越来越难控。

## 目标

- 收紧 `scheduler` 当前基线的公开描述
- 对齐 `SPEC`、路线图、迁移文档和组件库导航文档
- 明确哪些能力已支持、哪些只是字段暴露、哪些继续后置
- 为后续继续开发提供更可靠的文档边界

## 非目标

- 不新增 scheduler 运行时功能
- 不修改 controller / hooks / components 实现
- 不在本轮推进 recurrence、timezone、external DnD 等高级能力

## 影响范围

- 代码：无
- 文档：
  - `packages/calendar/SPEC.md`
  - `packages/calendar/AGENTS.md`
  - `docs/MIGRATION.md`
  - `docs/tasks/2026-05-07-scheduler-mobiscroll-parity-roadmap.md`
- 运行时行为：无

## 现状

- `scheduler` 已具备多资源列、all-day lane、多日分段、overlap policy、删除、失败回调、资源分组/显隐/共享事件等基线能力
- `recurrence`、`timezone` 等高级字段已暴露，但行为尚未接入
- 模板插槽数量、资源配置字段、phase 状态在多份文档中的描述不一致

## 方案

1. 以当前代码为准回填 `SPEC`，补齐 scheduler/timeline 当前公开能力与后置能力。
2. 修正 `Template`、`ResourceInfo`、`SchedulerOptions` 等接口描述与真实类型的不一致。
3. 更新路线图状态，明确当前属于“Phase 1A/1B/2 基线已进入实现，Phase 3 未完成”的状态。
4. 更新迁移文档，避免把已经进入实现期的资源能力继续写成“尚未进入当前阶段”。
5. 更新 `packages/calendar/AGENTS.md`，让维护者通过导航文档就能读到准确的能力面。

## 文档变更

- [x] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [ ] 无规格变更，仅补任务记录

## 验证计划

- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/check-arch.mjs`
- [ ] `pnpm lint`
- [ ] `pnpm -r exec tsc --noEmit`
- [x] `pnpm --filter swell-calendar test`

## 风险与回滚

- 风险：若只修部分文档，反而会制造新的单点事实源
- 回滚方式：本轮仅修改文档，可按文件回退

## 实施结果

- 实际改动：
  - 收紧 `SPEC` 中 scheduler 当前基线描述，补齐资源显隐、分组、shared events、failed callbacks、delete、跨资源拖动 gate 等已实现能力
  - 修正 `Template`、`EventObject`、`ResourceInfo`、`SchedulerOptions` 的公开规格与真实类型不一致问题
  - 更新路线图状态，避免继续把当前实现描述成“仅代码开始”
  - 更新 `MIGRATION` 与 `packages/calendar/AGENTS.md`，同步资源能力与模板插槽数量
- 与原计划的偏差：
  - 未修改 `docs/ARCHITECTURE.md`，因为本轮没有新增结构约束，只做能力边界与状态收敛
- 验证结果：
  - `node scripts/check-docs.mjs` 通过
  - `node scripts/check-arch.mjs` 通过
  - `pnpm --filter swell-calendar test` 此前已通过，当前未再次触发
- 剩余问题：
  - `recurrence` / `timezone` 仍处于“字段已暴露、行为未接入”的状态
  - `docs/agent-plan/*` 各 phase 子文档尚未逐篇同步“已进入实现 / 未完成”的状态
