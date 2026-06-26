/**
 * 最小拖拽距离
 */
export const MINIMUM_DRAG_MOUSE_DISTANCE = 3;

/**
 * 触控「长按进入创建」的判定时长（毫秒）。
 * 仅作用于触控/手写笔的空白网格创建：长按到达该时长且指针仍按住才进入拖拽创建，
 * 长按前的滑动视为原生滚动。鼠标不经长按。对标 iOS 日历 / Mobiscroll mobile day view。
 */
export const LONG_PRESS_DELAY = 400;

/**
 * 长按等待期内允许的指针抖动容差（像素）。
 * 超过该距离视为「滚动手势」，放弃本次长按创建（不锁定滚动）。
 * 比 MINIMUM_DRAG_MOUSE_DISTANCE 略大，容忍手指自然抖动。
 */
export const LONG_PRESS_MOVE_TOLERANCE = 10;

/**
 * 触控长按激活（临时卡片出现）到弹窗打开的延迟（毫秒）。
 * 松手后等待该时长再打开创建弹窗，给用户"动画感"缓冲。
 */
export const LONG_PRESS_CREATE_OPEN_DELAY = 200;
