import { cls } from '@/helpers/css';
import { EventUIModel } from '@/model/eventUIModel';

import { AlldayEvent } from './AlldayEvent';

const ALLDAY_EVENT_HEIGHT = 24;
const ALLDAY_MIN_HEIGHT = ALLDAY_EVENT_HEIGHT;

interface AlldayRowProps {
  uiModels: EventUIModel[];
  marginLeft?: string;
}

export function AlldayRow({ uiModels, marginLeft = '0' }: AlldayRowProps) {
  if (uiModels.length === 0) return null;

  const maxSlot = Math.max(0, ...uiModels.map((m) => m.top));
  const containerHeight = Math.max(ALLDAY_MIN_HEIGHT, (maxSlot + 1) * ALLDAY_EVENT_HEIGHT);

  return (
    <div className={cls('allday-row')} style={{ position: 'relative', height: containerHeight }}>
      <div
        className={cls('allday-row-events')}
        style={{ position: 'absolute', inset: 0, marginLeft }}
      >
        {uiModels.map((uiModel, i) => (
          <AlldayEvent key={i} uiModel={uiModel} height={ALLDAY_EVENT_HEIGHT} />
        ))}
      </div>
    </div>
  );
}

export { ALLDAY_EVENT_HEIGHT };
