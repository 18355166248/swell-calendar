import { describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { TimeGridData } from '@/types/grid.type';
import { Options } from '@/types/options.type';

import { getBlockedTimeLayoutsForColumn, isBlockedEventChange } from './scheduler.controller';

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
});
