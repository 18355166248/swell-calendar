import { EventModel } from '@/model/eventModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { expandRecurrence } from '@/time/recurrence';
import { EventObject, RecurringException } from '@/types/events.type';
import Collection from '@/utils/collection';

/**
 * 从 recurringExceptions 查找某个日期是否被跳过或有替换属性
 */
function getExceptionForDate(
  exceptions: RecurringException[] | undefined,
  date: DayjsTZDate
): RecurringException | undefined {
  if (!exceptions || exceptions.length === 0) {
    return undefined;
  }

  for (const exception of exceptions) {
    const exceptionDate = new DayjsTZDate(exception.date);
    // 比较日期部分（忽略时间）
    if (
      date.getFullYear() === exceptionDate.getFullYear() &&
      date.getMonth() === exceptionDate.getMonth() &&
      date.getDate() === exceptionDate.getDate()
    ) {
      return exception;
    }
  }

  return undefined;
}

/**
 * 为展开实例生成唯一且跨渲染稳定的 ID
 *
 * 如果原事件有 id，使用 `${原id}-${展开日期}`；
 * 如果原事件无 id，使用 `${事件标题}-${循环索引}-${展开日期}`。
 * 标题 + 索引的组合保证：
 * - 同一事件两次渲染产生相同 ID（稳定性）
 * - 不同事件的实例 ID 不冲突（唯一性）
 */
function generateInstanceId(
  originalId: string | undefined,
  eventTitle: string | undefined,
  occurrenceDate: DayjsTZDate,
  loopIndex: number
): string {
  const dateStr = occurrenceDate.format('YYYY-MM-DD');
  if (originalId) {
    return `${originalId}-${dateStr}`;
  }
  const titlePrefix = eventTitle ?? 'untitled';
  return `${titlePrefix}-${loopIndex}-${dateStr}`;
}

/**
 * 展开一个 recurring 事件到视口内的多个实例
 *
 * 逻辑:
 * 1. 调用 expandRecurrence 在视口内展开日期
 * 2. 对每个展开的日期实例:
 *    - 检查 recurringExceptions 是否跳过该日期
 *    - 如果 skipped: true, 不渲染
 *    - 如果有 overrides, 合并 overrides 到实例的事件属性
 *    - 否则正常渲染为独立实例
 * 3. 每个实例继承原事件的视觉属性和资源绑定
 * 4. 每个实例分配唯一且跨渲染稳定的 id
 *
 * 注：当前只处理 time 事件（scheduler time grid）的 recurrence 展开，
 * allday 事件的 recurrence 展开不在本步骤范围内，后续单独接入。
 *
 * 注：recurringExceptionRule（规则类型的异常）尚未实现，
 * 当前只处理逐日期的 recurringExceptions 数组。TODO: Phase 3 后续步骤接入。
 */
export function expandSchedulerRecurrenceEvent(
  event: EventObject,
  rangeStart: DayjsTZDate,
  rangeEnd: DayjsTZDate
): EventObject[] {
  const rule = event.recurrence;
  if (!rule) {
    return [event];
  }

  const eventStart = new DayjsTZDate(event.start);
  const result = expandRecurrence(rule, eventStart, rangeStart, rangeEnd);

  if (result.dates.length === 0) {
    return [];
  }

  const expandedEvents: EventObject[] = [];

  // recurringExceptions 优先级高于 rule.exceptions
  // rule.exceptions 是 DateType[]（仅跳过日期），recurringExceptions 是 RecurringException[]（支持跳过和替换）
  const exceptions = event.recurringExceptions ?? undefined;

  // expandRecurrence 将日期归一化到午夜（00:00）做日期运算，
  // 需要提取原事件的日内时间偏移量，在构造实例时加回到每个展开日期上
  const startOfDayMs = new DayjsTZDate(eventStart).setHours(0, 0, 0, 0).getTime();
  const timeOfDayMs = eventStart.getTime() - startOfDayMs;
  const durationMs = new DayjsTZDate(event.end).getTime() - eventStart.getTime();

  let loopIndex = 0;

  for (const rawOccurrenceDate of result.dates) {
    const exception = getExceptionForDate(exceptions, rawOccurrenceDate);

    if (exception?.skipped) {
      // 跳过该日期, 不渲染
      loopIndex++;
      continue;
    }

    // 将原事件的时分秒偏移量加回到展开日期上
    const occurrenceDate = new DayjsTZDate(rawOccurrenceDate.getTime() + timeOfDayMs);
    const instanceEnd = new DayjsTZDate(occurrenceDate.getTime() + durationMs);

    const instanceEvent: EventObject = {
      ...event,
      id: generateInstanceId(event.id, event.title, rawOccurrenceDate, loopIndex),
      start: occurrenceDate,
      end: instanceEnd,
      recurrence: undefined, // 实例不再携带 recurrence 规则，避免无限递归
      recurringExceptions: undefined,
      recurringExceptionRule: undefined,
      // 展开实例元数据：宿主在回调中据此识别父事件和原始发生日期
      recurrenceParentId: event.id ?? '',
      recurrenceOccurrenceDate: occurrenceDate,
    };

    // 合并 exception overrides（如果有）
    if (exception?.overrides) {
      Object.assign(instanceEvent, exception.overrides);
    }

    expandedEvents.push(instanceEvent);
    loopIndex++;
  }

  return expandedEvents;
}

/**
 * 将 events 集合中所有有 recurrence 的父事件在 [rangeStart, rangeEnd] 内展开为实例 EventModel[]。
 * 非重复事件原样返回。所有视图（week/month/agenda）共用此函数。
 */
export function expandAllRecurringInRange(
  events: Collection<EventModel>,
  rangeStart: DayjsTZDate,
  rangeEnd: DayjsTZDate
): { nonRecurring: EventModel[]; instances: EventModel[] } {
  const nonRecurring: EventModel[] = [];
  const instances: EventModel[] = [];

  events.each((model) => {
    if (!model.recurrence) {
      nonRecurring.push(model);
      return;
    }
    const expanded = expandSchedulerRecurrenceEvent(model.toEventObject(), rangeStart, rangeEnd);
    for (const inst of expanded) {
      instances.push(new EventModel(inst));
    }
  });

  return { nonRecurring, instances };
}
