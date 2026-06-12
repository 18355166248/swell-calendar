/* eslint-disable max-lines */
import { describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { TimeGridData } from '@/types/grid.type';
import { GridSelectionData } from '@/types/gridSelection.type';
import { Options } from '@/types/options.type';

import { createPreviousEvent } from './__test-helpers__/createPreviousEvent';
import {
  createEventFromTimeGridSelection,
  createRangeSelectionInfo,
  createUpdatedTimeGridEvent,
  getBlockedTimeLayoutsForColumn,
  isBlockedEventChange,
} from './scheduler.controller';

/* -------------------------------------------------------------------------- */
/* 共享测试数据                                                                */
/* -------------------------------------------------------------------------- */

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
    {
      date: new DayjsTZDate('2026-05-08T00:00:00'),
      left: 100,
      width: 100,
      resourceId: 'room-b',
      resourceName: '会议室 B',
    },
    {
      date: new DayjsTZDate('2026-05-08T00:00:00'),
      left: 200,
      width: 100,
      resourceId: 'room-a',
      resourceName: '会议室 A',
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* isBlockedEventChange                                                       */
/* -------------------------------------------------------------------------- */

describe('isBlockedEventChange', () => {
  it('应在 event 落在 scheduler invalid 范围内时拒绝', () => {
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
    });

    expect(blocked).toBe(true);
  });

  it('应在 event 完全在 invalid 范围外时允许', () => {
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
      start: new DayjsTZDate('2026-05-07T09:00:00'),
      end: new DayjsTZDate('2026-05-07T09:30:00'),
      resourceId: 'room-a',
    });

    expect(blocked).toBe(false);
  });

  it('应在 resource 不匹配时允许', () => {
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
      resourceId: 'room-b',
    });

    expect(blocked).toBe(false);
  });

  it('应在 event 通过 resourceIds 匹配时拒绝', () => {
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
      resourceIds: ['room-a', 'room-b'],
    });

    expect(blocked).toBe(true);
  });

  it('应支持全局 blockedTime（无 resourceId）匹配所有资源', () => {
    const options: Options = {
      scheduler: {
        blockedTimes: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T11:00:00'),
          },
        ],
      },
    };

    const blocked = isBlockedEventChange(options, 'scheduler', {
      start: new DayjsTZDate('2026-05-07T10:15:00'),
      end: new DayjsTZDate('2026-05-07T10:45:00'),
      resourceId: 'any-resource',
    });

    expect(blocked).toBe(true);
  });

  it('应优先使用 scheduler.invalid 而非 scheduler.blockedTimes', () => {
    const options: Options = {
      scheduler: {
        invalid: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T11:00:00'),
            resourceId: 'room-a',
          },
        ],
        blockedTimes: [
          {
            start: new DayjsTZDate('2026-05-07T09:00:00'),
            end: new DayjsTZDate('2026-05-07T10:00:00'),
            resourceId: 'room-a',
          },
        ],
      },
    };

    // event 在 invalid 内，不在 blockedTimes 内
    const blocked = isBlockedEventChange(options, 'scheduler', {
      start: new DayjsTZDate('2026-05-07T10:15:00'),
      end: new DayjsTZDate('2026-05-07T10:45:00'),
      resourceId: 'room-a',
    });

    expect(blocked).toBe(true);
  });

  it('应在没有 blockedTimes 时允许', () => {
    const options: Options = {};

    const blocked = isBlockedEventChange(options, 'scheduler', {
      start: new DayjsTZDate('2026-05-07T10:15:00'),
      end: new DayjsTZDate('2026-05-07T10:45:00'),
      resourceId: 'room-a',
    });

    expect(blocked).toBe(false);
  });

  it('应支持 timeline 视图', () => {
    const options: Options = {
      timeline: {
        invalid: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T11:00:00'),
          },
        ],
      },
    };

    const blocked = isBlockedEventChange(options, 'timeline', {
      start: new DayjsTZDate('2026-05-07T10:15:00'),
      end: new DayjsTZDate('2026-05-07T10:45:00'),
    });

    expect(blocked).toBe(true);
  });

  it('应支持 week 视图的 invalid 配置', () => {
    const options: Options = {
      week: {
        invalid: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T11:00:00'),
          },
        ],
      },
    };

    const blocked = isBlockedEventChange(options, 'week', {
      start: new DayjsTZDate('2026-05-07T10:15:00'),
      end: new DayjsTZDate('2026-05-07T10:45:00'),
    });

    expect(blocked).toBe(true);
  });

  it('应支持 day 视图的 blockedTimes 配置', () => {
    const options: Options = {
      week: {
        blockedTimes: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T11:00:00'),
          },
        ],
      },
    };

    const blocked = isBlockedEventChange(options, 'day', {
      start: new DayjsTZDate('2026-05-07T10:15:00'),
      end: new DayjsTZDate('2026-05-07T10:45:00'),
    });

    expect(blocked).toBe(true);
  });

  it('应在 blockedTime 通过 resourceIds 指定多资源时匹配', () => {
    const options: Options = {
      scheduler: {
        invalid: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T11:00:00'),
            resourceIds: ['room-a', 'room-b'],
          },
        ],
      },
    };

    const blocked = isBlockedEventChange(options, 'scheduler', {
      start: new DayjsTZDate('2026-05-07T10:15:00'),
      end: new DayjsTZDate('2026-05-07T10:45:00'),
      resourceId: 'room-b',
    });

    expect(blocked).toBe(true);
  });

  it('应处理事件仅与 blockedTime 部分重叠（边界接触不重叠）', () => {
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

    // 恰好在 blocked 结束后开始，不重叠
    const blocked = isBlockedEventChange(options, 'scheduler', {
      start: new DayjsTZDate('2026-05-07T11:00:00'),
      end: new DayjsTZDate('2026-05-07T11:30:00'),
      resourceId: 'room-a',
    });

    expect(blocked).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* getBlockedTimeLayoutsForColumn                                             */
/* -------------------------------------------------------------------------- */

describe('getBlockedTimeLayoutsForColumn', () => {
  it('应在 blockedTime 完全在可见区域内时返回正确布局', () => {
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
    expect(layouts[0]).toEqual({ top: 25, height: 50 });
  });

  it('应在 blockedTime 和可见区域无交集时返回空', () => {
    const options: Options = {
      scheduler: {
        invalid: [
          {
            start: new DayjsTZDate('2026-05-07T05:00:00'),
            end: new DayjsTZDate('2026-05-07T06:00:00'),
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

    expect(layouts).toHaveLength(0);
  });

  it('应在 blockedTime 无 resourceId 时应用于所有列（全局 blocked）', () => {
    const options: Options = {
      scheduler: {
        invalid: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T12:00:00'),
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
    expect(layouts[0]).toEqual({ top: 25, height: 50 });
  });

  it('应在 blockedTime resourceId 不匹配时返回空', () => {
    const options: Options = {
      scheduler: {
        invalid: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T12:00:00'),
            resourceId: 'room-c',
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

    expect(layouts).toHaveLength(0);
  });

  it('应在没有 blockedTimes 时返回空数组', () => {
    const options: Options = {};

    const layouts = getBlockedTimeLayoutsForColumn(
      options,
      'scheduler',
      timeGridData,
      timeGridData.columns[0]
    );

    expect(layouts).toHaveLength(0);
  });

  it('应裁剪部分在可见区域外的 blockedTime', () => {
    const options: Options = {
      scheduler: {
        invalid: [
          {
            // 开始时间在可见区域之前，结束在可见区域内
            start: new DayjsTZDate('2026-05-07T08:00:00'),
            end: new DayjsTZDate('2026-05-07T10:30:00'),
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
    // 从 09:00 开始可见，到 10:30，占 1.5 小时 / 4 小时总量 = 37.5%
    expect(layouts[0]).toEqual({ top: 0, height: 37.5 });
  });

  it('应支持 blockedTime 通过 resourceIds 匹配列', () => {
    const options: Options = {
      scheduler: {
        invalid: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T12:00:00'),
            resourceIds: ['room-a', 'room-c'],
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
  });

  it('应在列没有 resourceId 时也应用全局 blockedTime', () => {
    const colWithoutResource = {
      date: new DayjsTZDate('2026-05-07T00:00:00'),
      left: 0,
      width: 100,
    };
    const options: Options = {
      scheduler: {
        invalid: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T12:00:00'),
          },
        ],
      },
    };

    const layouts = getBlockedTimeLayoutsForColumn(
      options,
      'scheduler',
      timeGridData,
      colWithoutResource
    );

    expect(layouts).toHaveLength(1);
  });
});

/* -------------------------------------------------------------------------- */
/* createEventFromTimeGridSelection                                           */
/* -------------------------------------------------------------------------- */

describe('createEventFromTimeGridSelection', () => {
  const selection: GridSelectionData = {
    startColumnIndex: 0,
    endColumnIndex: 0,
    startRowIndex: 1,
    endRowIndex: 2,
  };

  it('应根据选择区域创建事件对象', () => {
    const event = createEventFromTimeGridSelection(timeGridData, selection);

    expect(event.title).toBe('');
    expect(event.category).toBe('time');
    expect(event.allDay).toBe(false);
    expect(event.resourceId).toBe('room-a');
    expect(event.resourceIds).toEqual(['room-a']);
  });

  it('应正确设置 start 和 end（基于行列）', () => {
    const event = createEventFromTimeGridSelection(timeGridData, selection);

    // startColumnIndex=0 (2026-05-07), startRowIndex=1 (10:00)
    // endColumnIndex=0 (2026-05-07), endRowIndex=2 (12:00)
    expect((event.start as DayjsTZDate).getTime()).toBe(
      new DayjsTZDate('2026-05-07T10:00:00').getTime()
    );
    expect((event.end as DayjsTZDate).getTime()).toBe(
      new DayjsTZDate('2026-05-07T12:00:00').getTime()
    );
  });

  it('应在跨列选择时不设置单一 resourceId', () => {
    const crossColumnSelection: GridSelectionData = {
      startColumnIndex: 0,
      endColumnIndex: 1,
      startRowIndex: 0,
      endRowIndex: 0,
    };

    const event = createEventFromTimeGridSelection(timeGridData, crossColumnSelection);

    // 跨列时 resourceIds 包含两个资源，resourceId 为 undefined
    expect(event.resourceId).toBeUndefined();
    expect(event.resourceIds).toEqual(['room-a', 'room-b']);
  });

  it('应在跨天选择时正确设置日期', () => {
    const crossDaySelection: GridSelectionData = {
      startColumnIndex: 0,
      endColumnIndex: 1,
      startRowIndex: 0,
      endRowIndex: 0,
    };

    const event = createEventFromTimeGridSelection(timeGridData, crossDaySelection);

    // start = column[0].date(2026-05-07) + row[0].startTime(09:00)
    // end = column[1].date(2026-05-08) + row[0].endTime(10:00)
    expect((event.start as DayjsTZDate).getTime()).toBe(
      new DayjsTZDate('2026-05-07T09:00:00').getTime()
    );
    expect((event.end as DayjsTZDate).getTime()).toBe(
      new DayjsTZDate('2026-05-08T10:00:00').getTime()
    );
  });

  it('应在同资源多列时正确去重 resourceIds', () => {
    // columns[1] 和 columns[2] 同一个资源 room-a，但 columns[0] 是 room-a
    // 选 column[0] 和 column[2]: 都 room-a
    const sameResourceSelection: GridSelectionData = {
      startColumnIndex: 0,
      endColumnIndex: 2,
      startRowIndex: 0,
      endRowIndex: 0,
    };

    const event = createEventFromTimeGridSelection(timeGridData, sameResourceSelection);

    // 只有 room-a 和 room-b（columns 1 是 room-b）
    expect(event.resourceIds).toContain('room-a');
    expect(event.resourceIds).toContain('room-b');
    expect(event.resourceIds?.length).toBe(2);
  });

  it('应在设置 allowedColumnIndices 时跳过中间不同资源的列（scheduler 跨天同资源拖拽）', () => {
    // col0=2026-05-07 room-a, col1=2026-05-08 room-b, col2=2026-05-08 room-a
    // 从 Day1 room-a 拖到 Day2 room-a，约束器跳过中间的 col1(room-b)
    const constrainedSelection: GridSelectionData = {
      startColumnIndex: 0,
      endColumnIndex: 2,
      startRowIndex: 0,
      endRowIndex: 0,
      allowedColumnIndices: [0, 2],
    };

    const event = createEventFromTimeGridSelection(timeGridData, constrainedSelection);

    // 中间的 room-b 被排除，事件只归属 room-a，且有单一主资源
    expect(event.resourceId).toBe('room-a');
    expect(event.resourceIds).toEqual(['room-a']);
    // 跨天日期仍以起止列为准
    expect((event.start as DayjsTZDate).getTime()).toBe(
      new DayjsTZDate('2026-05-07T09:00:00').getTime()
    );
    expect((event.end as DayjsTZDate).getTime()).toBe(
      new DayjsTZDate('2026-05-08T10:00:00').getTime()
    );
  });
});

/* -------------------------------------------------------------------------- */
/* createRangeSelectionInfo                                                   */
/* -------------------------------------------------------------------------- */

describe('createRangeSelectionInfo', () => {
  it('应返回包含视图和资源信息的范围选择信息', () => {
    const selection: GridSelectionData = {
      startColumnIndex: 0,
      endColumnIndex: 0,
      startRowIndex: 1,
      endRowIndex: 2,
    };

    const info = createRangeSelectionInfo(timeGridData, selection, 'scheduler');

    expect(info.view).toBe('scheduler');
    expect(info.resourceId).toBe('room-a');
    expect(info.resourceNames).toEqual(['会议室 A']);
    expect((info.start as DayjsTZDate).getTime()).toBe(
      new DayjsTZDate('2026-05-07T10:00:00').getTime()
    );
    expect((info.end as DayjsTZDate).getTime()).toBe(
      new DayjsTZDate('2026-05-07T12:00:00').getTime()
    );
  });

  it('应在跨资源选择时汇总所有资源名称', () => {
    const selection: GridSelectionData = {
      startColumnIndex: 0,
      endColumnIndex: 1,
      startRowIndex: 0,
      endRowIndex: 0,
    };

    const info = createRangeSelectionInfo(timeGridData, selection, 'scheduler');

    expect(info.resourceId).toBeUndefined();
    expect(info.resourceIds).toEqual(['room-a', 'room-b']);
    expect(info.resourceNames).toEqual(['会议室 A', '会议室 B']);
  });

  it('应在 allowedColumnIndices 约束下只汇总被允许列的资源名称', () => {
    // 跨天同资源拖拽：col0→col2 同为 room-a，中间 col1(room-b) 被跳过
    const selection: GridSelectionData = {
      startColumnIndex: 0,
      endColumnIndex: 2,
      startRowIndex: 0,
      endRowIndex: 0,
      allowedColumnIndices: [0, 2],
    };

    const info = createRangeSelectionInfo(timeGridData, selection, 'scheduler');

    expect(info.resourceId).toBe('room-a');
    expect(info.resourceIds).toEqual(['room-a']);
    expect(info.resourceNames).toEqual(['会议室 A']);
  });
});

/* -------------------------------------------------------------------------- */
/* createUpdatedTimeGridEvent                                                 */
/* -------------------------------------------------------------------------- */

describe('createUpdatedTimeGridEvent', () => {
  it('应基于前一个事件和新起止时间创建更新后的事件', () => {
    const previousEvent = createPreviousEvent({
      resourceId: 'room-a',
    });

    const nextStart = new DayjsTZDate('2026-05-07T11:00:00');
    const nextEnd = new DayjsTZDate('2026-05-07T12:00:00');

    const updated = createUpdatedTimeGridEvent(previousEvent, nextStart, nextEnd);

    expect(updated.id).toBe(previousEvent.id);
    expect(updated.resourceId).toBe('room-a');
    expect((updated.start as DayjsTZDate).getTime()).toBe(nextStart.getTime());
    expect((updated.end as DayjsTZDate).getTime()).toBe(nextEnd.getTime());
  });

  it('应在提供 targetColumn 时更新 resourceId', () => {
    const previousEvent = createPreviousEvent({
      resourceId: 'room-a',
    });

    const nextStart = new DayjsTZDate('2026-05-07T11:00:00');
    const nextEnd = new DayjsTZDate('2026-05-07T12:00:00');
    const targetColumn = {
      date: new DayjsTZDate('2026-05-08T00:00:00'),
      left: 100,
      width: 100,
      resourceId: 'room-b',
    };

    const updated = createUpdatedTimeGridEvent(previousEvent, nextStart, nextEnd, targetColumn);

    expect(updated.resourceId).toBe('room-b');
    expect(updated.resourceIds).toEqual(['room-b']);
  });

  it('应在 targetColumn 无 resourceId 时不更新 resourceId', () => {
    const previousEvent = createPreviousEvent({
      resourceId: 'room-a',
      resourceIds: ['room-a'],
    });

    const nextStart = new DayjsTZDate('2026-05-07T11:00:00');
    const nextEnd = new DayjsTZDate('2026-05-07T12:00:00');

    const updated = createUpdatedTimeGridEvent(previousEvent, nextStart, nextEnd);

    expect(updated.resourceId).toBe('room-a');
    expect(updated.resourceIds).toEqual(['room-a']);
  });

  it('应保留前一个事件的其他属性', () => {
    const previousEvent = createPreviousEvent({
      title: '原始标题',
      calendarId: 'cal-123',
      backgroundColor: '#ff0000',
    });

    const nextStart = new DayjsTZDate('2026-05-07T11:00:00');
    const nextEnd = new DayjsTZDate('2026-05-07T12:00:00');

    const updated = createUpdatedTimeGridEvent(previousEvent, nextStart, nextEnd);

    expect(updated.title).toBe('原始标题');
    expect(updated.calendarId).toBe('cal-123');
    expect(updated.backgroundColor).toBe('#ff0000');
  });
});
