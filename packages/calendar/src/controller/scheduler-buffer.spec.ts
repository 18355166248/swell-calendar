import { describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';

import { shouldAcceptEventChange } from './scheduler.controller';

describe('scheduler buffer validation', () => {
  it('bufferAfter 应扩展冲突检测范围（在 buffer 内应被拒绝）', () => {
    // existing: 10:00–10:30, bufferAfter=30min → 保护到 11:00
    // event: 10:45–11:15 → 落在 buffer 内，应拒绝
    const accepted = shouldAcceptEventChange({ scheduler: { eventOverlap: false } }, null, {
      action: 'create',
      view: 'scheduler',
      event: {
        start: new DayjsTZDate('2026-05-07T10:45:00'),
        end: new DayjsTZDate('2026-05-07T11:15:00'),
        resourceId: 'room-a',
      },
      existingEvents: [
        {
          start: new DayjsTZDate('2026-05-07T10:00:00'),
          end: new DayjsTZDate('2026-05-07T10:30:00'),
          resourceId: 'room-a',
          bufferAfter: 30,
        },
      ],
    });

    expect(accepted).toBe(false);
  });

  it('bufferAfter 边界：恰好在 buffer 结束时应允许', () => {
    // existing: 10:00–10:30, bufferAfter=30min → 保护到 11:00
    // event: 11:00–11:30 → 恰好不重叠，应允许
    const accepted = shouldAcceptEventChange({ scheduler: { eventOverlap: false } }, null, {
      action: 'create',
      view: 'scheduler',
      event: {
        start: new DayjsTZDate('2026-05-07T11:00:00'),
        end: new DayjsTZDate('2026-05-07T11:30:00'),
        resourceId: 'room-a',
      },
      existingEvents: [
        {
          start: new DayjsTZDate('2026-05-07T10:00:00'),
          end: new DayjsTZDate('2026-05-07T10:30:00'),
          resourceId: 'room-a',
          bufferAfter: 30,
        },
      ],
    });

    expect(accepted).toBe(true);
  });

  it('bufferBefore 应扩展冲突检测范围（在 buffer 内应被拒绝）', () => {
    // existing: 10:30–11:00, bufferBefore=30min → 保护从 10:00 开始
    // event: 09:45–10:15 → 落在 buffer 内，应拒绝
    const accepted = shouldAcceptEventChange({ scheduler: { eventOverlap: false } }, null, {
      action: 'create',
      view: 'scheduler',
      event: {
        start: new DayjsTZDate('2026-05-07T09:45:00'),
        end: new DayjsTZDate('2026-05-07T10:15:00'),
        resourceId: 'room-a',
      },
      existingEvents: [
        {
          start: new DayjsTZDate('2026-05-07T10:30:00'),
          end: new DayjsTZDate('2026-05-07T11:00:00'),
          resourceId: 'room-a',
          bufferBefore: 30,
        },
      ],
    });

    expect(accepted).toBe(false);
  });

  it('移动事件自身的 bufferAfter 也参与判定', () => {
    // event: 10:30–11:00, bufferAfter=30min → 尾部保护到 11:30
    // existing: 11:15–11:45 → 落在 buffer 内，应拒绝
    const accepted = shouldAcceptEventChange({ scheduler: { eventOverlap: false } }, null, {
      action: 'create',
      view: 'scheduler',
      event: {
        start: new DayjsTZDate('2026-05-07T10:30:00'),
        end: new DayjsTZDate('2026-05-07T11:00:00'),
        resourceId: 'room-a',
        bufferAfter: 30,
      },
      existingEvents: [
        {
          start: new DayjsTZDate('2026-05-07T11:15:00'),
          end: new DayjsTZDate('2026-05-07T11:45:00'),
          resourceId: 'room-a',
        },
      ],
    });

    expect(accepted).toBe(false);
  });

  it('无 buffer 时行为与原来相同', () => {
    const accepted = shouldAcceptEventChange({ scheduler: { eventOverlap: false } }, null, {
      action: 'create',
      view: 'scheduler',
      event: {
        start: new DayjsTZDate('2026-05-07T10:30:00'),
        end: new DayjsTZDate('2026-05-07T11:00:00'),
        resourceId: 'room-a',
      },
      existingEvents: [
        {
          start: new DayjsTZDate('2026-05-07T10:00:00'),
          end: new DayjsTZDate('2026-05-07T10:30:00'),
          resourceId: 'room-a',
        },
      ],
    });

    expect(accepted).toBe(true);
  });
});
