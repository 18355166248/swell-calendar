import { isNil } from 'lodash-es';
import {
  KeyboardEvent,
  MouseEvent,
  TouchEvent as ReactTouchEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import { KEY } from '@/constants/keyboard';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStore } from '@/contexts/calendarStore';
import { useLayoutContainer } from '@/contexts/layoutContainer';
import { buildRecurrenceInstanceInfo } from '@/controller/recurrence-edit-scope';
import { shouldAcceptEventChange } from '@/controller/scheduler-validation';
import { cls } from '@/helpers/css';
import { DRAGGING_TYPE_CREATE } from '@/helpers/drag';
import { useCalendarColor } from '@/hooks/calendar/useCalendarColor';
import { useDrag } from '@/hooks/common/useDrag';
import { useTransientUpdatesCalendar } from '@/hooks/common/useTransientUpdatesCalendar';
import { useMobileEditPress } from '@/hooks/event/useMobileEditPress';
import { EventUIModel } from '@/model/eventUIModel';
import { isSameDate } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { DraggingState } from '@/types/dnd.type';

import { Template } from '../Template';
import { canInteractWithTimeEvent, getPointerInfo, getStyles } from './TimeEvent.utils';

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
  /** 是否为拖拽/resize 过程中的引导阴影卡片。 */
  isGuideEvent?: boolean;
  /** 当前事件所在列的日期（time-grid 按列渲染）。用于跨天事件分段时间标签：
   *  起始列显示开始时间、结束列显示结束时间、中间列不显示时间。 */
  columnDate?: DayjsTZDate;
}

/**
 * CSS类名常量，用于样式管理
 */
