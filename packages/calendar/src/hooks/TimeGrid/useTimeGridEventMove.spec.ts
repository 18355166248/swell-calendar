import { describe, expect, it } from 'vitest';

import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CommonGridColumn, TimeGridData } from '@/types/grid.type';

import { getMovingEventLayout } from './useTimeGridEventMove';

const rows: TimeGridData['rows'] = [
  { top: 0, height: 25, startTime: '08:00', endTime: '08:30' },
  { top: 25, height: 25, startTime: '08:30', endTime: '09:00' },
  { top: 50, height: 25, startTime: '09:00', endTime: '09:30' },
  { top: 75, height: 25, startTime: '09:30', endTime: '10:00' },
];

const targetColumn: CommonGridColumn = {
  date: new DayjsTZDate('2026-05-12T00:00:00'),
  left: 40,
  width: 10,
  resourceId: 'r2',
};

const sameDateResourceColumn: CommonGridColumn = {
  date: new DayjsTZDate('2026-05-11T00:00:00'),
  left: 10,
  width: 10,
  resourceId: 'r2',
};

describe('useTimeGridEventMove', () => {
  it('spans the full target scheduler column while dragging (mobiscroll parity)', () => {
    const uiModel = new EventUIModel(
      new EventModel({
        id: 'event-a',
        title: 'Event A',
        category: 'time',
        start: new Date('2026-05-11T08:00:00'),
        end: new Date('2026-05-11T09:00:00'),
      })
    );

    uiModel.setUIProps({
      top: 0,
      left: 50,
      width: 50,
      height: 50,
    });

    const layout = getMovingEventLayout({
      draggingEvent: uiModel,
      dateDiff: 1,
      rowDiff: 0,
      timeGridDataRows: rows,
      targetColumn,
    });

    // 跟手影子铺满整列：忽略原卡片的窄分栏宽度(width:50)/偏移(left:50)，
    // 直接贴合目标列 left:40 / width:10
    expect(layout).toMatchObject({
      left: 40,
      width: 10,
      top: 0,
      height: 50,
    });
  });

  it('does not shift time when moving between scheduler resources on the same date', () => {
    const uiModel = new EventUIModel(
      new EventModel({
        id: 'event-resource',
        title: 'Resource move',
        category: 'time',
        start: new Date('2026-05-11T08:00:00'),
        end: new Date('2026-05-11T09:00:00'),
      })
    );

    uiModel.setUIProps({
      top: 0,
      left: 0,
      width: 100,
      height: 50,
    });

    const layout = getMovingEventLayout({
      draggingEvent: uiModel,
      dateDiff: 0,
      rowDiff: 0,
      timeGridDataRows: rows,
      targetColumn: sameDateResourceColumn,
    });

    expect(layout).toMatchObject({
      left: 10,
      width: 10,
      top: 0,
      height: 50,
    });
  });

  it('uses exact visible time bounds when moving to the last row', () => {
    const uiModel = new EventUIModel(
      new EventModel({
        id: 'event-b',
        title: 'Event B',
        category: 'time',
        start: new Date('2026-05-12T09:00:00'),
        end: new Date('2026-05-12T10:00:00'),
      })
    );

    uiModel.setUIProps({
      top: 50,
      left: 0,
      width: 100,
      height: 50,
    });

    const layout = getMovingEventLayout({
      draggingEvent: uiModel,
      dateDiff: 0,
      rowDiff: 0,
      timeGridDataRows: rows,
      targetColumn,
    });

    expect(layout.top).toBe(50);
    expect(layout.height).toBe(50);
  });
});
