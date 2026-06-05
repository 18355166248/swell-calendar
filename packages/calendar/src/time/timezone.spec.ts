import { describe, expect, it } from 'vitest';

import DayjsTZDate from './dayjs-tzdate';
import { convertTimezone, needsTimezoneConversion } from './timezone';

describe('timezone', () => {
  describe('needsTimezoneConversion', () => {
    it('两个时区都存在且不同时返回 true', () => {
      expect(needsTimezoneConversion('Asia/Tokyo', 'America/New_York')).toBe(true);
    });

    it('相同时区返回 false', () => {
      expect(needsTimezoneConversion('Asia/Tokyo', 'Asia/Tokyo')).toBe(false);
    });

    it('sourceTz 缺失时返回 false', () => {
      expect(needsTimezoneConversion(undefined, 'America/New_York')).toBe(false);
    });

    it('targetTz 缺失时返回 false', () => {
      expect(needsTimezoneConversion('Asia/Tokyo', undefined)).toBe(false);
    });

    it('两者都缺失时返回 false', () => {
      expect(needsTimezoneConversion(undefined, undefined)).toBe(false);
    });

    it('空字符串视为缺失', () => {
      expect(needsTimezoneConversion('', 'America/New_York')).toBe(false);
      expect(needsTimezoneConversion('Asia/Tokyo', '')).toBe(false);
    });
  });

  describe('convertTimezone', () => {
    it('同源时区和目标时区返回新实例（值相同）', () => {
      const date = new DayjsTZDate(2026, 5, 15, 9, 0, 0);
      const result = convertTimezone(date, 'Asia/Tokyo', 'Asia/Tokyo');

      expect(result).not.toBe(date); // 不可变 — 返回新实例
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(0);
    });

    it('东京 → 纽约：9:00 AM 应转为前一天 20:00', () => {
      // 东京 2026-06-15 9:00 = UTC 2026-06-15 0:00
      // 纽约 EDT (UTC-4) = 2026-06-14 20:00
      const tokyoDate = new DayjsTZDate(2026, 5, 15, 9, 0, 0);
      const result = convertTimezone(tokyoDate, 'Asia/Tokyo', 'America/New_York');

      expect(result.getDate()).toBe(14); // 前一天
      expect(result.getHours()).toBe(20);
      expect(result.getMinutes()).toBe(0);
    });

    it('纽约 → 东京：20:00 应转为次日 9:00', () => {
      // 纽约 2026-06-14 20:00 EDT = UTC 2026-06-15 0:00
      // 东京 = 2026-06-15 9:00
      const nyDate = new DayjsTZDate(2026, 5, 14, 20, 0, 0);
      const result = convertTimezone(nyDate, 'America/New_York', 'Asia/Tokyo');

      expect(result.getDate()).toBe(15); // 次日
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(0);
    });

    it('伦敦 → 纽约：14:00 应转为 9:00', () => {
      // 伦敦 BST (UTC+1), 纽约 EDT (UTC-4), 差 5 小时
      const londonDate = new DayjsTZDate(2026, 5, 15, 14, 0, 0);
      const result = convertTimezone(londonDate, 'Europe/London', 'America/New_York');

      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(0);
    });

    it('无效时区名应静默返回原值', () => {
      const date = new DayjsTZDate(2026, 5, 15, 9, 0, 0);
      const result = convertTimezone(date, 'Not/ARealTimezone', 'America/New_York');

      // 静默回退 — 不抛异常，返回原始时间
      expect(result).toBe(date);
    });

    it('目标时区无效时也应静默返回原值', () => {
      const date = new DayjsTZDate(2026, 5, 15, 9, 0, 0);
      const result = convertTimezone(date, 'Asia/Tokyo', 'Totally/Fake');

      expect(result).toBe(date);
    });

    it('只改小时不改分钟', () => {
      const date = new DayjsTZDate(2026, 5, 15, 10, 30, 0);
      const result = convertTimezone(date, 'Asia/Tokyo', 'America/New_York');

      expect(result.getMinutes()).toBe(30);
    });

    it('午夜边界：悉尼 0:00 → 纽约同日前一天 10:00', () => {
      // 悉尼 AEST (UTC+10), 纽约 EDT (UTC-4), 差 14 小时
      const sydneyDate = new DayjsTZDate(2026, 5, 15, 0, 0, 0);
      const result = convertTimezone(sydneyDate, 'Australia/Sydney', 'America/New_York');

      expect(result.getDate()).toBe(14);
      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(0);
    });
  });
});
