import dayjs from 'dayjs';

import DayjsTZDate from './dayjs-tzdate';

/**
 * 检测时区是否需要转换
 *
 * @param sourceTz  数据时区（来自 EventObject.timezone）
 * @param targetTz  显示时区（来自 SchedulerOptions.displayTimezone）
 * @returns true 如果 sourceTz 和 targetTz 都有效且不同
 */
export function needsTimezoneConversion(sourceTz?: string, targetTz?: string): boolean {
  return Boolean(sourceTz && targetTz && sourceTz !== targetTz);
}

/**
 * 将事件时间从数据时区转换到显示时区
 *
 * 原理：
 * 1. 从 date 提取墙钟时间（wall-clock：年月日时分）
 * 2. 用 dayjs.tz() 将墙钟时间解释为 sourceTz 时区下的时刻
 * 3. 用 .tz(targetTz) 将其转换为 targetTz 时区下的墙钟时间
 * 4. 以 targetTz 的墙钟值为准创建新的 DayjsTZDate，使其在 scheduler 网格中渲染到正确位置
 *
 * 例如：东京 9:00 AM (sourceTz='Asia/Tokyo') → 纽约 20:00 (前一天) (targetTz='America/New_York')
 *
 * @param date      事件的时间（DayjsTZDate），其墙钟值被视为 sourceTz 下的时间
 * @param sourceTz  数据时区 IANA 名称（如 'Asia/Tokyo'）
 * @param targetTz  显示时区 IANA 名称（如 'America/New_York'）
 * @returns 转换后的 DayjsTZDate（新实例）。若转换失败，返回原值
 */
export function convertTimezone(
  date: DayjsTZDate,
  sourceTz: string,
  targetTz: string
): DayjsTZDate {
  try {
    // 提取墙钟值（输入 date 的年月日时分，在当前运行环境时区下的表示）
    const wallClock = date.format('YYYY-MM-DDTHH:mm:ss');

    // 将墙钟时间解释为 sourceTz 下的时刻，再转换到 targetTz
    const converted = dayjs.tz(wallClock, sourceTz).tz(targetTz);

    if (!converted.isValid()) {
      return date;
    }

    // 直接从 targetTz 的 dayjs 对象提取墙钟值，绕开 Date → 本地时区 的重解释
    // dayjs 的 month() 是 0-based，与 DayjsTZDate 构造函数一致
    return new DayjsTZDate(
      converted.year(),
      converted.month(),
      converted.date(),
      converted.hour(),
      converted.minute(),
      converted.second(),
      converted.millisecond()
    );
  } catch {
    // 时区转换失败时静默回退，不打断渲染
    return date;
  }
}