const classNames = {
  time: cls('event-time'), // 时间事件容器类名
  content: cls('event-time-content'), // 事件内容容器类名
  moveEvent: cls('dragging--move-event'), // 拖拽移动事件时的类名
  resizeEvent: cls('dragging--resize-vertical-event'), // 拖拽调整大小时的类名
  resizeHandleTop: cls('resize-handle-top'), // 调整大小顶部手柄
  resizeHandleBottom: cls('resize-handle-bottom'), // 调整大小底部手柄
};

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
  isGuideEvent = false,
  columnDate,
}: TimeEventProps) {
  // 获取事件的日历颜色配置
  const calendarColor = useCalendarColor(uiModel.model);
  // 获取日历状态和拖拽相关状态
  const { options, dnd } = useCalendarStore();
  const { setDraggingEventUIModel } = dnd;
  const { isReadOnly } = options;
  const currentView = useCalendarStore((state) => state.view.currentView);
  const callbacks = useCalendarCallbacks();

  // 当前事件是否为拖拽目标的状态
  const [isDraggingTarget, setIsDraggingTarget] = useState<boolean>(false);
  const { model } = uiModel;

  // 跨天事件多段联动高亮：悬浮任一段时，同一事件 id 的所有段一起加深。
  const setHoveredEventId = useCalendarStore((state) => state.hover.setHoveredEventId);
  const isHovered = useCalendarStore((state) => state.hover.hoveredEventId === model.id);
  const setEditingEventId = useCalendarStore((state) => state.eventEdit.setEditingEventId);
  const isEventEditing = useCalendarStore((state) => state.eventEdit.editingEventId === model.id);

  // 卡片根节点引用：编辑态下用于「点击卡片外的空白处退出编辑」的命中判定。
  const eventContainerRef = useRef<HTMLDivElement>(null);

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
    isMobileEditing: isEventEditing,
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
        setIsDraggingTarget(true);
      } else {
        setIsDraggingTarget(false);
      }
    }
  );

  // 创建拖拽类型标识符
  const moveType = DRAGGING_TYPE_CREATE.moveEvent('timeGrid', `${uiModel.cid()}`);
  const resizeTopType = DRAGGING_TYPE_CREATE.resizeEvent('timeGrid', `${uiModel.cid()}`, 'start');
  const resizeBottomType = DRAGGING_TYPE_CREATE.resizeEvent('timeGrid', `${uiModel.cid()}`, 'end');

  const canMove = canInteractWithTimeEvent({
    uiModel,
    isReadOnlyCalendar: isReadOnly,
    isDraggingTarget,
    currentView,
    interaction: 'move',
  });
  const canResize = canInteractWithTimeEvent({
    uiModel,
    isReadOnlyCalendar: isReadOnly,
    isDraggingTarget,
    currentView,
    interaction: 'resize',
  });

  // 移动端编辑手势（长按→编辑态，短按→详情）
  const { pendingEditPressRef, suppressDragUntilReleaseRef, beginMobileEditPress } =
    useMobileEditPress({
      canEnterMobileEdit: canMove || canResize,
      setEditingEventId,
      eventId: model.id,
      onClick: () => {
        callbacks?.onEventClick?.({ event: model.toEventObject() });
      },
    });

  // 编辑态下点击卡片外的空白处（或其它卡片）退出编辑态。
  // 把手 / 圆点虽视觉溢出卡片，但仍是卡片 DOM 子节点，contains 判定为「内部」，不会误退出。
  useEffect(() => {
    if (!isEventEditing) {
      return;
    }

    const handlePointerDownOutside = (e: globalThis.PointerEvent) => {
      const container = eventContainerRef.current;
      if (isNil(container) || !(e.target instanceof Node) || !container.contains(e.target)) {
        setEditingEventId(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
    };
  }, [isEventEditing, setEditingEventId]);

  // 是否处于移动布局：根容器位于 day/multi-day 的 `--mobile` 作用域内
  const isMobileLayout = () =>
    !isNil(eventContainerRef.current?.closest('[class*="view--mobile"]'));

  // 开始/结束拖拽事件
  const startDragEvent = (className: string) => {
    setDraggingEventUIModel(uiModel);
    layoutContainer?.classList.add(className);
  };
  const endDragEvent = (className: string) => {
    setIsDraggingTarget(false);
    layoutContainer?.classList.remove(className);
  };

  // 设置拖拽事件处理
  const onMoveStart = useDrag(moveType, {
    onDragStart: () => {
      if (canMove) {
        startDragEvent(classNames.moveEvent);
      }
    },
    onMouseUp: (e, { draggingState }) => {
      endDragEvent(classNames.moveEvent);
      if (draggingState <= DraggingState.INIT) {
        callbacks?.onEventClick?.({ event: model.toEventObject() });
      }
    },
  });

  const onResizeTopStart = useDrag(resizeTopType, {
    onDragStart: () => startDragEvent(classNames.resizeEvent),
    onMouseUp: () => endDragEvent(classNames.resizeEvent),
  });

  const onResizeBottomStart = useDrag(resizeBottomType, {
    onDragStart: () => startDragEvent(classNames.resizeEvent),
    onMouseUp: () => endDragEvent(classNames.resizeEvent),
  });

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (isEventEditing || !(canMove || canResize)) return;
    const touch = e.touches[0];
    if (isNil(touch)) return;
    e.stopPropagation();
    beginMobileEditPress({
      pointerId: null,
      startX: touch.clientX,
      startY: touch.clientY,
      source: 'touch',
    });
  };

  const handleMoveStart = (e: MouseEvent) => {
    e.stopPropagation();
    const { pointerId, isTouchLike } = getPointerInfo(e);
    const usesMobileEditGesture = isTouchLike || isMobileLayout();

    if (usesMobileEditGesture && !isEventEditing) {
      if (pendingEditPressRef.current?.source !== 'touch') {
        beginMobileEditPress({
          pointerId,
          startX: e.clientX,
          startY: e.clientY,
          source: 'pointer',
        });
      }
      return;
    }

    if (usesMobileEditGesture && suppressDragUntilReleaseRef.current) {
      e.preventDefault();
      return;
    }

    onMoveStart(e);
  };

  const handleResizeTopStart = (e: MouseEvent) => {
    e.stopPropagation();
    const { isTouchLike } = getPointerInfo(e);
    if (isTouchLike && !isEventEditing) return;
    if (isTouchLike && suppressDragUntilReleaseRef.current) {
      e.preventDefault();
      return;
    }
    onResizeTopStart(e);
  };

  const handleResizeBottomStart = (e: MouseEvent) => {
    e.stopPropagation();
    const { isTouchLike } = getPointerInfo(e);
    if (isTouchLike && !isEventEditing) return;
    if (isTouchLike && suppressDragUntilReleaseRef.current) {
      e.preventDefault();
      return;
    }
    onResizeBottomStart(e);
  };

  const handleMouseEnter = () => {
    setHoveredEventId(model.id);
    callbacks?.onEventHover?.({
      event: model.toEventObject(),
      hovering: true,
    });
  };

  const handleMouseLeave = () => {
    setHoveredEventId(null);
    callbacks?.onEventHover?.({
      event: model.toEventObject(),
      hovering: false,
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (currentView === 'scheduler' && (e.key === KEY.DELETE || e.key === KEY.BACKSPACE)) {
      const eventObject = model.toEventObject();

      if (
        shouldAcceptEventChange(options, callbacks, {
          action: 'delete',
          view: currentView,
          event: eventObject,
          previousEvent: eventObject,
        })
      ) {
        callbacks?.onEventDelete?.({
          event: eventObject,
          recurrenceInstance: buildRecurrenceInstanceInfo(eventObject),
        });
      }
      return;
    }

    if (e.key === KEY.ENTER || e.key === KEY.SPACE) {
      e.preventDefault();
      callbacks?.onEventClick?.({ event: model.toEventObject() });
    }
  };

  const templateName = currentView === 'scheduler' && !hasNextStartTime ? 'schedulerTime' : 'time';

  // 跨天事件按列分段时间标签：起始列→开始时间、结束列→结束时间、中间列→不显示时间。
  const segmentRole =
    !hasNextStartTime &&
    columnDate &&
    model.start &&
    model.end &&
    !isSameDate(model.start, model.end)
      ? isSameDate(columnDate, model.start)
        ? 'start'
        : isSameDate(columnDate, model.end)
          ? 'end'
          : 'middle'
      : undefined;

  return (
    <div
      ref={eventContainerRef}
      className={cls('event-time', {
        'event-time--hovered': isHovered,
        'event-time--guide': isGuideEvent,
        'event-time--mobile-editing': isEventEditing,
      })}
      style={containerStyle}
      data-testid={`event-card-${model.id}`}
      tabIndex={0}
      role="button"
      onPointerDown={handleMoveStart}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      onPointerEnter={handleMouseEnter}
      onPointerLeave={handleMouseLeave}
    >
      <div className={classNames.content}>
        <Template
          template={hasNextStartTime ? 'timeMove' : templateName}
          param={{
            ...model.toEventObject(),
            start: hasNextStartTime ? nextStartTime : model.start,
            end: hasNextStartTime ? nextEndTime : model.end,
            segmentRole,
          }}
        />
      </div>

      {/* 显示调整大小顶部手柄 */}
      {canResize && (
        <div
          className={classNames.resizeHandleTop}
          data-testid={`resize-handle-top-${model.id}`}
          onPointerDown={handleResizeTopStart}
        />
      )}

      {/* 显示调整大小底部手柄 */}
      {canResize && (
        <div
          className={classNames.resizeHandleBottom}
          data-testid={`resize-handle-bottom-${model.id}`}
          onPointerDown={handleResizeBottomStart}
        />
      )}
    </div>
  );
}
