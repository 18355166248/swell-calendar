import { describe, expect, it, vi } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObjectWithDefaultValues } from '@/types/events.type';

import { shouldAcceptEventChange } from './scheduler.controller';

function createPreviousEvent(
  event: Partial<EventObjectWithDefaultValues> = {}
): EventObjectWithDefaultValues {
  return {
    id: 'event-a',
    calendarId: 'calendar-a',
    title: 'Event A',
    start: new DayjsTZDate('2026-05-07T10:00:00'),
    end: new DayjsTZDate('2026-05-07T10:30:00'),
    isAllday: false,
    category: 'time',
    isVisible: true,
    isReadOnly: false,
    editable: true,
    draggable: true,
    resizable: true,
    goingDuration: 0,
    comingDuration: 0,
    raw: null,
    __cid: 1,
    ...event,
  };
}

describe('scheduler overlap validation', () => {
  it('应该在 scheduler eventOverlap 关闭时拒绝创建重叠事件', () => {
    const callbacks = {
      onEventCreateFailed: vi.fn(),
    };
    const event = {
      start: new DayjsTZDate('2026-05-07T10:15:00'),
      end: new DayjsTZDate('2026-05-07T10:45:00'),
      resourceId: 'room-a',
    };

    const accepted = shouldAcceptEventChange(
      {
        scheduler: {
          eventOverlap: false,
        },
      },
      callbacks,
      {
        action: 'create',
        view: 'scheduler',
        event,
        existingEvents: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T10:30:00'),
            resourceId: 'room-a',
          },
        ],
      }
    );

    expect(accepted).toBe(false);
    expect(callbacks.onEventCreateFailed).toHaveBeenCalledWith({
      reason: 'overlap',
      action: 'create',
      event,
      previousEvent: undefined,
    });
  });

  it('应该在 scheduler eventOverlap 关闭时允许不同资源同时间事件', () => {
    const accepted = shouldAcceptEventChange(
      {
        scheduler: {
          eventOverlap: false,
        },
      },
      null,
      {
        action: 'create',
        view: 'scheduler',
        event: {
          start: new DayjsTZDate('2026-05-07T10:15:00'),
          end: new DayjsTZDate('2026-05-07T10:45:00'),
          resourceId: 'room-a',
        },
        existingEvents: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T10:30:00'),
            resourceId: 'room-b',
          },
        ],
      }
    );

    expect(accepted).toBe(true);
  });

  it('应该在 scheduler eventOverlap 关闭时忽略正在更新的原事件', () => {
    const previousEvent = createPreviousEvent({
      start: new DayjsTZDate('2026-05-07T10:00:00'),
      end: new DayjsTZDate('2026-05-07T10:30:00'),
      resourceId: 'room-a',
    });

    const accepted = shouldAcceptEventChange(
      {
        scheduler: {
          eventOverlap: false,
        },
      },
      null,
      {
        action: 'move',
        view: 'scheduler',
        event: {
          ...previousEvent,
          start: new DayjsTZDate('2026-05-07T10:15:00'),
          end: new DayjsTZDate('2026-05-07T10:45:00'),
        },
        previousEvent,
        existingEvents: [previousEvent],
      }
    );

    expect(accepted).toBe(true);
  });
});
