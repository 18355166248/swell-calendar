import { isNil, isString } from 'lodash-es';
import { type CSSProperties, MouseEvent } from 'react';

import { TIME_EVENT_CONTAINER_MARGIN_LEFT } from '@/constants/style.const';
import { extractPercentPx, getEventColors, toPercent } from '@/helpers/css';
import { EventUIModel } from '@/model/eventUIModel';
import { CalendarColor } from '@/types/calendar.type';

/**
 * 计算事件容器的样式
 * @param uiModel - 事件的UI模型
 * @param minHeight - 最小高度
 * @param calendarColor - 日历颜色配置
 * @param isDraggingTarget - 是否为拖拽目标
 * @param hasNextStartTime - 是否有下一个开始时间
 * @param isResizingEvent - 是否为调整大小事件
 * @returns 返回包含容器样式的对象
 */
export function getStyles({
  uiModel,
  minHeight,
  calendarColor,
  isDraggingTarget,
  hasNextStartTime,
  isResizingEvent,
  isMobileEditing,
}: {
  uiModel: EventUIModel;
  minHeight: number;
  calendarColor: CalendarColor;
  isDraggingTarget: boolean;
  hasNextStartTime: boolean;
  isResizingEvent?: boolean;
  isMobileEditing?: boolean;
}) {
  // 从UI模型中提取位置和尺寸信息
  const { top, left, width, height, duplicateWidth, duplicateLeft } = uiModel;

  // 边框圆角：默认 2px（桌面零回归），移动 tier 经 CSS 变量覆盖（见 css/responsive.scss）
  const borderRadius = 'var(--swell-time-event-radius, 2px)';
  // 默认底部边距
  const defaultMarginBottom = 1;

  // 获取事件的颜色配置
  const { color, backgroundColor, borderColor, dragBackgroundColor } = getEventColors(
    uiModel,
    calendarColor
  );

  // 计算左边距
  const marginLeft = getMarginLeft(left);

  // 构建容器样式对象
  const containerStyle = {
    top: toPercent(top), // 顶部位置（百分比）
    left: duplicateLeft || toPercent(left), // 左侧位置（百分比）
    width: getContainerWidth(duplicateWidth || width, marginLeft), // 宽度
    height: `calc(${toPercent(Math.max(minHeight, height))} - ${defaultMarginBottom}px)`, // 高度
    marginLeft, // 左边距
    // 背景色：move 跟手原卡用 dragBackgroundColor；resize 引导（isResizingEvent）保持正常
    // backgroundColor，避免 dragBackgroundColor 为空串时引导卡渲染成透明、看不清
    backgroundColor: isDraggingTarget && !isResizingEvent ? dragBackgroundColor : backgroundColor,
    borderRadius,
    borderLeft: `3px solid ${borderColor}`, // 边框颜色
    color, // 文字颜色
    // 拖拽目标半透明；其余情况不写内联 opacity，交由 CSS 控制
    // （静置略带透明、hover 时恢复不透明，见 events/time.scss）
    opacity: isDraggingTarget && !isResizingEvent ? 0.5 : undefined,
    // 移动端编辑态把卡片层级抬到所有事件卡与 now 时间线（z-index 3）之上，
    // 否则溢出卡片外的把手/圆点会被相邻卡片或时间线遮挡、无法点击。
    zIndex: isMobileEditing ? 30 : hasNextStartTime ? 1 : 0, // 层级（重叠事件时调整）
    // 移动端卡片 tier 需要在 CSS 中复用事件原始配色。
    // 默认仍由上面的内联 background/border/color 生效；变量只作为响应式覆盖的稳定输入。
    '--swell-event-bg': backgroundColor,
    '--swell-event-border': borderColor,
    '--swell-event-text': color,
    '--swell-event-drag-bg': dragBackgroundColor,
  } as CSSProperties & {
    '--swell-event-bg': string;
    '--swell-event-border': string;
    '--swell-event-text': string;
    '--swell-event-drag-bg': string;
  };

  return { containerStyle };
}

/**
 * 计算容器宽度
 * @param width - 原始宽度值
 * @param marginLeft - 左边距
 * @returns 返回计算后的宽度字符串
 */
function getContainerWidth(width: number | string, marginLeft: number) {
  if (isString(width)) {
    // 如果宽度是字符串，直接返回
    return width;
  }
  if (width >= 0) {
    // 如果宽度是正数，计算减去左边距后的宽度
    return `calc(${toPercent(width)} - ${marginLeft}px)`;
  }

  // 如果宽度为负数，返回空字符串
  return '';
}

/**
 * 计算左边距
 * @param left - 左侧位置值
 * @returns 返回左边距值
 */
function getMarginLeft(left: number | string) {
  // 解析位置值中的百分比和像素值
  const { percent, px } = extractPercentPx(`${left}`);

  // 只有当位置值大于0时才添加默认左边距
  return Number(left) > 0 || percent > 0 || px > 0 ? TIME_EVENT_CONTAINER_MARGIN_LEFT : 0;
}

export function getPointerInfo(e: MouseEvent) {
  // React 的 MouseEvent 类型没有暴露 pointer 字段；实际事件由 onPointerDown 触发。
  const pe = e as MouseEvent & { pointerId?: number; pointerType?: string };

  return {
    pointerId: isNil(pe.pointerId) ? null : pe.pointerId,
    isTouchLike: !isNil(pe.pointerType) && pe.pointerType !== 'mouse',
  };
}

export type TimeEventInteraction = 'move' | 'resize';

export function canInteractWithTimeEvent({
  uiModel,
  isReadOnlyCalendar,
  isDraggingTarget,
  currentView,
  interaction,
}: {
  uiModel: EventUIModel;
  isReadOnlyCalendar: boolean;
  isDraggingTarget: boolean;
  currentView: string;
  interaction: TimeEventInteraction;
}) {
  const { model } = uiModel;

  if (isReadOnlyCalendar || model.isReadOnly || isDraggingTarget) {
    return false;
  }

  if (currentView !== 'scheduler') {
    return true;
  }

  if (!model.editable) {
    return false;
  }

  return interaction === 'move' ? model.draggable : model.resizable;
}
