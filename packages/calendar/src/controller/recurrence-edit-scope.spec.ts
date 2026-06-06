import { describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject } from '@/types/events.type';

import {
  applyRecurrenceEditScope,
  buildRecurrenceInstanceInfo,
  getRecurrenceOccurrenceDate,
  getRecurrenceParentId,
  isRecurrenceInstance,
} from './recurrence-edit-scope';

function d(dateStr: string): DayjsTZDate {
  return new DayjsTZDate(dateStr);
}

const parentEvent: EventObject = {
  id: 'weekly-standup',
  title: '每日站会',
  start: '2026-06-01T09:00:00',
  end: '2026-06-01T09:30:00',
  resourceId: 'r1',
  recurrence: {
    frequency: 'weekly',
    byWeekDays: [1], // 每周一
  },
  recurringExceptions: [],
};

describe('recurrence-edit-scope', () => {
  describe('isRecurrenceInstance', () => {
    it('有 recurrenceParentId 时返回 true', () => {
      expect(isRecurrenceInstance({ recurrenceParentId: 'abc' })).toBe(true);
    });

    it('recurrenceParentId 为空字符串时返回 false', () => {
      expect(isRecurrenceInstance({ recurrenceParentId: '' })).toBe(false);
    });

    it('无 recurrenceParentId 时返回 false', () => {
      expect(isRecurrenceInstance({ id: 'normal-event' })).toBe(false);
    });
  });

  describe('getRecurrenceParentId', () => {
    it('返回父事件 ID', () => {
      expect(getRecurrenceParentId({ recurrenceParentId: 'p1' })).toBe('p1');
    });

    it('空字符串返回 undefined', () => {
      expect(getRecurrenceParentId({ recurrenceParentId: '' })).toBeUndefined();
    });
  });

  describe('getRecurrenceOccurrenceDate', () => {
    it('返回发生日期', () => {
      const result = getRecurrenceOccurrenceDate({
        recurrenceOccurrenceDate: '2026-06-08',
      });
      expect(result).toBeDefined();
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(5); // June = 5
      expect(result!.getDate()).toBe(8);
    });

    it('无 occurrenceDate 时返回 undefined', () => {
      expect(getRecurrenceOccurrenceDate({})).toBeUndefined();
    });
  });

  describe('buildRecurrenceInstanceInfo', () => {
    it('对 recurrence 实例返回完整 info', () => {
      const event: EventObject = {
        id: 'weekly-standup-2026-06-08',
        recurrenceParentId: 'weekly-standup',
        recurrenceOccurrenceDate: '2026-06-08',
      };
      const info = buildRecurrenceInstanceInfo(event);
      expect(info).toBeDefined();
      expect(info!.recurrenceParentId).toBe('weekly-standup');
      expect(info!.recurrenceOccurrenceDate.getDate()).toBe(8);
    });

    it('对非 recurrence 实例返回 undefined', () => {
      expect(buildRecurrenceInstanceInfo({ id: 'normal' })).toBeUndefined();
    });

    it('有 parentId 但无 occurrenceDate 时返回 undefined', () => {
      expect(buildRecurrenceInstanceInfo({ recurrenceParentId: 'p1' })).toBeUndefined();
    });
  });

  describe('applyRecurrenceEditScope — single', () => {
    it('为本次发生创建 RecurringException override', () => {
      const result = applyRecurrenceEditScope({
        parentEvent,
        occurrenceDate: d('2026-06-08'),
        scope: 'single',
        changes: {
          start: d('2026-06-08T10:00:00'),
          end: d('2026-06-08T10:30:00'),
        },
      });

      expect(result).toHaveLength(1);
      const updated = result[0];
      expect(updated.recurringExceptions).toHaveLength(1);
      expect(updated.recurringExceptions![0].date).toEqual(d('2026-06-08'));
      expect(updated.recurringExceptions![0].overrides?.start).toEqual(d('2026-06-08T10:00:00'));
    });

    it('合并到已有的 exception', () => {
      const eventWithException: EventObject = {
        ...parentEvent,
        recurringExceptions: [
          {
            date: '2026-06-08',
            overrides: { title: '已修改标题' },
          },
        ],
      };

      const result = applyRecurrenceEditScope({
        parentEvent: eventWithException,
        occurrenceDate: d('2026-06-08'),
        scope: 'single',
        changes: {
          start: d('2026-06-08T10:00:00'),
        },
      });

      expect(result).toHaveLength(1);
      const exceptions = result[0].recurringExceptions!;
      expect(exceptions).toHaveLength(1);
      // 合并后的 overrides 应包含原有和新增的
      expect(exceptions[0].overrides?.title).toBe('已修改标题');
      expect(exceptions[0].overrides?.start).toEqual(d('2026-06-08T10:00:00'));
    });

    it('不修改父事件的 recurrence 规则', () => {
      const result = applyRecurrenceEditScope({
        parentEvent,
        occurrenceDate: d('2026-06-08'),
        scope: 'single',
        changes: { title: '单次改名' },
      });

      expect(result[0].recurrence).toEqual(parentEvent.recurrence);
    });
  });

  describe('applyRecurrenceEditScope — following', () => {
    it('截断父事件 recurrence.until 并创建新事件', () => {
      const result = applyRecurrenceEditScope({
        parentEvent,
        occurrenceDate: d('2026-06-15'),
        scope: 'following',
        changes: {
          start: d('2026-06-15T14:00:00'),
          end: d('2026-06-15T14:30:00'),
        },
      });

      expect(result).toHaveLength(2);

      // 截断后的父事件
      const truncated = result[0];
      expect(truncated.recurrence?.until).toBeDefined();
      // until 应为 2026-06-14 23:59:59
      const until = new DayjsTZDate(truncated.recurrence!.until!);
      expect(until.getDate()).toBe(14);
      expect(truncated.recurrence?.count).toBeUndefined();

      // 新事件
      const newEvent = result[1];
      expect(newEvent.id).toBeUndefined();
      expect(newEvent.start).toEqual(d('2026-06-15T14:00:00'));
      expect(newEvent.recurrence).toBeDefined();
      expect(newEvent.recurrence?.frequency).toBe('weekly');
      expect(newEvent.recurrence?.until).toBeUndefined();
      expect(newEvent.recurrence?.count).toBeUndefined();
      expect(newEvent.recurrenceParentId).toBeUndefined();
      expect(newEvent.recurrenceOccurrenceDate).toBeUndefined();
    });
  });

  describe('applyRecurrenceEditScope — all', () => {
    it('修改父事件基础属性，保留 recurrence 规则', () => {
      const result = applyRecurrenceEditScope({
        parentEvent,
        occurrenceDate: d('2026-06-08'),
        scope: 'all',
        changes: {
          title: '改名后的站会',
          start: d('2026-06-01T10:00:00'),
          end: d('2026-06-01T10:30:00'),
        },
      });

      expect(result).toHaveLength(1);
      const updated = result[0];
      expect(updated.title).toBe('改名后的站会');
      expect(updated.start).toEqual(d('2026-06-01T10:00:00'));
      // recurrence 规则未被覆盖
      expect(updated.recurrence).toEqual(parentEvent.recurrence);
      expect(updated.recurringExceptions).toEqual(parentEvent.recurringExceptions);
    });

    it('不允许通过 changes 覆盖 recurrence 字段', () => {
      const result = applyRecurrenceEditScope({
        parentEvent,
        occurrenceDate: d('2026-06-08'),
        scope: 'all',
        changes: {
          recurrence: { frequency: 'daily' },
          recurringExceptions: [{ date: '2026-06-10', skipped: true }],
        } as Partial<EventObject>,
      });

      expect(result[0].recurrence).toEqual(parentEvent.recurrence);
      expect(result[0].recurringExceptions).toEqual(parentEvent.recurringExceptions);
    });
  });
});
