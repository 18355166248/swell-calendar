import { describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { GridPosition } from '@/types/grid.type';
import { TimeGridData } from '@/types/grid.type';
import { Options } from '@/types/options.type';

import { resolveExternalDrop } from './scheduler.controller';

/* -------------------------------------------------------------------------- */
/* 共享测试数据                                                                */
/* -------------------------------------------------------------------------- */

const timeGridData: TimeGridData = {
  rows: [
    { top: 0, height: 50, startTime: '09:00', endTime: '10:00' },
    { top: 50, height: 50, startTime: '10:00', endTime: '11:00' },
  ],
  columns: [
    {
      date: new DayjsTZDate('2026-06-08T00:00:00'),
      left: 0,
      width: 100,
      resourceId: 'room-a',
      resourceName: '会议室 A',
    },
    {
      date: new DayjsTZDate('2026-06-08T00:00:00'),
      left: 100,
      width: 100,
      resourceId: 'room-b',
      resourceName: '会议室 B',
    },
  ],
};

// 固定返回某个列/行的位置查找器
function fixedFinder(position: GridPosition) {
  return () => position;
}

function createOptions(overrides?: Options['scheduler']): Options {
  return {
    scheduler: {
      allowExternalDrop: true,
      invalid: [],
      ...overrides,
    },
  };
}

describe('resolveExternalDrop', () => {
  it('校验通过时返回 allowed 与完整 info（含 data 透传）', () => {
    const data = { taskId: 'abc', title: '需求评审' };

    const result = resolveExternalDrop({
      position: { clientX: 20, clientY: 20 },
      gridPositionFinder: fixedFinder({ columnIndex: 0, rowIndex: 0 }),
      timeGridData,
      options: createOptions(),
      data,
    });

    expect(result.result).toBe('allowed');
    if (result.result !== 'allowed') {
      return;
    }

    expect(result.info).toMatchObject({
      resourceId: 'room-a',
      resourceName: '会议室 A',
      data,
    });
    expect(result.info.dataTransfer).toBeUndefined();
    expect(result.info.start.getHours()).toBe(9);
    expect(result.info.end.getHours()).toBe(10);
    expect(result.preview).toMatchObject({ source: 'external', status: 'allowed' });
  });

  it('HTML5 路径透传 dataTransfer 且不带 data', () => {
    const dataTransfer = { getData: () => '' } as unknown as DataTransfer;

    const result = resolveExternalDrop({
      position: { clientX: 20, clientY: 20 },
      gridPositionFinder: fixedFinder({ columnIndex: 0, rowIndex: 0 }),
      timeGridData,
      options: createOptions(),
      dataTransfer,
    });

    expect(result.result).toBe('allowed');
    if (result.result !== 'allowed') {
      return;
    }
    expect(result.info.dataTransfer).toBe(dataTransfer);
    expect(result.info.data).toBeUndefined();
  });

  it('位置无法解析时返回 rejected 且无 rejection', () => {
    const result = resolveExternalDrop({
      position: { clientX: -1, clientY: -1 },
      gridPositionFinder: () => null,
      timeGridData,
      options: createOptions(),
    });

    expect(result).toEqual({ result: 'rejected' });
  });

  it('资源级 allowExternalDrop=false 时返回 policy 拒绝', () => {
    const result = resolveExternalDrop({
      position: { clientX: 120, clientY: 20 },
      gridPositionFinder: fixedFinder({ columnIndex: 1, rowIndex: 0 }),
      timeGridData,
      options: createOptions({
        allowExternalDrop: true,
        invalid: [],
        resources: [
          { id: 'room-a', name: '会议室 A' },
          { id: 'room-b', name: '会议室 B', allowExternalDrop: false },
        ],
      }),
      data: { taskId: 'abc' },
    });

    expect(result.result).toBe('rejected');
    if (result.result !== 'rejected') {
      return;
    }
    expect(result.rejection).toMatchObject({
      reason: 'policy',
      policySource: 'resource',
      resourceId: 'room-b',
      data: { taskId: 'abc' },
    });
    expect(result.preview).toMatchObject({ source: 'external', status: 'policy' });
  });

  it('命中 invalid 区间时返回 invalid 拒绝', () => {
    const result = resolveExternalDrop({
      position: { clientX: 20, clientY: 20 },
      gridPositionFinder: fixedFinder({ columnIndex: 0, rowIndex: 0 }),
      timeGridData,
      options: createOptions({
        allowExternalDrop: true,
        invalid: [
          {
            start: new DayjsTZDate('2026-06-08T09:00:00'),
            end: new DayjsTZDate('2026-06-08T10:00:00'),
            resourceId: 'room-a',
          },
        ],
      }),
    });

    expect(result.result).toBe('rejected');
    if (result.result !== 'rejected') {
      return;
    }
    expect(result.rejection).toMatchObject({ reason: 'invalid', resourceId: 'room-a' });
    expect(result.preview).toMatchObject({ source: 'external', status: 'invalid' });
  });
});
