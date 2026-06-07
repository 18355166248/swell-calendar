/**
 * Calendar Timeline（日粒度资源排程）布局常量。
 *
 * 对标 Mobiscroll React Timeline - Calendar timeline：
 * <https://demo.mobiscroll.com/react/timeline/calendar-timeline>
 */

/** 每个天列的默认宽度（px） */
export const TIMELINE_DAY_CELL_WIDTH = 48;

/** 左侧资源列默认宽度（px） */
export const TIMELINE_RESOURCE_LIST_WIDTH = 160;

/** 单个事件横条高度（px） */
export const TIMELINE_EVENT_HEIGHT = 22;

/** 同一行内相邻车道事件的纵向间距（px） */
export const TIMELINE_EVENT_GAP = 4;

/** 资源行上下内边距（px） */
export const TIMELINE_ROW_PADDING_Y = 6;

/** 资源行最小高度（px） */
export const TIMELINE_ROW_MIN_HEIGHT = 44;

/**
 * 由车道数推导资源行高度。
 * 空行（laneCount=0）也保留最小高度。
 */
export function getTimelineRowHeight(laneCount: number): number {
  const lanes = Math.max(laneCount, 1);
  const content =
    TIMELINE_ROW_PADDING_Y * 2 + lanes * TIMELINE_EVENT_HEIGHT + (lanes - 1) * TIMELINE_EVENT_GAP;
  return Math.max(content, TIMELINE_ROW_MIN_HEIGHT);
}
