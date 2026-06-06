/**
 * 集成测试：recurrence 实例的四个交互 (move / resize / delete / create)
 * 覆盖完整数据流链路：展开 → 交互回调 → applyRecurrenceEditScope → 重新展开
 */
import { describe, expect, it } from 'vitest';

import {
  applyRecurrenceEditScope,
  buildRecurrenceInstanceInfo,
} from '@/controller/recurrence-edit-scope';
import { createUpdatedTimeGridEvent } from '@/controller/scheduler.controller';
import { expandSchedulerRecurrenceEvent } from '@/controller/scheduler-recurrence';
import { EventModel } from '@/model/eventModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject } from '@/types/events.type';

/* ---------- helpers ---------- */

function d(iso: string): DayjsTZDate {
  return new DayjsTZDate(iso);
}

/** 将事件 start/end 统一转为 DayjsTZDate 以便比较 */
function toStart(event: EventObject): DayjsTZDate {
  return new DayjsTZDate(event.start);
}

function toEnd(event: EventObject): DayjsTZDate {
  return new DayjsTZDate(event.end);
}

const RECURRENCE_PARENT: EventObject = {
  id: 'weekly-standup',
  title: '每日站会',
  category: 'time',
  start: '2026-06-01T10:00:00',
  end: '2026-06-01T11:00:00',
  resourceId: 'r1',
  editable: true,
  recurrence: {
    frequency: 'weekly',
    byWeekDays: [1, 3, 5], // 周一、三、五
  },
};

const RANGE_START = d('2026-06-01');
const RANGE_END = d('2026-06-07');

/* ================================================================
 * MOVE — 拖拽移动 recurrence 实例
 * ================================================================ */
