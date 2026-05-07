# Vitest 测试基建与提交门禁

## 背景

当前 `packages/calendar` 只有 1 个测试文件：

- `src/time/dayjs-tzdate.spec.ts`

对于一个以日/周/scheduler/timeline 视图、拖拽交互和时间计算为核心的组件库来说，这个覆盖远远不够。另一方面，当前测试框架仍是 Jest，而项目本身基于 Vite 与 Storybook，继续维护 Jest 的 ESM / alias / transform 兼容成本偏高。

## 目标

- 将 `packages/calendar` 的单元测试基建切换到 `Vitest`
- 保持与 Vite alias 一致，降低测试配置维护成本
- 为近期 scheduler 改动补最小 controller 级测试
- 让提交前门禁在相关代码变更时自动运行测试

## 非目标

- 不在本次补完整的组件渲染测试体系
- 不一次性补齐所有历史模块测试
- 不引入第二套 hook 机制，继续使用 `.githooks/pre-commit`

## 影响范围

- 代码：
  - `packages/calendar/package.json`
  - `packages/calendar/vite.config.ts`
  - `packages/calendar/src/**/*.spec.ts`
  - `.githooks/pre-commit`
- 文档：
  - `docs/WORKFLOW.md`
  - `AGENTS.md`
- 运行时行为：
  - 无产品运行时变化
  - 提交门禁和本地测试命令变化

## 现状

- `packages/calendar` 使用 Jest
- 仅 1 个测试文件
- 近期新增的 scheduler controller 测试因为 Jest + ESM 兼容问题无法稳定落地
- pre-commit 已能按范围跑测试，但当前仍绑定 Jest

## 方案

- 在 `packages/calendar` 引入 `vitest`
- 在 `vite.config.ts` 中加入 `test` 配置，复用现有 alias
- 将现有 `dayjs-tzdate.spec.ts` 迁移到 Vitest
- 补充 scheduler 相关最小测试：
  - `scheduler-layout`
  - `scheduler.controller` 的 `invalid` / blocked 布局与校验
- 将 `packages/calendar` 的 `test` 脚本切到 `vitest run`
- 将 pre-commit 中的测试命令从 Jest 切到 Vitest

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 无规格变更，仅补任务记录

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `pnpm --filter swell-calendar exec tsc --noEmit`
- [ ] `pnpm --filter swell-calendar test`
- [ ] 触发一次 pre-commit 测试链路验证

## 风险与回滚

- 风险：
  - 迁移过程中，旧 Jest 测试语法与 Vitest API 需要调整
  - 测试门禁时间可能略有增加
- 回滚方式：
  - 回退 `packages/calendar` 的测试脚本与 `vite.config.ts`
  - 回退 `.githooks/pre-commit` 中的测试命令
  - 删除新增测试文件

## 实施结果

实现完成后补充：

- 实际改动：
- 与原计划的偏差：
- 验证结果：
- 剩余问题：
