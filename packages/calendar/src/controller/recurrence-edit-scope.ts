import { isSameDate } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import {
  CalendarRecurrenceEditScope,
  CalendarRecurrenceInstanceInfo,
} from '@/types/callbacks.type';
import { EventObject, RecurringException } from '@/types/events.type';

/**
 * 判断一个事件是否为 recurrence 展开的实例
 *
 * 通过检查 `recurrenceParentId` 字段判断。该字段仅在
 * `expandSchedulerRecurrenceEvent` 展开时设置。
 */
export function isRecurrenceInstance(event: EventObject): boolean {
  return event.recurrenceParentId != null && event.recurrenceParentId !== '';
}

/**
 * 获取展开实例的父事件 ID
 */
export function getRecurrenceParentId(event: EventObject): string | undefined {
  return event.recurrenceParentId || undefined;
}

/**
 * 获取展开实例的原始发生日期
 */
export function getRecurrenceOccurrenceDate(event: EventObject): DayjsTZDate | undefined {
  return event.recurrenceOccurrenceDate
    ? new DayjsTZDate(event.recurrenceOccurrenceDate)
    : undefined;
}

/**
 * 按编辑作用域对重复事件执行变更，返回需要写入宿主事件数组的结果。
 *
 * 设计原则：
 * - 组件采用宿主受控数据模型，不直接修改事件
 * - 此函数为纯计算工具，宿主在回调中调用后将结果写回 `props.events`
 *
 * 三种作用域语义：
 * - `'single'`：仅修改本次发生 → 生成/更新一条 RecurringException
 * - `'following'`：修改本次及以后 → 截断父事件 recurrence.until + 创建新事件
 * - `'all'`：修改整个系列 → 直接修改父事件基础属性
 *
 * @param parentEvent - 宿主事件数组中的父事件（即展开前的原始事件）
 * @param occurrenceDate - 被编辑实例的原始发生日期（来自 recurrenceInstance.recurrenceOccurrenceDate）
 * @param scope - 编辑作用域
 * @param changes - 需要应用的属性变更（如新的 start/end/color 等）
 * @returns 替换父事件的新事件数组（1~2 个元素）。宿主应在事件数组中删除父事件、插入返回值。
 */
export function applyRecurrenceEditScope(params: {
  parentEvent: EventObject;
  occurrenceDate: DayjsTZDate;
  scope: CalendarRecurrenceEditScope;
  changes: Partial<EventObject>;
}): EventObject[] {
  const { parentEvent, occurrenceDate, scope, changes } = params;

  switch (scope) {
    case 'single':
      return applySingleScope(parentEvent, occurrenceDate, changes);
    case 'following':
      return applyFollowingScope(parentEvent, occurrenceDate, changes);
    case 'all':
      return applyAllScope(parentEvent, changes);
    default:
      return [parentEvent];
  }
}

/**
 * single scope：为本次发生创建/更新 RecurringException override
 *
 * 逻辑：
 * 1. 拷贝父事件
 * 2. 在 recurringExceptions 数组中查找/新增一条 exception
 * 3. exception.overrides = changes
 * 4. 返回 [updatedParent]
 */
function applySingleScope(
  parentEvent: EventObject,
  occurrenceDate: DayjsTZDate,
  changes: Partial<EventObject>
): EventObject[] {
  const exceptions = [...(parentEvent.recurringExceptions ?? [])];
  const existingIndex = findExceptionIndex(exceptions, occurrenceDate);

  if (existingIndex >= 0) {
    // 合并到已有的 overrides
    const existing = exceptions[existingIndex];
    exceptions[existingIndex] = {
      ...existing,
      skipped: false,
      overrides: { ...existing.overrides, ...changes },
    };
  } else {
    exceptions.push({
      date: occurrenceDate,
      overrides: changes,
    });
  }

  return [
    {
      ...parentEvent,
      recurringExceptions: exceptions,
    },
  ];
}

/**
 * following scope：截断父事件 recurrence + 创建新事件
 *
 * 逻辑：
 * 1. 修改父事件 recurrence.until = occurrenceDate 前一天
 * 2. 创建新事件：
 *    - 继承父事件属性 + 应用 changes
 *    - 新的 start = changes.start ?? occurrenceDate
 *    - 新的 recurrence = 父事件的原始 recurrence（去掉 until/count，让后续继续展开）
 *    - 新的 id = 自动生成或留空
 * 3. 返回 [truncatedParent, newEvent]
 */
