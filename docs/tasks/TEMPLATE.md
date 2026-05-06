# Task Template

> 文件名建议：`YYYY-MM-DD-short-topic.md`

## 背景

说明这次改动为什么发生，当前痛点是什么。

## 目标

- 

## 非目标

- 

## 影响范围

- 代码：
- 文档：
- 运行时行为：

## 现状

描述当前实现和限制。

## 方案

说明计划怎么改，为什么这样改。

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`
- [ ] 更新 `docs/ARCHITECTURE.md`
- [ ] 新增或更新 ADR
- [ ] 无规格变更，仅补任务记录

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] `pnpm lint`
- [ ] `pnpm -r exec tsc --noEmit`
- [ ] `pnpm test`

## 风险与回滚

- 风险：
- 回滚方式：

## 实施结果

实现完成后补充：

- 实际改动：
- 与原计划的偏差：
- 验证结果：
- 剩余问题：
