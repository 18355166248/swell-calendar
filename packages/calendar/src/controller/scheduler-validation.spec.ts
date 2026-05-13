import { describe, expect, it, vi } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObjectWithDefaultValues } from '@/types/events.type';
import { Options } from '@/types/options.type';

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

describe('scheduler validation', () => {
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

  it('应该在 scheduler 创建命中 invalid 时触发 onEventCreateFailed', () => {
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
          invalid: [
            {
              start: new DayjsTZDate('2026-05-07T10:00:00'),
              end: new DayjsTZDate('2026-05-07T11:00:00'),
              resourceId: 'room-a',
            },
          ],
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
      reason: 'invalid',
      action: 'create',
      event,
      previousEvent: undefined,
    });
  });

  it('应该在 scheduler 更新命中 invalid 时触发 onEventUpdateFailed', () => {
    const callbacks = {
      onEventUpdateFailed: vi.fn(),
    };
    const previousEvent = createPreviousEvent({ resourceId: 'room-a' });
    const event = {
      ...previousEvent,
      start: new DayjsTZDate('2026-05-07T10:15:00'),
      end: new DayjsTZDate('2026-05-07T10:45:00'),
    };

    const accepted = shouldAcceptEventChange(
      {
        scheduler: {
          invalid: [
            {
              start: new DayjsTZDate('2026-05-07T10:00:00'),
              end: new DayjsTZDate('2026-05-07T11:00:00'),
              resourceId: 'room-a',
            },
          ],
        },
      },
      callbacks,
      {
        action: 'move',
        view: 'scheduler',
        event,
        previousEvent,
      }
    );

    expect(accepted).toBe(false);
    expect(callbacks.onEventUpdateFailed).toHaveBeenCalledWith({
      reason: 'invalid',
      action: 'move',
      event,
      previousEvent,
    });
  });
});