describe('集成: move recurrence instance', () => {
  it('single scope: 拖拽一个实例到新的时间，仅该实例受影响', () => {
    // 1. 展开
    const instances = expandSchedulerRecurrenceEvent(RECURRENCE_PARENT, RANGE_START, RANGE_END);
    expect(instances.length).toBe(3); // 周一/三/五

    // 2. 取周三实例
    const wedInstance = instances.find((i) => toStart(i).getDay() === 3)!;
    expect(wedInstance).toBeDefined();
    expect(toStart(wedInstance).getHours()).toBe(10);

    // 3. 模拟拖拽下移 1 行（+30min）：createUpdatedTimeGridEvent
    const model = new EventModel(wedInstance);
    const previousEvent = model.toEventObject();
    const nextStart = toStart(wedInstance).addMilliseconds(30 * 60 * 1000);
    const nextEnd = toEnd(wedInstance).addMilliseconds(30 * 60 * 1000);
    const updatedEvent = createUpdatedTimeGridEvent(previousEvent, nextStart, nextEnd);

    // 4. buildRecurrenceInstanceInfo 应返回正确的 info
    const recurrenceInstance = buildRecurrenceInstanceInfo(updatedEvent);
    expect(recurrenceInstance).toBeDefined();
    expect(recurrenceInstance!.recurrenceParentId).toBe('weekly-standup');

    // 5. 宿主在 onEventUpdate 中调用 applyRecurrenceEditScope (single)
    const result = applyRecurrenceEditScope({
      parentEvent: RECURRENCE_PARENT,
      occurrenceDate: recurrenceInstance!.recurrenceOccurrenceDate,
      scope: 'single',
      changes: { start: updatedEvent.start, end: updatedEvent.end },
    });

    expect(result).toHaveLength(1);
    const updatedParent = result[0];
    expect(updatedParent.recurringExceptions).toHaveLength(1);

    // 6. 重新展开，验证周三实例时间已变、周一/五不变
    const reExpanded = expandSchedulerRecurrenceEvent(updatedParent, RANGE_START, RANGE_END);
    expect(reExpanded.length).toBe(3);

    for (const inst of reExpanded) {
      const start = toStart(inst);
      if (start.getDay() === 3) {
        // 周三：从 10:00 → 10:30
        expect(start.getHours()).toBe(10);
        expect(start.getMinutes()).toBe(30);
      } else {
        // 周一/五：保持 10:00
        expect(start.getHours()).toBe(10);
        expect(start.getMinutes()).toBe(0);
      }
    }
  });

  it('all scope: 拖拽一个实例到新的时间，所有实例受影响', () => {
    const instances = expandSchedulerRecurrenceEvent(RECURRENCE_PARENT, RANGE_START, RANGE_END);
    const wedInstance = instances.find((i) => toStart(i).getDay() === 3)!;

    const model = new EventModel(wedInstance);
    const previousEvent = model.toEventObject();
    const nextStart = toStart(wedInstance).addMilliseconds(60 * 60 * 1000); // +1h
    const nextEnd = toEnd(wedInstance).addMilliseconds(60 * 60 * 1000);
    const updatedEvent = createUpdatedTimeGridEvent(previousEvent, nextStart, nextEnd);

    const result = applyRecurrenceEditScope({
      parentEvent: RECURRENCE_PARENT,
      occurrenceDate: buildRecurrenceInstanceInfo(updatedEvent)!.recurrenceOccurrenceDate,
      scope: 'all',
      changes: { start: updatedEvent.start, end: updatedEvent.end },
    });

    expect(result).toHaveLength(1);
    const updatedParent = result[0];

    const reExpanded = expandSchedulerRecurrenceEvent(updatedParent, RANGE_START, RANGE_END);
    expect(reExpanded.length).toBe(3);

    // 所有实例都应移到 11:00
    for (const inst of reExpanded) {
      const start = toStart(inst);
      expect(start.getHours()).toBe(11);
      expect(start.getMinutes()).toBe(0);
    }
  });

  it('following scope: 拖拽周三实例，周三及之后的实例受影响', () => {
    const instances = expandSchedulerRecurrenceEvent(RECURRENCE_PARENT, RANGE_START, RANGE_END);
    const wedInstance = instances.find((i) => toStart(i).getDay() === 3)!;

    const model = new EventModel(wedInstance);
    const previousEvent = model.toEventObject();
    const nextStart = toStart(wedInstance).addMilliseconds(2 * 60 * 60 * 1000); // +2h → 12:00
    const nextEnd = toEnd(wedInstance).addMilliseconds(2 * 60 * 60 * 1000);
    const updatedEvent = createUpdatedTimeGridEvent(previousEvent, nextStart, nextEnd);

    const result = applyRecurrenceEditScope({
      parentEvent: RECURRENCE_PARENT,
      occurrenceDate: buildRecurrenceInstanceInfo(updatedEvent)!.recurrenceOccurrenceDate,
      scope: 'following',
      changes: { start: updatedEvent.start, end: updatedEvent.end },
    });

    // following 返回 2 个事件：截断后的父事件 + 新事件
    expect(result).toHaveLength(2);
    const [truncatedParent, newEvent] = result;

    // 截断后的父事件：until 为周二 23:59
    expect(truncatedParent.recurrence?.until).toBeDefined();
    const until = new DayjsTZDate(truncatedParent.recurrence!.until!);
    expect(until.getDate()).toBe(2); // 6月2日 = 周二

    // 新事件：start 为周三 12:00，继续 weekly recurrence
    expect(toStart(newEvent).getHours()).toBe(12);
    expect(newEvent.recurrence).toBeDefined();

    // 展开截断后的父事件：应只有周一
    const parentInstances = expandSchedulerRecurrenceEvent(truncatedParent, RANGE_START, RANGE_END);
    expect(parentInstances.length).toBe(1);
    expect(toStart(parentInstances[0]).getDay()).toBe(1); // 周一
    expect(toStart(parentInstances[0]).getHours()).toBe(10); // 保持原时间

    // 展开新事件：应有周三和周五
    const newInstances = expandSchedulerRecurrenceEvent(newEvent, RANGE_START, RANGE_END);
    expect(newInstances.length).toBe(2);
    for (const inst of newInstances) {
      expect(toStart(inst).getHours()).toBe(12); // 新时间
      expect([3, 5]).toContain(toStart(inst).getDay()); // 周三/五
    }
  });

  it('两次拖拽同一实例：exception override 应正确合并', () => {
    const instances = expandSchedulerRecurrenceEvent(RECURRENCE_PARENT, RANGE_START, RANGE_END);
    const wedInstance = instances.find((i) => toStart(i).getDay() === 3)!;

    // 第一次拖拽：10:00 → 10:30
    const model1 = new EventModel(wedInstance);
    const prev1 = model1.toEventObject();
    const updated1 = createUpdatedTimeGridEvent(
      prev1,
      toStart(wedInstance).addMilliseconds(30 * 60 * 1000),
      toEnd(wedInstance).addMilliseconds(30 * 60 * 1000)
    );

    const result1 = applyRecurrenceEditScope({
      parentEvent: RECURRENCE_PARENT,
      occurrenceDate: buildRecurrenceInstanceInfo(updated1)!.recurrenceOccurrenceDate,
      scope: 'single',
      changes: { start: updated1.start, end: updated1.end },
    });
    const parent1 = result1[0];

    // 重新展开
    const instances2 = expandSchedulerRecurrenceEvent(parent1, RANGE_START, RANGE_END);
    const wedInstance2 = instances2.find((i) => toStart(i).getDay() === 3)!;
    expect(toStart(wedInstance2).getMinutes()).toBe(30);

    // 第二次拖拽：10:30 → 11:00
    const model2 = new EventModel(wedInstance2);
    const prev2 = model2.toEventObject();
    const updated2 = createUpdatedTimeGridEvent(
      prev2,
      toStart(wedInstance2).addMilliseconds(30 * 60 * 1000),
      toEnd(wedInstance2).addMilliseconds(30 * 60 * 1000)
    );

    const result2 = applyRecurrenceEditScope({
      parentEvent: parent1,
      occurrenceDate: buildRecurrenceInstanceInfo(updated2)!.recurrenceOccurrenceDate,
      scope: 'single',
      changes: { start: updated2.start, end: updated2.end },
    });
    const parent2 = result2[0];

    // 验证：仍然只有 1 个 exception（合并而非新增）
    expect(parent2.recurringExceptions).toHaveLength(1);

    // 重新展开验证最终时间
    const instances3 = expandSchedulerRecurrenceEvent(parent2, RANGE_START, RANGE_END);
    const wedInstance3 = instances3.find((i) => toStart(i).getDay() === 3)!;
    expect(toStart(wedInstance3).getHours()).toBe(11);
    expect(toStart(wedInstance3).getMinutes()).toBe(0);
  });

  it('跨日拖拽: 实例从周三拖到周四', () => {
    const instances = expandSchedulerRecurrenceEvent(RECURRENCE_PARENT, RANGE_START, RANGE_END);
    const wedInstance = instances.find((i) => toStart(i).getDay() === 3)!;

    const model = new EventModel(wedInstance);
    const previousEvent = model.toEventObject();
    // 拖到下一天（+1 day）
    const nextStart = toStart(wedInstance).addMilliseconds(24 * 60 * 60 * 1000);
    const nextEnd = toEnd(wedInstance).addMilliseconds(24 * 60 * 60 * 1000);
    const updatedEvent = createUpdatedTimeGridEvent(previousEvent, nextStart, nextEnd);

    // single scope: 仅影响本次
    const result = applyRecurrenceEditScope({
      parentEvent: RECURRENCE_PARENT,
      occurrenceDate: buildRecurrenceInstanceInfo(updatedEvent)!.recurrenceOccurrenceDate,
      scope: 'single',
      changes: { start: updatedEvent.start, end: updatedEvent.end },
    });

    const updatedParent = result[0];
    const reExpanded = expandSchedulerRecurrenceEvent(updatedParent, RANGE_START, RANGE_END);

    // 找到周四（原周三 + 1 天）的实例
    const thuInstance = reExpanded.find((i) => {
      const s = toStart(i);
      return s.getDay() === 4 && s.getDate() === 4; // 6月4日 = 周四
    });
    expect(thuInstance).toBeDefined();
    expect(toStart(thuInstance!).getHours()).toBe(10);

    // 周一/五不受影响
    const monInstance = reExpanded.find((i) => toStart(i).getDay() === 1)!;
    expect(toStart(monInstance).getHours()).toBe(10);
  });
});

