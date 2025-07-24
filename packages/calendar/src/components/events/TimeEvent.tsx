import { TIME_EVENT_CONTAINER_MARGIN_LEFT } from '@/constants/style.const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { cls, extractPercentPx, getEventColors, toPercent } from '@/helpers/css';
import { useCalendarColor } from '@/hooks/calendar/useCalendarColor';
import { EventUIModel } from '@/model/eventUIModel';
import { CalendarColor } from '@/types/calendar.type';
import { isNil, isString } from 'lodash-es';
import { useState, MouseEvent } from 'react';
import { Template } from '../Template';
import { useDrag } from '@/hooks/common/useDrag';
import { DRAGGING_TYPE_CREATE } from '@/helpers/drag';
import { useLayoutContainer } from '@/contexts/layoutContainer';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { useTransientUpdatesCalendar } from '@/hooks/common/useTransientUpdatesCalendar';
import { DraggingState } from '@/types/dnd.type';

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
function getStyles({
  uiModel,
  minHeight,
  calendarColor,
  isDraggingTarget,
  hasNextStartTime,
  isResizingEvent,
}: {
  uiModel: EventUIModel;
  minHeight: number;
  calendarColor: CalendarColor;
  isDraggingTarget: boolean;
  hasNextStartTime: boolean;
  isResizingEvent?: boolean;
}) {
  // 从UI模型中提取位置和尺寸信息
  const { top, left, width, height, duplicateWidth, duplicateLeft } = uiModel;

  // 边框圆角
  const borderRadius = 2;
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
    backgroundColor: isDraggingTarget ? dragBackgroundColor : backgroundColor, // 背景色（拖拽时使用特殊颜色）
    borderRadius,
    borderLeft: `3px solid ${borderColor}`, // 边框颜色
    color, // 文字颜色
    opacity: isDraggingTarget && !isResizingEvent ? 0.5 : 1, // 透明度（拖拽时半透明）
    zIndex: hasNextStartTime ? 1 : 0, // 层级（重叠事件时调整）
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

/**
 * 时间事件组件的属性接口
 */
export interface TimeEventProps {
  /** 事件的UI模型，包含事件的所有显示信息 */
  uiModel: EventUIModel;
  /** 最小高度，用于确保事件有足够的显示空间 */
  minHeight?: number;
  /** 下一个事件的开始时间，用于处理事件重叠时的显示 */
  nextStartTime?: DayjsTZDate | null;
  /** 下一个事件的结束时间，用于处理事件重叠时的显示 */
  nextEndTime?: DayjsTZDate | null;
  /** 是否为调整大小事件 */
  isResizingEvent?: boolean;
}

/**
 * CSS类名常量，用于样式管理
 */
const classNames = {
  time: cls('event-time'), // 时间事件容器类名
  content: cls('event-time-content'), // 事件内容容器类名
  moveEvent: cls('dragging--move-event'), // 拖拽移动事件时的类名
  resizeEvent: cls('dragging--resize-vertical-event'), // 拖拽调整大小时的类名
  resizeHandleBottom: cls('resize-handle-bottom'), // 调整大小底部手柄
};

/**
 * 判断事件是否可拖拽
 * @param uiModel - 事件的UI模型
 * @param isReadOnlyCalendar - 日历是否为只读模式
 * @param isDraggingTarget - 当前事件是否为拖拽目标
 * @returns 返回事件是否可拖拽
 */
function isDraggableEvent({
  uiModel,
  isReadOnlyCalendar,
  isDraggingTarget,
}: {
  uiModel: EventUIModel;
  isReadOnlyCalendar: boolean;
  isDraggingTarget: boolean;
}) {
  const { model } = uiModel;
  // 只有在非只读日历、事件非只读且不是拖拽目标时才可拖拽
  return !isReadOnlyCalendar && !model.isReadOnly && !isDraggingTarget;
}

/**
 * 时间事件组件 - 用于在时间网格中显示单个事件
 * 支持拖拽移动、样式定制、重叠事件处理等功能
 */
export function TimeEvent({
  uiModel,
  minHeight = 0,
  nextStartTime,
  nextEndTime,
  isResizingEvent,
}: TimeEventProps) {
  // 获取事件的日历颜色配置
  const calendarColor = useCalendarColor(uiModel.model);
  // 获取日历状态和拖拽相关状态
  const { options, dnd } = useCalendarStore();
  const { setDraggingEventUIModel } = dnd;
  const { isReadOnly } = options;

  // 当前事件是否为拖拽目标的状态
  const [isDraggingTarget, setIsDraggingTarget] = useState<boolean>(false);
  const { model } = uiModel;

  // 获取布局容器引用，用于添加拖拽样式
  const layoutContainer = useLayoutContainer();

  // 判断是否有下一个开始时间（用于处理重叠事件）
  const hasNextStartTime = !isNil(nextStartTime);

  // 计算容器的样式
  const { containerStyle } = getStyles({
    uiModel,
    minHeight,
    calendarColor,
    isDraggingTarget,
    hasNextStartTime,
    isResizingEvent,
  });

  // 监听拖拽状态变化，更新当前事件是否为拖拽目标
  useTransientUpdatesCalendar(
    (state) => state.dnd,
    ({ draggingEventUIModel, draggingState }) => {
      if (
        draggingEventUIModel?.cid() === uiModel.cid() &&
        draggingState === DraggingState.DRAGGING &&
        !hasNextStartTime
      ) {
        // 如果当前事件是拖拽目标且正在拖拽中，设置拖拽目标状态
        setIsDraggingTarget(true);
      } else {
        // 否则清除拖拽目标状态
        setIsDraggingTarget(false);
      }
    }
  );

  // 创建拖拽类型标识符
  const moveType = DRAGGING_TYPE_CREATE.moveEvent('timeGrid', `${uiModel.cid()}`);
  const resizeType = DRAGGING_TYPE_CREATE.resizeEvent('timeGrid', `${uiModel.cid()}`);

  // 判断当前事件是否可拖拽
  const isDraggable = isDraggableEvent({
    uiModel,
    isReadOnlyCalendar: isReadOnly,
    isDraggingTarget,
  });
  // 判断是否需要显示调整大小手柄
  const shouldShowResizeHandle = isDraggable;

  /**
   * 开始拖拽事件，设置拖拽状态并添加样式类
   * @param className - 要添加的CSS类名
   */
  const startDragEvent = (className: string) => {
    setDraggingEventUIModel(uiModel);
    layoutContainer?.classList.add(className);
  };

  /**
   * 结束拖拽事件，清除拖拽状态并移除样式类
   * @param className - 要移除的CSS类名
   */
  const endDragEvent = (className: string) => {
    setIsDraggingTarget(false);
    layoutContainer?.classList.remove(className);
  };

  // 设置拖拽事件处理
  const onMoveStart = useDrag(moveType, {
    onDragStart: () => {
      if (isDraggable) {
        // 如果事件可拖拽，开始拖拽并添加移动样式
        startDragEvent(classNames.moveEvent);
      }
    },
    onMouseUp: (e, { draggingState }) => {
      // 鼠标释放时结束拖拽
      endDragEvent(classNames.moveEvent);

      // const isClick = draggingState <= DraggingState.INIT;

      // TODO: 显示详情弹窗
      // if (isClick) {
      // showDetailPopup(
      //   {
      //     event: uiModel.model,
      //     eventRect: eventContainerRef.current.getBoundingClientRect(),
      //   },
      //   false
      // );
      // }
    },
  });

  const onResizeStart = useDrag(resizeType, {
    onDragStart: () => startDragEvent(classNames.resizeEvent),
    onMouseUp: () => endDragEvent(classNames.resizeEvent),
  });

  /**
   * 处理鼠标按下事件，开始拖拽
   * @param e - 鼠标事件对象
   */
  const handleMoveStart = (e: MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    onMoveStart(e);
  };

  const handleResizeStart = (e: MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    onResizeStart(e);
  };

  return (
    <div className={classNames.time} style={containerStyle} onMouseDown={handleMoveStart}>
      <div className={classNames.content}>
        <Template
          template={hasNextStartTime ? 'timeMove' : 'time'}
          param={{
            ...model.toEventObject(),
            start: hasNextStartTime ? nextStartTime : model.start,
            end: hasNextStartTime ? nextEndTime : model.end,
          }}
        />
      </div>

      {/* 显示调整大小手柄 */}
      {shouldShowResizeHandle && (
        <div className={classNames.resizeHandleBottom} onMouseDown={handleResizeStart} />
      )}
    </div>
  );
}
