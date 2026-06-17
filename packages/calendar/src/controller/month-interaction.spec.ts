import { describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject } from '@/types/events.type';

import {
  buildCreatedMonthEvent,
  computeMovedMonthEvent,
  computeMovePreviewRange,
  computeResizedMonthEvent,
  computeResizePreviewRange,
  getMonthColumnSpanStyle,
  getMonthGridPositionFromPoint,
  splitFlatRangeIntoWeekSegments,
} from './month-interaction';

describe('month-interaction', () => {
  describe('getMonthGridPositionFromPoint', () => {
    // 6 周 × 7 列，网格 700×600（每格 100×100）
    const base = { width: 700, height: 600, weekCount: 6, colCount: 7 };

    it('左上角第一格 → week 0 / col 0 / flatOffset 0', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: 10, offsetY: 10 });
      expect(pos).toEqual({ weekIndex: 0, colIndex: 0, flatOffset: 0 });
    });

    it('第 2 周第 3 列 → flatOffset = 1*7 + 2 = 9', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: 250, offsetY: 150 });
      expect(pos).toEqual({ weekIndex: 1, colIndex: 2, flatOffset: 9 });
    });

    it('越界坐标 clamp 到合法范围', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: 9999, offsetY: 9999 });
      expect(pos).toEqual({ weekIndex: 5, colIndex: 6, flatOffset: 41 });
    });

    it('负坐标 clamp 到 0', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: -50, offsetY: -50 });
      expect(pos).toEqual({ weekIndex: 0, colIndex: 0, flatOffset: 0 });
    });
  });

  describe('getMonthGridPositionFromPoint（narrowWeekend 不等列宽）', () => {
    // 周末列窄(10%)、工作日列宽(16%)，6 周 × 7 列，网格宽度=100（1px≈1%）
    const colWidths = [10, 16, 16, 16, 16, 16, 10];
    const base = { width: 100, height: 600, weekCount: 6, colCount: 7, colWidths };

    it('窄周末边界按累计列宽命中（等宽近似会误判到相邻列）', () => {
      // 列左界 [0,10,26,42,58,74,90]；offsetX=12 落在 Mon(col1)，等宽(14.28)会误判 col0
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: 12, offsetY: 10 });
      expect(pos).toEqual({ weekIndex: 0, colIndex: 1, flatOffset: 1 });
    });

    it('末尾工作日列命中 col5 而非窄周末 col6', () => {
      // offsetX=88 落在 Fri(74..90)，等宽(85.71)会误判 col6
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: 88, offsetY: 110 });
      expect(pos).toEqual({ weekIndex: 1, colIndex: 5, flatOffset: 12 });
    });

    it('最后一列窄周末命中 col6', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: 95, offsetY: 10 });
      expect(pos).toEqual({ weekIndex: 0, colIndex: 6, flatOffset: 6 });
    });

    it('colWidths 长度与列数不符时退回等宽命中', () => {
      const pos = getMonthGridPositionFromPoint({
        ...base,
        colWidths: [50, 50],
        offsetX: 88,
        offsetY: 10,
      });
      // 等宽：floor(88 / (100/7)) = 6
      expect(pos.colIndex).toBe(6);
    });
  });

  describe('getMonthColumnSpanStyle', () => {
    const colWidths = [10, 16, 16, 16, 16, 16, 10]; // 左界 [0,10,26,42,58,74,90]

    it('无 colWidths 时按 startCol/colCount 等宽计算', () => {
      const style = getMonthColumnSpanStyle({ startCol: 1, colspan: 2, colCount: 7 });
      expect(style.leftPercent).toBeCloseTo((1 / 7) * 100);
      expect(style.widthPercent).toBeCloseTo((2 / 7) * 100);
    });

    it('窄周末按累计列宽求 left/width', () => {
      // col0→col1：left=0，width=10+16=26
      const style = getMonthColumnSpanStyle({ startCol: 0, colspan: 2, colCount: 7, colWidths });
      expect(style.leftPercent).toBe(0);
      expect(style.widthPercent).toBe(26);
    });

    it('跨工作日与周末时累加各列实际宽度', () => {
      // col4 起跨 3 列(col4,5,6)：left=58，width=16+16+10=42
      const style = getMonthColumnSpanStyle({ startCol: 4, colspan: 3, colCount: 7, colWidths });
      expect(style.leftPercent).toBe(58);
      expect(style.widthPercent).toBe(42);
    });

    it('越界跨度夹紧到末列', () => {
      const style = getMonthColumnSpanStyle({ startCol: 6, colspan: 5, colCount: 7, colWidths });
      expect(style.leftPercent).toBe(90);
      expect(style.widthPercent).toBe(10);
    });
  });

  describe('computeMovedMonthEvent', () => {
    const prev: EventObject = {
      id: '1',
      calendarId: 'c1',
      title: 'e',
      start: new DayjsTZDate('2026-06-10T09:00:00'),
      end: new DayjsTZDate('2026-06-12T10:00:00'),
    } as EventObject;

    it('正向平移 +3 天，保留时分与跨天天数', () => {
      const next = computeMovedMonthEvent(prev, 3);
      expect((next.start as DayjsTZDate).dayjs.date()).toBe(13);
      expect((next.end as DayjsTZDate).dayjs.date()).toBe(15);
      expect((next.start as DayjsTZDate).dayjs.hour()).toBe(9);
      expect((next.end as DayjsTZDate).dayjs.hour()).toBe(10);
    });

    it('负向平移 -5 天', () => {
      const next = computeMovedMonthEvent(prev, -5);
      expect((next.start as DayjsTZDate).dayjs.date()).toBe(5);
      expect((next.end as DayjsTZDate).dayjs.date()).toBe(7);
    });

    it('不修改原对象', () => {
      computeMovedMonthEvent(prev, 3);
      expect((prev.start as DayjsTZDate).dayjs.date()).toBe(10);
    });
  });

  describe('computeResizedMonthEvent', () => {
    const prev: EventObject = {
      id: '2',
      calendarId: 'c1',
      title: 'resize',
      start: new DayjsTZDate('2026-06-10T09:00:00'),
      end: new DayjsTZDate('2026-06-12T10:00:00'),
    } as EventObject;

    it('start 边左拖 -2 天，只改开始日期', () => {
      const next = computeResizedMonthEvent(prev, 'start', -2);
      expect((next.start as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-08 09:00');
      expect((next.end as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-12 10:00');
    });

    it('end 边右拖 +3 天，只改结束日期', () => {
      const next = computeResizedMonthEvent(prev, 'end', 3);
      expect((next.start as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-10 09:00');
      expect((next.end as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-15 10:00');
    });

    it('start 拖过 end 时夹紧到 end 当天', () => {
      const next = computeResizedMonthEvent(prev, 'start', 5);
      expect((next.start as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-12 10:00');
      expect((next.end as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-12 10:00');
    });

    it('end 拖到 start 之前时夹紧到 start 当天', () => {
      const next = computeResizedMonthEvent(prev, 'end', -5);
      expect((next.start as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-10 09:00');
      expect((next.end as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-10 09:00');
    });
  });

  describe('buildCreatedMonthEvent', () => {
    it('生成跨天全天事件：start 为首日 00:00，end 为末日 23:59:59', () => {
      const next = buildCreatedMonthEvent(
        new DayjsTZDate('2026-06-10T13:00:00'),
        new DayjsTZDate('2026-06-12T08:00:00')
      );
      expect(next.allDay).toBe(true);
      expect(next.category).toBe('allday');
      expect((next.start as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2026-06-10 00:00:00'
      );
      expect((next.end as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2026-06-12 23:59:59'
      );
    });

    it('落点早于起点时自动校正起止顺序', () => {
      const next = buildCreatedMonthEvent(
        new DayjsTZDate('2026-06-12T08:00:00'),
        new DayjsTZDate('2026-06-10T13:00:00')
      );
      expect((next.start as DayjsTZDate).dayjs.format('YYYY-MM-DD')).toBe('2026-06-10');
      expect((next.end as DayjsTZDate).dayjs.format('YYYY-MM-DD')).toBe('2026-06-12');
    });

    it('单日选择生成当天全天事件', () => {
      const day = new DayjsTZDate('2026-06-15T10:00:00');
      const next = buildCreatedMonthEvent(day, day);
      expect((next.start as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2026-06-15 00:00:00'
      );
      expect((next.end as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2026-06-15 23:59:59'
      );
    });
  });

  // 6 周 × 7 列网格（共 42 格）
  const grid = { weekCount: 6, colCount: 7 };

  describe('splitFlatRangeIntoWeekSegments', () => {
    it('同周区间返回单段', () => {
      // week1 第 1–3 列：flat 8..10
      const segs = splitFlatRangeIntoWeekSegments(8, 10, grid.weekCount, grid.colCount);
      expect(segs).toEqual([{ weekIndex: 1, startCol: 1, colspan: 3 }]);
    });

    it('跨两周区间按周切成两段（换行）', () => {
      // week0 第 4 列(flat 4) → week1 第 2 列(flat 9)
      const segs = splitFlatRangeIntoWeekSegments(4, 9, grid.weekCount, grid.colCount);
      expect(segs).toEqual([
        { weekIndex: 0, startCol: 4, colspan: 3 }, // 4,5,6
        { weekIndex: 1, startCol: 0, colspan: 3 }, // 7,8,9
      ]);
    });

    it('跨三周区间返回三段，中间段占满整周', () => {
      // week0 第 5 列(flat 5) → week2 第 1 列(flat 15)
      const segs = splitFlatRangeIntoWeekSegments(5, 15, grid.weekCount, grid.colCount);
      expect(segs).toEqual([
        { weekIndex: 0, startCol: 5, colspan: 2 }, // 5,6
        { weekIndex: 1, startCol: 0, colspan: 7 }, // 整周
        { weekIndex: 2, startCol: 0, colspan: 2 }, // 14,15
      ]);
    });

    it('整周占满返回单段 colspan=colCount', () => {
      const segs = splitFlatRangeIntoWeekSegments(7, 13, grid.weekCount, grid.colCount);
      expect(segs).toEqual([{ weekIndex: 1, startCol: 0, colspan: 7 }]);
    });

    it('越界区间夹紧到网格范围内', () => {
      const segs = splitFlatRangeIntoWeekSegments(-3, 100, grid.weekCount, grid.colCount);
      expect(segs).toHaveLength(grid.weekCount);
      expect(segs[0]).toEqual({ weekIndex: 0, startCol: 0, colspan: 7 });
      expect(segs[grid.weekCount - 1]).toEqual({ weekIndex: 5, startCol: 0, colspan: 7 });
    });

    it('endFlat < startFlat 返回空数组', () => {
      expect(splitFlatRangeIntoWeekSegments(10, 9, grid.weekCount, grid.colCount)).toEqual([]);
    });
  });

  describe('computeMovePreviewRange', () => {
    it('同周内平移保持跨度', () => {
      // week0 第 1 列、跨 2 天，右移 2 天
      const range = computeMovePreviewRange({
        weekIndex: 0,
        startCol: 1,
        colspan: 2,
        dayDelta: 2,
        ...grid,
      });
      expect(range).toEqual({ startFlat: 3, endFlat: 4 });
    });

    it('向下平移触发跨周换行，跨度不变', () => {
      // week0 第 5 列、跨 3 天(flat 5..7)，下移一周(+7)→ flat 12..14（跨 week1/week2）
      const range = computeMovePreviewRange({
        weekIndex: 0,
        startCol: 5,
        colspan: 3,
        dayDelta: 7,
        ...grid,
      });
      expect(range).toEqual({ startFlat: 12, endFlat: 14 });
      const segs = splitFlatRangeIntoWeekSegments(
        range.startFlat,
        range.endFlat,
        grid.weekCount,
        grid.colCount
      );
      expect(segs).toHaveLength(2);
    });

    it('超出网格末尾时整段夹紧在网格内', () => {
      const range = computeMovePreviewRange({
        weekIndex: 5,
        startCol: 5,
        colspan: 3,
        dayDelta: 10,
        ...grid,
      });
      // 末格 41，跨 3 天 → 最大 startFlat = 39
      expect(range).toEqual({ startFlat: 39, endFlat: 41 });
    });
  });

  describe('computeResizePreviewRange', () => {
    it('resize end 向右延长（跨周）', () => {
      // week0 第 4 列、跨 1 天(flat 4)，end +5 → flat 4..9
      const range = computeResizePreviewRange({
        weekIndex: 0,
        startCol: 4,
        colspan: 1,
        edge: 'end',
        dayDelta: 5,
        ...grid,
      });
      expect(range).toEqual({ startFlat: 4, endFlat: 9 });
    });

    it('resize start 向左延长', () => {
      // week1 第 3 列、跨 2 天(flat 10..11)，start -4 → flat 6..11
      const range = computeResizePreviewRange({
        weekIndex: 1,
        startCol: 3,
        colspan: 2,
        edge: 'start',
        dayDelta: -4,
        ...grid,
      });
      expect(range).toEqual({ startFlat: 6, endFlat: 11 });
    });

    it('resize start 不越过 end（夹紧到 end 当格）', () => {
      // flat 10..11，start +5 → 夹紧到 11
      const range = computeResizePreviewRange({
        weekIndex: 1,
        startCol: 3,
        colspan: 2,
        edge: 'start',
        dayDelta: 5,
        ...grid,
      });
      expect(range).toEqual({ startFlat: 11, endFlat: 11 });
    });

    it('resize end 不早于 start（夹紧到 start 当格）', () => {
      const range = computeResizePreviewRange({
        weekIndex: 1,
        startCol: 3,
        colspan: 2,
        edge: 'end',
        dayDelta: -5,
        ...grid,
      });
      expect(range).toEqual({ startFlat: 10, endFlat: 10 });
    });
  });
});