/* ================================================================
 * RESIZE — 拖拽上下边缘调整 recurrence 实例时间范围
 * ================================================================ */
describe('集成: resize recurrence instance', () => {
  it('single scope: 拖拽底部边缘延长实例', () => {
    const instances = expandSchedulerRecurrenceEvent(RECURRENCE_PARENT, RANGE_START, RANGE_END);
    const wedInstance = instances.find((i) => toStart(i).getDay() === 3)!;

    const model = new EventModel(wedInstance);
    const previousEvent = model.toEventObject();
    // resize: end 从 11:00 → 12:00（延长 1h），start 不变
    const newEnd = toEnd(wedInstance).addMilliseconds(60 * 60 * 1000);
    const updatedEvent = createUpdatedTimeGridEvent(previousEvent, toStart(wedInstance), newEnd);

    const recurrenceInstance = buildRecurrenceInstanceInfo(updatedEvent);
    expect(recurrenceInstance).toBeDefined();

    const result = applyRecurrenceEditScope({
      parentEvent: RECURRENCE_PARENT,
      occurrenceDate: recurrenceInstance!.recurrenceOccurrenceDate,
      scope: 'single',
      changes: { start: updatedEvent.start, end: updatedEvent.end },
    });

    const reExpanded = expandSchedulerRecurrenceEvent(result[0], RANGE_START, RANGE_END);
    const wedAfter = reExpanded.find((i) => toStart(i).getDay() === 3)!;

    // start 不变（10:00），end 延长到 12:00
    expect(toStart(wedAfter).getHours()).toBe(10);
    expect(toEnd(wedAfter).getHours()).toBe(12);

    // 周一/五不变
    const monAfter = reExpanded.find((i) => toStart(i).getDay() === 1)!;
    expect(toStart(monAfter).getHours()).toBe(10);
    expect(toEnd(monAfter).getHours()).toBe(11);
  });

  it('single scope: 拖拽顶部边缘缩短实例', () => {
    const instances = expandSchedulerRecurrenceEvent(RECURRENCE_PARENT, RANGE_START, RANGE_END);
    const friInstance = instances.find((i) => toStart(i).getDay() === 5)!;

    const model = new EventModel(friInstance);
    const previousEvent = model.toEventObject();
    // resize top: start 从 10:00 → 10:30，end 不变
    const newStart = toStart(friInstance).addMilliseconds(30 * 60 * 1000);
    const updatedEvent = createUpdatedTimeGridEvent(previousEvent, newStart, toEnd(friInstance));

    const result = applyRecurrenceEditScope({
      parentEvent: RECURRENCE_PARENT,
      occurrenceDate: buildRecurrenceInstanceInfo(updatedEvent)!.recurrenceOccurrenceDate,
      scope: 'single',
      changes: { start: updatedEvent.start, end: updatedEvent.end },
    });

    const reExpanded = expandSchedulerRecurrenceEvent(result[0], RANGE_START, RANGE_END);
    const friAfter = reExpanded.find((i) => toStart(i).getDay() === 5)!;

    expect(toStart(friAfter).getHours()).toBe(10);
    expect(toStart(friAfter).getMinutes()).toBe(30);
    expect(toEnd(friAfter).getHours()).toBe(11);
  });
});

