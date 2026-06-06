import { describe, expect, it } from 'vitest';

import { FormattedTimeString } from '@/types/datetime.type';

import { getRowSlotMs, MS_PER_MINUTES } from './datetime';

describe('getRowSlotMs', () => {
  it('derives 30 minutes for a half-hour grid row (hourDivision=2)', () => {
    const row = {
      startTime: '08:00' as FormattedTimeString,
      endTime: '08:30' as FormattedTimeString,
    };
    expect(getRowSlotMs(row)).toBe(30 * MS_PER_MINUTES);
  });

  it('derives 15 minutes for a quarter-hour grid row (hourDivision=4)', () => {
    const row = {
      startTime: '08:15' as FormattedTimeString,
      endTime: '08:30' as FormattedTimeString,
    };
    expect(getRowSlotMs(row)).toBe(15 * MS_PER_MINUTES);
  });

  it('derives 60 minutes for an hourly grid row (hourDivision=1)', () => {
    const row = {
      startTime: '08:00' as FormattedTimeString,
      endTime: '09:00' as FormattedTimeString,
    };
    expect(getRowSlotMs(row)).toBe(60 * MS_PER_MINUTES);
  });
});
