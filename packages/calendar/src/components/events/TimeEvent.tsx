import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';

export interface TimeEventProps {
  uiModel: EventUIModel;
  nextStartTime?: DayjsTZDate;
  isResizingGuide?: boolean;
  minHeight?: number;
}

export function TimeEvent({
  uiModel,
  nextStartTime,
  isResizingGuide = false,
  minHeight = 0,
}: TimeEventProps) {
  const { modelDurationHeight } = uiModel;
  return <div>TimeEvent</div>;
}
