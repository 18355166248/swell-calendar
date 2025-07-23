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

export interface TimeEventProps {
  uiModel: EventUIModel;
  minHeight?: number;
  nextStartTime?: DayjsTZDate | null;
  nextEndTime?: DayjsTZDate | null;
}

const classNames = {
  time: cls('event-time'),
  content: cls('event-time-content'),
  moveEvent: cls('dragging--move-event'),
  resizeEvent: cls('dragging--resize-vertical-event'),
};

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
  return !isReadOnlyCalendar && !model.isReadOnly && !isDraggingTarget;
}

export function TimeEvent({ uiModel, minHeight = 0, nextStartTime, nextEndTime }: TimeEventProps) {
  const calendarColor = useCalendarColor(uiModel.model);
  const { options, dnd } = useCalendarStore();
  const { setDraggingEventUIModel } = dnd;
  const { isReadOnly } = options;
  const [isDraggingTarget, setIsDraggingTarget] = useState<boolean>(false);
  const { model } = uiModel;
  const layoutContainer = useLayoutContainer();

  const hasNextStartTime = !isNil(nextStartTime);
  const { containerStyle } = getStyles({
    uiModel,
    minHeight,
    calendarColor,
    isDraggingTarget,
    hasNextStartTime,
  });

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

  const draggingType = DRAGGING_TYPE_CREATE.moveEvent('timeGrid', `${uiModel.cid()}`);

  const isDraggable = isDraggableEvent({
    uiModel,
    isReadOnlyCalendar: isReadOnly,
    isDraggingTarget,
  });

  const startDragEvent = (className: string) => {
    setDraggingEventUIModel(uiModel);
    layoutContainer?.classList.add(className);
  };
  const endDragEvent = (className: string) => {
    setIsDraggingTarget(false);
    layoutContainer?.classList.remove(className);
  };

  const onMoveStart = useDrag(draggingType, {
    onDragStart: () => {
      if (isDraggable) {
        startDragEvent(classNames.moveEvent);
      }
    },
    onMouseUp: (e, { draggingState }) => {
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

  const handleMoveStart = (e: MouseEvent) => {
    e.stopPropagation();
    onMoveStart(e);
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
    </div>
  );
}

function getStyles({
  uiModel,
  minHeight,
  calendarColor,
  isDraggingTarget,
  hasNextStartTime,
}: {
  uiModel: EventUIModel;
  minHeight: number;
  calendarColor: CalendarColor;
  isDraggingTarget: boolean;
  hasNextStartTime: boolean;
}) {
  const { top, left, width, height, duplicateWidth, duplicateLeft } = uiModel;

  const defaultMarginBottom = 1;

  const { color, backgroundColor, borderColor, dragBackgroundColor } = getEventColors(
    uiModel,
    calendarColor
  );

  const marginLeft = getMarginLeft(left);
  const containerStyle = {
    top: toPercent(top),
    left: duplicateLeft || toPercent(left),
    width: getContainerWidth(duplicateWidth || width, marginLeft),
    height: `calc(${toPercent(Math.max(minHeight, height))} - ${defaultMarginBottom}px)`,
    marginLeft,
    backgroundColor: isDraggingTarget ? dragBackgroundColor : backgroundColor,
    borderColor,
    color,
    opacity: isDraggingTarget ? 0.5 : 1,
    zIndex: hasNextStartTime ? 1 : 0,
  };

  return { containerStyle };
}

function getContainerWidth(width: number | string, marginLeft: number) {
  if (isString(width)) {
    return width;
  }
  if (width >= 0) {
    return `calc(${toPercent(width)} - ${marginLeft}px)`;
  }

  return '';
}

function getMarginLeft(left: number | string) {
  const { percent, px } = extractPercentPx(`${left}`);

  return Number(left) > 0 || percent > 0 || px > 0 ? TIME_EVENT_CONTAINER_MARGIN_LEFT : 0;
}
