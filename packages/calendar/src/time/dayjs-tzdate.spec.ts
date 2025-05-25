import DayjsTZDate from './dayjs-tzdate';

describe('DayjsTZDate', () => {
  describe('构造函数', () => {
    it('应该能够无参数创建当前时间', () => {
      const date = new DayjsTZDate();
      expect(date).toBeInstanceOf(DayjsTZDate);
      expect(typeof date.getTime()).toBe('number');
    });

    it('应该能够从时间戳创建', () => {
      const timestamp = 1672531200000; // 2023-01-01 00:00:00 UTC
      const date = new DayjsTZDate(timestamp);
      expect(date.getTime()).toBe(timestamp);
    });

    it('应该能够从 Date 对象创建', () => {
      const nativeDate = new Date(2023, 0, 1, 12, 30, 45, 123);
      const date = new DayjsTZDate(nativeDate);
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
      expect(date.getHours()).toBe(12);
      expect(date.getMinutes()).toBe(30);
      expect(date.getSeconds()).toBe(45);
      expect(date.getMilliseconds()).toBe(123);
    });

    it('应该能够从字符串创建', () => {
      const date = new DayjsTZDate('2023-01-01T12:00:00.000Z');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
    });

    it('应该能够从年月日参数创建', () => {
      const date = new DayjsTZDate(2023, 0, 1, 12, 30, 45, 123);
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
      expect(date.getHours()).toBe(12);
      expect(date.getMinutes()).toBe(30);
      expect(date.getSeconds()).toBe(45);
      expect(date.getMilliseconds()).toBe(123);
    });

    it('应该能够从另一个 DayjsTZDate 实例创建', () => {
      const originalDate = new DayjsTZDate(2023, 0, 1, 12, 30);
      const copiedDate = new DayjsTZDate(originalDate);
      expect(copiedDate.getTime()).toBe(originalDate.getTime());
      expect(copiedDate.getTimezoneOffset()).toBe(originalDate.getTimezoneOffset());
    });
  });

  describe('getter 方法', () => {
    let date: DayjsTZDate;

    beforeEach(() => {
      date = new DayjsTZDate(2023, 0, 1, 12, 30, 45, 123);
    });

    it('应该正确返回年份', () => {
      expect(date.getFullYear()).toBe(2023);
    });

    it('应该正确返回月份（0-based）', () => {
      expect(date.getMonth()).toBe(0);
    });

    it('应该正确返回日期', () => {
      expect(date.getDate()).toBe(1);
    });

    it('应该正确返回小时', () => {
      expect(date.getHours()).toBe(12);
    });

    it('应该正确返回分钟', () => {
      expect(date.getMinutes()).toBe(30);
    });

    it('应该正确返回秒', () => {
      expect(date.getSeconds()).toBe(45);
    });

    it('应该正确返回毫秒', () => {
      expect(date.getMilliseconds()).toBe(123);
    });

    it('应该正确返回星期几', () => {
      // 2023-01-01 是周日 (0)
      expect(date.getDay()).toBe(0);
    });
  });

  describe('setter 方法（不可变操作）', () => {
    let originalDate: DayjsTZDate;

    beforeEach(() => {
      originalDate = new DayjsTZDate(2023, 0, 1, 12, 30, 45, 123);
    });

    it('setHours 应该返回新实例', () => {
      const newDate = originalDate.setHours(15);
      expect(newDate).not.toBe(originalDate);
      expect(newDate.getHours()).toBe(15);
      expect(originalDate.getHours()).toBe(12); // 原实例不变
    });

    it('setHours 应该支持可选参数', () => {
      const newDate = originalDate.setHours(15, 45, 30, 500);
      expect(newDate.getHours()).toBe(15);
      expect(newDate.getMinutes()).toBe(45);
      expect(newDate.getSeconds()).toBe(30);
      expect(newDate.getMilliseconds()).toBe(500);
    });

    it('setMinutes 应该返回新实例', () => {
      const newDate = originalDate.setMinutes(45);
      expect(newDate).not.toBe(originalDate);
      expect(newDate.getMinutes()).toBe(45);
      expect(originalDate.getMinutes()).toBe(30);
    });

    it('setSeconds 应该返回新实例', () => {
      const newDate = originalDate.setSeconds(30);
      expect(newDate).not.toBe(originalDate);
      expect(newDate.getSeconds()).toBe(30);
      expect(originalDate.getSeconds()).toBe(45);
    });

    it('setMilliseconds 应该返回新实例', () => {
      const newDate = originalDate.setMilliseconds(500);
      expect(newDate).not.toBe(originalDate);
      expect(newDate.getMilliseconds()).toBe(500);
      expect(originalDate.getMilliseconds()).toBe(123);
    });

    it('setFullYear 应该返回新实例', () => {
      const newDate = originalDate.setFullYear(2024);
      expect(newDate).not.toBe(originalDate);
      expect(newDate.getFullYear()).toBe(2024);
      expect(originalDate.getFullYear()).toBe(2023);
    });

    it('setMonth 应该返回新实例', () => {
      const newDate = originalDate.setMonth(5);
      expect(newDate).not.toBe(originalDate);
      expect(newDate.getMonth()).toBe(5);
      expect(originalDate.getMonth()).toBe(0);
    });

    it('setDate 应该返回新实例', () => {
      const newDate = originalDate.setDate(15);
      expect(newDate).not.toBe(originalDate);
      expect(newDate.getDate()).toBe(15);
      expect(originalDate.getDate()).toBe(1);
    });
  });

  describe('add 方法（不可变操作）', () => {
    let date: DayjsTZDate;

    beforeEach(() => {
      date = new DayjsTZDate(2023, 0, 1, 12, 30, 45, 123);
    });

    it('addFullYear 应该返回新实例', () => {
      const newDate = date.addFullYear(1);
      expect(newDate).not.toBe(date);
      expect(newDate.getFullYear()).toBe(2024);
      expect(date.getFullYear()).toBe(2023);
    });

    it('addMonth 应该返回新实例', () => {
      const newDate = date.addMonth(3);
      expect(newDate).not.toBe(date);
      expect(newDate.getMonth()).toBe(3);
      expect(date.getMonth()).toBe(0);
    });

    it('addDate 应该返回新实例', () => {
      const newDate = date.addDate(10);
      expect(newDate).not.toBe(date);
      expect(newDate.getDate()).toBe(11);
      expect(date.getDate()).toBe(1);
    });

    it('addHours 应该返回新实例', () => {
      const newDate = date.addHours(5);
      expect(newDate).not.toBe(date);
      expect(newDate.getHours()).toBe(17);
      expect(date.getHours()).toBe(12);
    });

    it('addMinutes 应该返回新实例', () => {
      const newDate = date.addMinutes(15);
      expect(newDate).not.toBe(date);
      expect(newDate.getMinutes()).toBe(45);
      expect(date.getMinutes()).toBe(30);
    });

    it('addSeconds 应该返回新实例', () => {
      const newDate = date.addSeconds(30);
      expect(newDate).not.toBe(date);
      expect(newDate.getSeconds()).toBe(15); // 应该进位到下一分钟
    });

    it('addMilliseconds 应该返回新实例', () => {
      const newDate = date.addMilliseconds(500);
      expect(newDate).not.toBe(date);
      expect(newDate.getMilliseconds()).toBe(623);
      expect(date.getMilliseconds()).toBe(123);
    });
  });

  describe('时区操作', () => {
    let date: DayjsTZDate;

    beforeEach(() => {
      date = new DayjsTZDate(2023, 0, 1, 12, 0, 0, 0);
    });

    it('tz() 应该能够设置数字偏移量', () => {
      const tzDate = date.tz(-480); // UTC+8
      expect(tzDate).not.toBe(date);
      expect(tzDate.getTimezoneOffset()).toBe(-480);
    });

    it('tz() 应该能够设置为本地时区', () => {
      const localDate = date.tz('Local');
      expect(localDate).not.toBe(date);
      expect(localDate.getTimezoneOffset()).toBeNull;
    });

    it('local() 应该返回本地时区的新实例', () => {
      const tzDate = date.tz(-480);
      const localDate = tzDate.local();
      expect(localDate).not.toBe(tzDate);
      expect(localDate.getTimezoneOffset()).toBeNull;
    });
  });

  describe('工具方法', () => {
    let date: DayjsTZDate;

    beforeEach(() => {
      date = new DayjsTZDate(2023, 0, 1, 12, 30, 45, 123);
    });

    it('toString() 应该返回字符串表示', () => {
      const str = date.toString();
      expect(typeof str).toBe('string');
    });

    it('valueOf() 应该返回时间戳', () => {
      const timestamp = date.valueOf();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBe(date.getTime());
    });

    it('toDate() 应该返回原生 Date 对象', () => {
      const nativeDate = date.toDate();
      expect(nativeDate).toBeInstanceOf(Date);
      expect(nativeDate.getTime()).toBe(date.getTime());
    });

    it('setWithRaw() 应该批量设置时间', () => {
      const newDate = date.setWithRaw(2024, 5, 15, 18, 45, 30, 500);
      expect(newDate).not.toBe(date);
      expect(newDate.getFullYear()).toBe(2024);
      expect(newDate.getMonth()).toBe(5);
      expect(newDate.getDate()).toBe(15);
      expect(newDate.getHours()).toBe(18);
      expect(newDate.getMinutes()).toBe(45);
      expect(newDate.getSeconds()).toBe(30);
      expect(newDate.getMilliseconds()).toBe(500);
    });
  });

  describe('链式调用', () => {
    it('应该支持方法链式调用', () => {
      const date = new DayjsTZDate(2023, 0, 1);
      const result = date.addFullYear(1).addMonth(2).addDate(3).setHours(15, 30, 45);

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(2);
      expect(result.getDate()).toBe(4);
      expect(result.getHours()).toBe(15);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(45);
    });
  });
});
