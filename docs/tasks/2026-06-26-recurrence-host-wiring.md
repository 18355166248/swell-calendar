# 重复事件宿主侧接线

**日期**：2026-06-26  
**分支**：`mobile-m5-interaction-polish`

## 目标

把 `CreateDialog` 中现有的「重复」UI（不重复 / 每天 / 每周 / 双周 pill）接线到引擎重复展开能力，
使用户创建的日程能真正按周期在日历上展开。同时在拖拽/删除时提供「此次 / 此后 / 全部」范围选择弹框。

## 范围

| 层                | 改动                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data.ts`         | `CalEvent` 增加 `recurrence?: RecurrenceRule`、`recurringExceptions?: RecurringException[]`                                                        |
| `overlays.tsx`    | `NewEventInput` 增加 `recurrence?: string`；`CreateDialog.submit` 传 `recurrence`；新增 `RecurrenceScopeDialog` 组件                               |
| `calendarData.ts` | `inputToDraft` 转换 recurrence；`calEventToInput` 反向映射；`toCalendarEvents` 透传 recurrence 字段；`engineEventToDraft` 透传 recurringExceptions |
| `App.tsx`         | 拖拽/删除检测到重复实例时弹 scope 弹框；`applyScopeAndSave()` 调用 `applyRecurrenceEditScope`                                                      |

## 不在本次范围

- 月视图展开 badge 数量调整
- `CreateDialog` 编辑时 scope 选择（编辑父事件默认 = all）

## 验证

- [x] 创建「每周」事件后周视图出现多个实例
- [x] 拖拽单次实例 → scope 弹框 → 选「此次」后只有本次移动
- [x] 删除重复事件 → scope 弹框 → 选「全部」整条删除

## 补充：引擎侧日/周视图展开

`week.controller.ts` `findByDateRange` 增加重复事件展开：重复父事件不受视口日期过滤，
调用 `expandSchedulerRecurrenceEvent` 在当前周/日视口内展开实例，再与普通事件合并。

## 状态

实现完成（2026-06-26）