/* ================================================================
 * DELETE — 删除 recurrence 实例
 * ================================================================ */
describe('集成: delete recurrence instance', () => {
  it('single scope: 删除一个实例，添加 skipped exception', () => {
    const instances = expandSchedulerRecurrenceEvent(RECURRENCE_PARENT, RANGE_START, RANGE_END);
    expect(instances.length).toBe(3);

    const wedInstance = instances.find((i) => toStart(i).getDay() === 3)!;
    const model = new EventModel(wedInstance);
    const eventObject = model.toEventObject();

    // buildRecurrenceInstanceInfo
    const recurrenceInstance = buildRecurrenceInstanceInfo(eventObject);
    expect(recurrenceInstance).toBeDefined();
    expect(recurrenceInstance!.recurrenceParentId).toBe('weekly-standup');

    // 宿主在 onEventDelete 中为 single scope 添加 skipped exception
    const exceptions = [...(RECURRENCE_PARENT.recurringExceptions ?? [])];
    exceptions.push({
      date: recurrenceInstance!.recurrenceOccurrenceDate,
      skipped: true,
    });
    const updatedParent: EventObject = {
      ...RECURRENCE_PARENT,
      recurringExceptions: exceptions,
    };

    // 重新展开
    const reExpanded = expandSchedulerRecurrenceEvent(updatedParent, RANGE_START, RANGE_END);
    expect(reExpanded.length).toBe(2); // 周一/五，周三被跳过

    const days = reExpanded.map((i) => toStart(i).getDay());
    expect(days).toContain(1); // 周一
    expect(days).not.toContain(3); // 周三被跳过
    expect(days).toContain(5); // 周五
  });

  it('连续删除两个实例', () => {
    const instances = expandSchedulerRecurrenceEvent(RECURRENCE_PARENT, RANGE_START, RANGE_END);

    // 删除周一实例
    const monInstance = instances.find((i) => toStart(i).getDay() === 1)!;
    const monInfo = buildRecurrenceInstanceInfo(new EventModel(monInstance).toEventObject())!;
    const parent1: EventObject = {
      ...RECURRENCE_PARENT,
      recurringExceptions: [{ date: monInfo.recurrenceOccurrenceDate, skipped: true }],
    };

    // 重新展开
    const instances2 = expandSchedulerRecurrenceEvent(parent1, RANGE_START, RANGE_END);
    expect(instances2.length).toBe(2); // 周三/五

    // 删除周五实例
    const friInstance = instances2.find((i) => toStart(i).getDay() === 5)!;
    const friInfo = buildRecurrenceInstanceInfo(new EventModel(friInstance).toEventObject())!;
    const parent2: EventObject = {
      ...parent1,
      recurringExceptions: [
        ...parent1.recurringExceptions!,
        { date: friInfo.recurrenceOccurrenceDate, skipped: true },
      ],
    };

    // 重新展开
    const instances3 = expandSchedulerRecurrenceEvent(parent2, RANGE_START, RANGE_END);
    expect(instances3.length).toBe(1); // 仅周三
    expect(toStart(instances3[0]).getDay()).toBe(3);
  });
});

