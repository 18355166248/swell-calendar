import { describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';

import { getDayNames } from './dayName';

describe('getDayNames', () => {
  it('只应把真实今天标记为 isToday', () => {
    const today = new DayjsTZDate();
    const tomorrow = today.addDate(1);

    const names = getDayNames([today, tomorrow], []);

    expect(names[0]?.isToday).toBe(true);
    expect(names[1]?.isToday).toBe(false);
  });
});
