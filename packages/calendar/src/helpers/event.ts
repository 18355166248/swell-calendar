import { millisecondsFrom, MS_EVENT_MIN_DURATION } from '@/time/datetime';

/**
 * 碰撞检测参数类型定义
 */
type CollisionParam = {
  start: number; // 当前事件的开始时间（毫秒时间戳）
  end: number; // 当前事件的结束时间（毫秒时间戳）
  targetStart: number; // 目标事件的开始时间（毫秒时间戳）
  targetEnd: number; // 目标事件的结束时间（毫秒时间戳）
  goingDuration: number; // 当前事件的准备时间（分钟）
  comingDuration: number; // 当前事件的后续时间（分钟）
  targetGoingDuration: number; // 目标事件的准备时间（分钟）
  targetComingDuration: number; // 目标事件的后续时间（分钟）
  usingTravelTime: boolean; // 是否使用旅行时间进行碰撞检测
};

/**
 * 检查两个时间段是否发生碰撞
 * @param start 第一个时间段的开始时间
 * @param end 第一个时间段的结束时间
 * @param targetStart 第二个时间段的开始时间
 * @param targetEnd 第二个时间段的结束时间
 * @returns 如果时间段重叠则返回true，否则返回false
 */
function hasCollision(start: number, end: number, targetStart: number, targetEnd: number) {
  return (
    // 目标开始时间在当前时间段内
    (targetStart > start && targetStart < end) ||
    // 目标结束时间在当前时间段内
    (targetEnd > start && targetEnd < end) ||
    // 目标时间段完全包含当前时间段
    (targetStart <= start && targetEnd >= end)
  );
}

/**
 * 检查两个事件是否在时间上发生碰撞
 * 考虑事件的最小持续时间、准备时间和后续时间
 * @param param 碰撞检测参数对象
 * @returns 如果事件时间重叠则返回true，否则返回false
 */
export function collidesWith({
  start,
  end,
  targetStart,
  targetEnd,
  goingDuration,
  comingDuration,
  targetGoingDuration,
  targetComingDuration,
  usingTravelTime,
}: CollisionParam) {
  // 确保事件持续时间不小于最小持续时间
  if (Math.abs(end - start) < MS_EVENT_MIN_DURATION) {
    end += MS_EVENT_MIN_DURATION;
  }
  // 如果启用旅行时间，则扩展事件的时间范围
  if (usingTravelTime) {
    // 在开始时间前减去准备时间
    start -= millisecondsFrom('minute', goingDuration);
    // 在结束时间后加上后续时间
    end += millisecondsFrom('minute', comingDuration);
    // 对目标事件也进行同样的处理
    targetStart -= millisecondsFrom('minute', targetGoingDuration);
    targetEnd += millisecondsFrom('minute', targetComingDuration);
  }

  // 检查是否发生碰撞
  return hasCollision(start, end, targetStart, targetEnd);
}