/* ================================================================
 * CREATE — 在空白区域创建新事件
 * ================================================================ */
describe('集成: create event in recurrence story context', () => {
  it('创建非 recurrence 事件不影响现有 recurrence 展开', () => {
    // 模拟宿主在 onEventCreate 中添加新事件
    const existingEvents: EventObject[] = [RECURRENCE_PARENT];

    // 模拟在 r2 上创建 14:00-15:00 的事件
    const newEvent: EventObject = {
      id: 'new-event-1',
      title: '新会议',
      category: 'time',
      start: d('2026-06-02T14:00:00'),
      end: d('2026-06-02T15:00:00'),
      resourceId: 'r2',
    };

    const updatedEvents = [...existingEvents, newEvent];

    // 展开 recurrence 事件
    const instances = expandSchedulerRecurrenceEvent(RECURRENCE_PARENT, RANGE_START, RANGE_END);
    expect(instances.length).toBe(3);

    // 新事件不影响 recurrence 展开
    const normalEvents = updatedEvents.filter((e) => !e.recurrence);
    expect(normalEvents.length).toBe(1);
    expect(normalEvents[0].id).toBe('new-event-1');
  });
});

/* ================================================================
 * 边界情况
 * ================================================================ */
describe('集成: 边界情况', () => {
  it('非 recurrence 事件的 buildRecurrenceInstanceInfo 返回 undefined', () => {
    const normalEvent: EventObject = {
      id: 'normal-1',
      title: '普通事件',
      start: '2026-06-02T14:00:00',
      end: '2026-06-02T15:00:00',
      resourceId: 'r2',
    };
    const model = new EventModel(normalEvent);
    const eventObject = model.toEventObject();

    expect(buildRecurrenceInstanceInfo(eventObject)).toBeUndefined();
  });

  it('move 后 recurrenceParentId 被保留', () => {
    const instances = expandSchedulerRecurrenceEvent(RECURRENCE_PARENT, RANGE_START, RANGE_END);
    const wedInstance = instances.find((i) => toStart(i).getDay() === 3)!;
    const model = new EventModel(wedInstance);
    const previousEvent = model.toEventObject();

    const updatedEvent = createUpdatedTimeGridEvent(
      previousEvent,
      toStart(wedInstance).addMilliseconds(30 * 60 * 1000),
      toEnd(wedInstance).addMilliseconds(30 * 60 * 1000)
    );

    // createUpdatedTimeGridEvent 应保留 recurrenceParentId 和 recurrenceOccurrenceDate
    expect(updatedEvent.recurrenceParentId).toBe('weekly-standup');
    expect(updatedEvent.recurrenceOccurrenceDate).toBeDefined();
  });

  it('expandSchedulerRecurrenceEvent 正确应用 start/end overrides', () => {
    // 预先创建一个带 override 的父事件
    const parentWithOverride: EventObject = {
      ...RECURRENCE_PARENT,
      recurringExceptions: [
        {
          date: d('2026-06-03T10:00:00'), // 周三
          overrides: {
            start: d('2026-06-03T14:00:00'),
            end: d('2026-06-03T15:00:00'),
          },
        },
      ],
    };

    const instances = expandSchedulerRecurrenceEvent(parentWithOverride, RANGE_START, RANGE_END);
    expect(instances.length).toBe(3);

    const wedInstance = instances.find((i) => toStart(i).getDate() === 3)!;
    // override 将时间从 10:00 改为 14:00
    expect(toStart(wedInstance).getHours()).toBe(14);
    expect(toEnd(wedInstance).getHours()).toBe(15);

    // 周一/五不受影响
    const monInstance = instances.find((i) => toStart(i).getDay() === 1)!;
    expect(toStart(monInstance).getHours()).toBe(10);
  });
});
