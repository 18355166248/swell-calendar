import { describe, expect, it, vi } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObjectWithDefaultValues } from '@/types/events.type';
import { TimeGridData } from '@/types/grid.type';
import { Options } from '@/types/options.type';

import {
  getBlockedTimeLayoutsForColumn,
  isBlockedEventChange,
  shouldAcceptEventChange,
} from './scheduler.controller';

const timeGridData: TimeGridData = {
  rows: [
    { top: 0, height: 25, startTime: '09:00', endTime: '10:00' },
    { top: 25, height: 25, startTime: '10:00', endTime: '11:00' },
    { top: 50, height: 25, startTime: '11:00', endTime: '12:00' },
    { top: 75, height: 25, startTime: '12:00', endTime: '13:00' },
  ],
  columns: [
    {
      date: new DayjsTZDate('2026-05-07T00:00:00'),
      left: 0,
      width: 100,
      resourceId: 'room-a',
      resourceName: '会议室 A',
    },
  ],
};

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

describe('scheduler.controller', () => {
  it('应该优先使用 invalid 做 blocked 校验', () => {
    const options: Options = {
      scheduler: {
        invalid: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T11:00:00'),
            resourceId: 'room-a',
          },
        ],
      },
    };

    const blocked = isBlockedEventChange(options, 'scheduler', {
      start: new DayjsTZDate('2026-05-07T10:15:00'),
      end: new DayjsTZDate('2026-05-07T10:45:00'),
      resourceId: 'room-a',
      resourceIds: ['room-a'],
    });

    expect(blocked).toBe(true);
  });

  it('应该为指定资源列生成 blocked layout', () => {
    const options: Options = {
      scheduler: {
        invalid: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T12:00:00'),
            resourceId: 'room-a',
          },
        ],
      },
    };

    const layouts = getBlockedTimeLayoutsForColumn(
      options,
      'scheduler',
      timeGridData,
      timeGridData.columns[0]
    );

    expect(layouts).toHaveLength(1);
    expect(layouts[0]).toEqual({
      top: 25,
      height: 50,
    });
  });

  it('应该在 scheduler dragToCreate 关闭时拒绝创建事件', () => {
    const options: Options = {
      scheduler: {
        dragToCreate: false,
      },
    };

    const accepted = shouldAcceptEventChange(options, null, {
      action: 'create',
      view: 'scheduler',
      event: {
        start: new DayjsTZDate('2026-05-07T10:00:00'),
        end: new DayjsTZDate('2026-05-07T10:30:00'),
      },
    });

    expect(accepted).toBe(false);
  });

  it('应该在 scheduler dragToMove 关闭时拒绝移动事件', () => {
    const options: Options = {
      scheduler: {
        dragToMove: false,
      },
    };

    const previousEvent = createPreviousEvent();

    const accepted = shouldAcceptEventChange(options, null, {
      action: 'move',
      view: 'scheduler',
      event: {
        ...previousEvent,
        start: new DayjsTZDate('2026-05-07T11:00:00'),
        end: new DayjsTZDate('2026-05-07T11:30:00'),
      },
      previousEvent,
    });

    expect(accepted).toBe(false);
  });

  it('应该在 scheduler dragToResize 关闭时拒绝调整事件时长', () => {
    const options: Options = {
      scheduler: {
        dragToResize: false,
      },
    };

    const previousEvent = createPreviousEvent();

    const accepted = shouldAcceptEventChange(options, null, {
      action: 'resize',
      view: 'scheduler',
      event: {
        ...previousEvent,
        end: new DayjsTZDate('2026-05-07T11:00:00'),
      },
      previousEvent,
    });

    expect(accepted).toBe(false);
  });

  it('应该在 scheduler dragInTime 关闭时拒绝时间变化', () => {
    const options: Options = {
      scheduler: {
        dragInTime: false,
      },
    };

    const previousEvent = createPreviousEvent();

    const accepted = shouldAcceptEventChange(options, null, {
      action: 'move',
      view: 'scheduler',
      event: {
        ...previousEvent,
        start: new DayjsTZDate('2026-05-07T10:30:00'),
        end: new DayjsTZDate('2026-05-07T11:00:00'),
      },
      previousEvent,
    });

    expect(accepted).toBe(false);
  });

  it('应该在 scheduler 事件 editable 关闭时拒绝移动和调整', () => {
    const previousEvent = createPreviousEvent({ editable: false });

    const moveAccepted = shouldAcceptEventChange({}, null, {
      action: 'move',
      view: 'scheduler',
      event: {
        ...previousEvent,
        start: new DayjsTZDate('2026-05-07T11:00:00'),
        end: new DayjsTZDate('2026-05-07T11:30:00'),
      },
      previousEvent,
    });

    const resizeAccepted = shouldAcceptEventChange({}, null, {
      action: 'resize',
      view: 'scheduler',
      event: {
        ...previousEvent,
        end: new DayjsTZDate('2026-05-07T11:00:00'),
      },
      previousEvent,
    });

    expect(moveAccepted).toBe(false);
    expect(resizeAccepted).toBe(false);
  });

  it('应该在 scheduler 事件 draggable 关闭时拒绝移动事件', () => {
    const previousEvent = createPreviousEvent({ draggable: false });

    const accepted = shouldAcceptEventChange({}, null, {
      action: 'move',
      view: 'scheduler',
      event: {
        ...previousEvent,
        start: new DayjsTZDate('2026-05-07T11:00:00'),
        end: new DayjsTZDate('2026-05-07T11:30:00'),
      },
      previousEvent,
    });

    expect(accepted).toBe(false);
  });

  it('应该在 scheduler 事件 resizable 关闭时拒绝调整事件时长', () => {
    const previousEvent = createPreviousEvent({ resizable: false });

    const accepted = shouldAcceptEventChange({}, null, {
      action: 'resize',
      view: 'scheduler',
      event: {
        ...previousEvent,
        end: new DayjsTZDate('2026-05-07T11:00:00'),
      },
      previousEvent,
    });

    expect(accepted).toBe(false);
  });

  it('应该在 scheduler 创建被 view policy 拒绝时触发 onEventCreateFailed', () => {
    const callbacks = {
      onEventCreateFailed: vi.fn(),
    };
    const event = {
      start: new DayjsTZDate('2026-05-07T10:00:00'),
      end: new DayjsTZDate('2026-05-07T10:30:00'),
    };

    const accepted = shouldAcceptEventChange(
      {
        scheduler: {
          dragToCreate: false,
        },
      },
      callbacks,
      {
        action: 'create',
        view: 'scheduler',
        event,
      }
    );

    expect(accepted).toBe(false);
    expect(callbacks.onEventCreateFailed).toHaveBeenCalledWith({
      reason: 'policy',
      policySource: 'view',
      action: 'create',
      event,
      previousEvent: undefined,
    });
  });

  it('应该在 scheduler 更新被 event policy 拒绝时触发 onEventUpdateFailed', () => {
    const callbacks = {
      onEventUpdateFailed: vi.fn(),
    };
    const previousEvent = createPreviousEvent({ draggable: false });
    const event = {
      ...previousEvent,
      start: new DayjsTZDate('2026-05-07T11:00:00'),
      end: new DayjsTZDate('2026-05-07T11:30:00'),
    };

    const accepted = shouldAcceptEventChange({}, callbacks, {
      action: 'move',
      view: 'scheduler',
      event,
      previousEvent,
    });

    expect(accepted).toBe(false);
    expect(callbacks.onEventUpdateFailed).toHaveBeenCalledWith({
      reason: 'policy',
      policySource: 'event',
      action: 'move',
      event,
      previousEvent,
    });
  });
});
