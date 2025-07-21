import { TIME_EVENT_CONTAINER_MARGIN_LEFT } from '@/constants/style.const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { cls, extractPercentPx, getEventColors, toPercent } from '@/helpers/css';
import { useCalendarColor } from '@/hooks/calendar/useCalendarColor';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarColor } from '@/types/calendar.type';
import { isString } from 'lodash-es';
import { useState } from 'react';
import { Template } from '../Template';

export interface TimeEventProps {
  uiModel: EventUIModel;
  minHeight?: number;
}

const classNames = {
  time: cls('event-time'),
  content: cls('event-time-content'),
};

export function TimeEvent({ uiModel, minHeight = 0 }: TimeEventProps) {
  const calendarColor = useCalendarColor(uiModel.model);
  const [isDraggingTarget, setIsDraggingTarget] = useState<boolean>(false);
  const { model } = uiModel;

  const { containerStyle } = getStyles({
    uiModel,
    minHeight,
    calendarColor,
    isDraggingTarget,
  });

  return (
    <div className={classNames.time} style={containerStyle}>
      <div className={classNames.content}>
        <Template template="time" param={{ ...model.toEventObject() }} />
      </div>
    </div>
  );
}

function getStyles({
  uiModel,
  minHeight,
  calendarColor,
  isDraggingTarget,
}: {
  uiModel: EventUIModel;
  minHeight: number;
  calendarColor: CalendarColor;
  isDraggingTarget: boolean;
}) {
  console.log('🚀 ~ getStyles ~ uiModel:', uiModel);
  const { top, left, width, height, duplicateWidth, duplicateLeft } = uiModel;

  const defaultMarginBottom = 2;

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
