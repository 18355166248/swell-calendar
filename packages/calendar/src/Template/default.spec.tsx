import { isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObjectWithDefaultValues } from '@/types/events.type';

import { templates } from './default';

describe('time 模板 · 跨天分段时间标签', () => {
  const renderTime = (start: string, end: string, segmentRole?: 'start' | 'middle' | 'end') =>
    renderToStaticMarkup(
      templates.time({
        title: 'E',
        start: new DayjsTZDate(start),
        end: new DayjsTZDate(end),
        segmentRole,
      } as unknown as EventObjectWithDefaultValues)
    );

  it('单日事件（无 segmentRole）只显示开始时间', () => {
    const html = renderTime('2026-05-18T09:00:00', '2026-05-18T10:30:00');
    expect(html).toContain('09:00');
    expect(html).not.toContain('10:30');
  });

  it('起始列（segmentRole=start）显示开始时间', () => {
    const html = renderTime('2026-05-18T08:00:00', '2026-05-20T10:00:00', 'start');
    expect(html).toContain('08:00');
    expect(html).not.toContain('10:00');
  });

  it('结束列（segmentRole=end）显示结束时间', () => {
    const html = renderTime('2026-05-18T08:00:00', '2026-05-20T10:00:00', 'end');
    expect(html).toContain('10:00');
    expect(html).not.toContain('08:00');
  });

  it('中间列（segmentRole=middle）第二行显示「全天」，无具体时间', () => {
    const html = renderTime('2026-05-18T08:00:00', '2026-05-20T10:00:00', 'middle');
    expect(html).not.toContain('08:00');
    expect(html).not.toContain('10:00');
    expect(html).toContain('全天');
    expect(html).toContain('E');
  });

  it('跨天分段为两行结构（标题行 + 时间/全天行）', () => {
    const html = renderTime('2026-05-18T08:00:00', '2026-05-20T10:00:00', 'start');
    expect(html).toContain('event-time-stack-title');
    expect(html).toContain('event-time-stack-sub');
  });

  it('单日事件为两行结构（标题行 + 开始时间行）', () => {
    const html = renderTime('2026-05-18T09:00:00', '2026-05-18T10:30:00');
    expect(html).toContain('event-time-stack-title');
    expect(html).toContain('event-time-stack-sub');
    expect(html).toContain('09:00');
  });
});

describe('default templates', () => {
  it('keeps moving time event content in a single inline wrapper', () => {
    const event = {
      title: 'Order 1 - left',
      start: new DayjsTZDate('2026-05-07T13:00:00'),
      end: new DayjsTZDate('2026-05-07T15:00:00'),
    } as EventObjectWithDefaultValues;

    const result = templates.timeMove(event);

    expect(isValidElement(result)).toBe(true);
    expect(isValidElement(result) ? result.type : null).toBe('span');
  });

  it('renders scheduler resource header as a fragment', () => {
    const result = templates.schedulerResourceHeader({
      resourceId: 'room-a',
      resourceName: '会议室 A',
      dateInstance: new DayjsTZDate('2026-05-07T00:00:00'),
      dateIndex: 0,
      resourceIndex: 0,
      isLastResourceOfDay: false,
    });

    expect(isValidElement(result)).toBe(true);
    expect(isValidElement(result) ? result.type : null).toBe(Symbol.for('react.fragment'));
  });
});
