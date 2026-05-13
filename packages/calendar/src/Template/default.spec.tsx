import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObjectWithDefaultValues } from '@/types/events.type';

import { templates } from './default';

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
