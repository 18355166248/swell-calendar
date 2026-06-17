# 2026-06-07 scheduler phase 3 closure

## 背景

当前 `scheduler` 对标 `Mobiscroll React Scheduler Desktop Week View` 的主线能力已经基本到位：

- 桌面端时间网格与资源列
- all-day lane 与多日事件分段
- create / move / resize / delete
- overlap / buffer / invalid / failed callbacks
- 资源显隐、分组 / 折叠、shared events、跨资源 gate
- recurrence 展开、exceptions、编辑作用域
- timezone 数据时区 -> 显示时区转换
- external DnD 与跨实例拖拽回调链

当前主要问题已经不是“底座没做出来”，而是：

- 一级真源与历史任务文档中仍有部分状态落后于实现
- Phase 3 尚有少量高级体验未收口
- 最近拖拽 / resize 经过多轮修复，需要把“下一步补什么”写清楚，避免重新发散到新 scope

## 目标

- 对齐 `docs/agent-plan/plan.md`、`packages/calendar/SPEC.md` 与任务文档中的进度描述
- 明确 Phase 3 收口阶段的近期范围与后置范围
- 为后续实现提供统一优先级，避免在文档层面对“已完成 / 部分完成 / 未进入范围”产生歧义

## 非目标

- 本任务不直接新增 `scheduler` 交互功能
- 本任务不引入 agenda、移动端、virtualization、printing、a11y 等远期能力
- 本任务不对外追求 Mobiscroll API 命名兼容

## 近期收口范围

1. 文档状态对齐

- 修正 recurrence 编辑作用域等“实现已完成但文档仍写未完成”的描述
- 将 `scheduler` 当前阶段从“底座可用”更新为“核心闭环可用，进入高级体验收口期”

2. 高级体验收口优先级

- external DnD 的实时预览阴影、落点反馈与失败态表达
- 跨实例拖拽的实时预览阴影与跨实例 resize 策略
- timezone 的多时区列同时展示、全天事件跨时区边界

3. 回归保障

- 保持 drag / resize 回归测试、hook 状态机测试和 story 场景持续覆盖
- 后续收口实现仍需保证 `Day` / `Week` / `Timeline` 不退化

## 明确后置范围

- `agenda`
- 移动端适配
- `connections`
- `eventList`
- virtualization
- printing
- a11y 强化

## 影响范围

- 文档：
  - `packages/calendar/SPEC.md`
  - `docs/agent-plan/plan.md`
  - `docs/tasks/2026-05-07-scheduler-mobiscroll-parity-roadmap.md`
- 后续实现：
  - `packages/calendar/src/controller/`
  - `packages/calendar/src/hooks/`
  - `packages/calendar/src/components/view/scheduler/`
  - `packages/calendar/src/stories/Calendar/`

## 验证方式

- `node scripts/check-docs.mjs`
- `node scripts/check-arch.mjs`
- `pnpm --filter swell-calendar exec tsc --noEmit`
- `pnpm --filter swell-calendar test`

## 风险

- 若只修文档不及时收口高级体验，团队会误以为 scheduler 已经完全对齐 Mobiscroll
- 若不先统一优先级，后续容易被 agenda / mobile 等远期需求打断主线
- 若 drag / resize 回归保护不足，Phase 3 收口实现可能再次引入交互回退

## 当前结论

- `scheduler` 已完成桌面端核心业务闭环
- 下一阶段不再扩新主能力，优先补高级体验与交互细节
- Phase 3 收口的第一优先级是 external / cross-instance DnD 体验，其次是 timezone 完整化

## 本次实现

- `external DnD` 已补上目标格预览阴影，拖入 `scheduler` 网格时可看到合法 / 非法 / 策略限制反馈
- `跨实例拖拽` 已补上目标实例实时预览阴影，拖动过程中即可看到目标落点，结束后会自动清理预览
- 预览层未修改既有 drop 回调协议，仍保持当前单格时间落点语义

## 本次验证结果

- 新增测试：
  - `packages/calendar/src/hooks/TimeGrid/useExternalDrop.spec.tsx`
  - `packages/calendar/src/hooks/TimeGrid/useCrossInstanceDnD.spec.tsx`
- 行为覆盖：
  - external dragOver 产生预览，drop 后清空
  - cross-instance dragging 产生目标实例预览，reset 后清空
