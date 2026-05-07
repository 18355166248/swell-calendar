# Pre-commit 测试门禁

## 背景

当前仓库已经有 `docs-first`、架构分层和 lint 的 pre-commit 门禁，但类型检查没有真正阻断提交，测试也没有进入提交流程。

这会导致两类问题：

- 改了 `packages/calendar` 的运行时代码后，只有手动执行测试才能发现回归
- hook 看起来在做类型检查，但实际使用了 `|| true`，不会阻断失败提交

## 目标

- 让提交前门禁真正阻断类型错误
- 让 `packages/calendar` 的现有测试在相关代码变更时自动验证
- 让 `pnpm check` 成为“手动全量门禁”和“提交门禁”的统一参考

## 非目标

- 不引入第二套 hook 体系
- 不把所有 package 的测试都接进 pre-commit
- 不做与本次提交门禁无关的 CI 重构

## 影响范围

- 代码：
  - `package.json`
  - `.githooks/pre-commit`
  - `packages/calendar/jest.config.js`
  - `packages/calendar/tsconfig.test.json`
- 文档：
  - `docs/WORKFLOW.md`
  - `AGENTS.md`
- 运行时行为：
  - 无运行时产品行为变化
  - 提交前检查更严格

## 现状

- `.githooks/pre-commit` 已接入 `check-docs`、`check-arch` 和 `pnpm lint`
- TypeScript 检查不会阻断提交
- `packages/calendar` 的测试未进入提交门禁
- Jest 对 `lodash-es` 的 ESM 处理不完整，新增测试无法稳定通过

## 方案

- 保留现有 `.githooks/pre-commit`，不额外引入 `husky`
- 将类型检查改为真正阻断失败提交
- 当 staged 变更涉及 `packages/calendar` 的源码或测试配置时，自动执行 `pnpm --filter swell-calendar exec jest --runInBand`
- 修复 `packages/calendar` 的 Jest 配置，使现有测试可稳定运行
- 将根 `pnpm check` 扩展为 docs / arch / lint / types / calendar tests 的统一全量门禁

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [x] 无规格变更，仅补任务记录

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] `pnpm lint`
- [ ] `pnpm --filter swell-calendar exec tsc --noEmit`
- [ ] `pnpm --filter swell-calendar exec jest --runInBand`

## 风险与回滚

- 风险：
  - pre-commit 执行时间会增加
  - Jest 配置变更可能暴露历史测试兼容性问题
- 回滚方式：
  - 回退 `.githooks/pre-commit` 中新增的类型 / 测试门禁
  - 回退 `package.json` 的 `check` 调整
  - 回退 `packages/calendar` 的测试配置调整

## 实施结果

实现完成后补充：

- 实际改动：
- 与原计划的偏差：
- 验证结果：
- 剩余问题：
