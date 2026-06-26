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
        changes: { title: '单次改名', recurrence: { frequency: 'daily' } },
      });

      expect(result[0].recurrence).toEqual(parentEvent.recurrence);
      expect(result[0].recurringExceptions?.[0].overrides?.recurrence).toBeUndefined();
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

    it('未修改时间时，新系列仍从被编辑的本次日期开始', () => {
      const result = applyRecurrenceEditScope({
        parentEvent,
        occurrenceDate: d('2026-06-15T09:00:00'),
        scope: 'following',
        changes: {
          title: '从本次开始改名',
        },
      });

      const newEvent = result[1];
      expect(newEvent.title).toBe('从本次开始改名');
      expect(newEvent.start).toEqual(d('2026-06-15T09:00:00'));
      expect(newEvent.end).toEqual(d('2026-06-15T09:30:00'));
    });

    it('weekly 实例改到新星期几时同步新系列 byWeekDays，避免本次被跳过', () => {
      const result = applyRecurrenceEditScope({
        parentEvent,
        occurrenceDate: d('2026-06-15T09:00:00'),
        scope: 'following',
        changes: {
          start: d('2026-06-17T14:00:00'),
          end: d('2026-06-17T14:30:00'),
        },
      });

      const newEvent = result[1];
      expect(newEvent.start).toEqual(d('2026-06-17T14:00:00'));
      expect(newEvent.recurrence?.byWeekDays).toEqual([3]);
    });

    it('支持从本次及之后切换重复规则，例如 weekly → daily', () => {
      const result = applyRecurrenceEditScope({
        parentEvent,
        occurrenceDate: d('2026-06-15T09:00:00'),
        scope: 'following',
        changes: {
          title: '改成每天',
          recurrence: { frequency: 'daily' },
        },
      });

      const newEvent = result[1];
      expect(newEvent.title).toBe('改成每天');
      expect(newEvent.start).toEqual(d('2026-06-15T09:00:00'));
      expect(newEvent.recurrence).toEqual({
        frequency: 'daily',
        until: undefined,
        count: undefined,
      });
      expect(newEvent.recurringExceptions).toBeUndefined();
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

    it('允许通过 all scope 切换 recurrence 规则，并清空旧 exceptions', () => {
      const result = applyRecurrenceEditScope({
        parentEvent: {
          ...parentEvent,
          recurringExceptions: [{ date: '2026-06-08', overrides: { title: '单次' } }],
        },
        occurrenceDate: d('2026-06-08'),
        scope: 'all',
        changes: {
          recurrence: { frequency: 'daily' },
        } as Partial<EventObject>,
      });

      expect(result[0].recurrence).toEqual({ frequency: 'daily' });
      expect(result[0].recurringExceptions).toBeUndefined();
    });

    it('支持 all scope 在 daily / weekly / biweekly / none 之间切换', () => {
      const cases: Array<{
        label: string;
        recurrence: EventObject['recurrence'];
      }> = [
        { label: 'daily', recurrence: { frequency: 'daily' } },
        { label: 'weekly', recurrence: { frequency: 'weekly' } },
        { label: 'biweekly', recurrence: { frequency: 'weekly', interval: 2 } },
        { label: 'none', recurrence: undefined },
      ];

      for (const item of cases) {
        const result = applyRecurrenceEditScope({
          parentEvent,
          occurrenceDate: d('2026-06-08'),
          scope: 'all',
          changes: {
            title: item.label,
            recurrence: item.recurrence,
          },
        });

        expect(result[0].title).toBe(item.label);
        expect(result[0].recurrence).toEqual(item.recurrence);
      }
    });

    it('start/end 仅应用日内时间，保留父事件原始日期', () => {
      // 模拟：用户在周三实例上拖拽，changes.start 是周三的日期+新时间
      // 期望：父事件（周一）的日期不变，只更新时间
      const result = applyRecurrenceEditScope({
        parentEvent,
        occurrenceDate: d('2026-06-08'),
        scope: 'all',
        changes: {
          start: d('2026-06-08T14:00:00'), // 周三 14:00
          end: d('2026-06-08T14:30:00'), // 周三 14:30
        },
      });

      expect(result).toHaveLength(1);
      const updated = result[0];

      // 日期应保留父事件的周一 (06-01)，而非周三 (06-08)
      const updatedStart = new DayjsTZDate(updated.start);
      expect(updatedStart.getDate()).toBe(1); // 周一
      expect(updatedStart.getHours()).toBe(14); // 新时间
      expect(updatedStart.getMinutes()).toBe(0);

      const updatedEnd = new DayjsTZDate(updated.end);
      expect(updatedEnd.getDate()).toBe(1);
      expect(updatedEnd.getHours()).toBe(14);
      expect(updatedEnd.getMinutes()).toBe(30);
    });
  });
});
