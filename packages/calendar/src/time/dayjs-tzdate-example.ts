import DayjsTZDate from './dayjs-tzdate';

/**
 * DayjsTZDate 使用示例
 *
 * 这个文件展示了如何使用基于 dayjs 的 TZDate 类
 */

console.log(233);

console.log('=== DayjsTZDate 使用示例 ===\n');

// 1. 创建实例的多种方式
console.log('1. 创建实例：');
const now = new DayjsTZDate();
console.log('当前时间:', now.toString());

const fromTimestamp = new DayjsTZDate(1672531200000);
console.log('从时间戳:', fromTimestamp.toString());

const fromDate = new DayjsTZDate(new Date(2023, 0, 1, 12, 30));
console.log('从 Date 对象:', fromDate.toString());

const fromString = new DayjsTZDate('2023-01-01T12:00:00Z');
console.log('从字符串:', fromString.toString());

const fromComponents = new DayjsTZDate(2023, 0, 1, 12, 30, 45, 123);
console.log('从年月日时分秒毫秒:', fromComponents.toString());

// 2. getter 方法
console.log('\n2. 获取时间组件：');
const date = new DayjsTZDate(2023, 5, 15, 14, 30, 45, 123); // 2023年6月15日
console.log(`年份: ${date.getFullYear()}`);
console.log(`月份: ${date.getMonth()} (0-based)`);
console.log(`日期: ${date.getDate()}`);
console.log(`小时: ${date.getHours()}`);
console.log(`分钟: ${date.getMinutes()}`);
console.log(`秒: ${date.getSeconds()}`);
console.log(`毫秒: ${date.getMilliseconds()}`);
console.log(`星期几: ${date.getDay()} (0=周日)`);
console.log(`时间戳: ${date.getTime()}`);

// 3. 不可变的 setter 方法
console.log('\n3. 设置时间（不可变操作）：');
const originalDate = new DayjsTZDate(2023, 0, 1, 12, 0, 0);
console.log('原始时间:', originalDate.toString());

const newHourDate = originalDate.setHours(15, 30, 45, 500);
console.log('设置小时后:', newHourDate.toString());
console.log('原始时间不变:', originalDate.toString());

const newYearDate = originalDate.setFullYear(2024, 5, 15);
console.log('设置年月日后:', newYearDate.toString());

// 4. 时间添加操作
console.log('\n4. 时间添加操作（不可变）：');
const baseDate = new DayjsTZDate(2023, 0, 1, 12, 0, 0);
console.log('基础时间:', baseDate.toString());

const addedYears = baseDate.addFullYear(1);
console.log('添加1年:', addedYears.toString());

const addedMonths = baseDate.addMonth(3);
console.log('添加3个月:', addedMonths.toString());

const addedDays = baseDate.addDate(15);
console.log('添加15天:', addedDays.toString());

const addedHours = baseDate.addHours(5);
console.log('添加5小时:', addedHours.toString());

// 5. 链式调用
console.log('\n5. 链式调用：');
const chainResult = baseDate
  .addFullYear(1)
  .addMonth(2)
  .addDate(10)
  .setHours(18, 30, 0)
  .addMinutes(15);
console.log('链式调用结果:', chainResult.toString());

// 6. 时区操作
console.log('\n6. 时区操作：');
const utcDate = new DayjsTZDate(2023, 0, 1, 12, 0, 0);
console.log('UTC时间:', utcDate.toString());

// 设置为东八区 (UTC+8)
const beijingTime = utcDate.tz(-480); // -480 分钟 = UTC+8
console.log('北京时间 (UTC+8):', beijingTime.toString());
console.log('时区偏移:', beijingTime.getTimezoneOffset(), '分钟');

// 设置为纽约时间 (如果支持 IANA 时区名称)
try {
  const nyTime = utcDate.tz('America/New_York');
  console.log('纽约时间:', nyTime.toString());
} catch (error) {
  console.log('IANA 时区可能需要额外配置');
}

// 转换为本地时区
const localTime = beijingTime.local();
console.log('转为本地时区:', localTime.toString());

// 7. 与原生 Date 的互操作
console.log('\n7. 与原生 Date 互操作：');
const tzDate = new DayjsTZDate(2023, 5, 15, 14, 30);
const nativeDate = tzDate.toDate();
console.log('DayjsTZDate:', tzDate.toString());
console.log('转为原生 Date:', nativeDate.toString());
console.log('时间戳一致:', tzDate.getTime() === nativeDate.getTime());

// 8. 批量设置
console.log('\n8. 批量设置时间：');
const batchSet = baseDate.setWithRaw(2025, 11, 25, 20, 30, 45, 999);
console.log('批量设置结果:', batchSet.toString());

// 9. 实际使用场景示例
console.log('\n9. 实际使用场景：');

// 创建一个日程事件
const eventStart = new DayjsTZDate(2023, 5, 15, 9, 0, 0); // 9:00 AM
const eventEnd = eventStart.addHours(2); // 11:00 AM
console.log(
  `会议时间: ${eventStart.getHours()}:${eventStart
    .getMinutes()
    .toString()
    .padStart(2, '0')} - ${eventEnd.getHours()}:${eventEnd
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
);

// 计算一周后的同一时间
const nextWeek = eventStart.addDate(7);
console.log('下周同一时间:', nextWeek.toString());

// 月末最后一天
const monthEnd = new DayjsTZDate(2023, 5, 1) // 6月1日
  .addMonth(1) // 7月1日
  .addDate(-1); // 6月30日
console.log('6月最后一天:', monthEnd.toString());

console.log('\n=== 示例结束 ===');

export { DayjsTZDate };