function applyFollowingScope(
  parentEvent: EventObject,
  occurrenceDate: DayjsTZDate,
  changes: Partial<EventObject>
): EventObject[] {
  // 截断父事件：until 设为 occurrenceDate 前一天 23:59:59.999
  // 注意：until 使用发生日期相同的时区语义（DayjsTZDate），截断点为 T-1 日末。
  // recurrence 展开时 occurrenceDate <= until 比较，因此 occurrenceDate
  // 本身不再被截断后的规则覆盖，由下方新事件从 occurrenceDate 开始继续展开。
  let dayBefore = new DayjsTZDate(occurrenceDate.getTime());
  dayBefore = dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore = dayBefore.setHours(23, 59, 59, 999);

  const truncatedParent: EventObject = {
    ...parentEvent,
    recurrence: parentEvent.recurrence
      ? {
          ...parentEvent.recurrence,
          until: dayBefore,
          // 截断后 count 不再有意义，移除
          count: undefined,
        }
      : undefined,
  };

  // 新事件：继承父事件 + 应用 changes + 携带原 recurrence 继续展开
  const originalRecurrence = parentEvent.recurrence
    ? {
        ...parentEvent.recurrence,
        // 新系列从 occurrenceDate 开始，移除 until/count 限制
        until: undefined,
        count: undefined,
      }
    : undefined;

  const newEvent: EventObject = {
    ...parentEvent,
    ...changes,
    id: undefined, // 新系列不继承原 ID
    recurrence: originalRecurrence,
    recurringExceptions: undefined,
    recurringExceptionRule: undefined,
    recurrenceParentId: undefined,
    recurrenceOccurrenceDate: undefined,
  };

  return [truncatedParent, newEvent];
}

/**
 * all scope：直接修改父事件基础属性，保留 recurrence 规则
 *
 * 逻辑：
 * 1. 将 changes 合并到父事件
 * 2. 保留 recurrence / recurringExceptions 等规则字段
 * 3. 对 start / end 仅应用"日内时间"变更，保留父事件的原始日期
 *    （避免实例日期覆盖父事件锚点导致展开丢失实例）
 * 4. 返回 [updatedParent]
 */
function applyAllScope(parentEvent: EventObject, changes: Partial<EventObject>): EventObject[] {
  // 不允许通过 changes 覆盖 recurrence 相关字段
  const safeChanges = { ...changes };
  delete safeChanges.recurrence;
  delete safeChanges.recurringExceptions;
  delete safeChanges.recurringExceptionRule;
  delete safeChanges.recurrenceParentId;
  delete safeChanges.recurrenceOccurrenceDate;

  // start / end 仅取日内时间偏移量，应用到父事件的原始日期上
  // 这样 "all" 语义 = 所有实例的时间同步移动，而非改变 recurrence 锚点日期
  if (safeChanges.start != null) {
    safeChanges.start = mergeTimeIntoDate(parentEvent.start, safeChanges.start);
  }
  if (safeChanges.end != null) {
    safeChanges.end = mergeTimeIntoDate(parentEvent.end, safeChanges.end);
  }

  return [
    {
      ...parentEvent,
      ...safeChanges,
    },
  ];
}

/**
 * 将 source 的"日内时间"合并到 target 的日期上
 *
 * 例如 target = Mon 10:00, source = Wed 11:00 → Mon 11:00
 */
function mergeTimeIntoDate(
  target: EventObject['start'],
  source: EventObject['start']
): DayjsTZDate {
  const targetDate = new DayjsTZDate(target);
  const sourceDate = new DayjsTZDate(source);

  return targetDate.setHours(
    sourceDate.getHours(),
    sourceDate.getMinutes(),
    sourceDate.getSeconds(),
    sourceDate.getMilliseconds()
  );
}

/**
 * 在 RecurringException 数组中查找匹配日期的条目索引
 */
function findExceptionIndex(exceptions: RecurringException[], date: DayjsTZDate): number {
  return exceptions.findIndex((exc) => isSameDate(date, new DayjsTZDate(exc.date)));
}

/**
 * 从 EventObject 中提取 recurrence 实例信息（用于回调 payload）
 *
 * 如果事件不是 recurrence 实例（无 recurrenceParentId），返回 undefined。
 * 宿主在 onEventUpdate / onEventDelete 回调中使用此信息选择编辑作用域。
 */
export function buildRecurrenceInstanceInfo(
  event: EventObject
): CalendarRecurrenceInstanceInfo | undefined {
  if (!isRecurrenceInstance(event) || !event.recurrenceOccurrenceDate) {
    return undefined;
  }
  return {
    recurrenceParentId: event.recurrenceParentId!,
    recurrenceOccurrenceDate: new DayjsTZDate(event.recurrenceOccurrenceDate),
  };
}
