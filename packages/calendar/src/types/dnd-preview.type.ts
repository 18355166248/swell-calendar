import DayjsTZDate from '@/time/dayjs-tzdate';

import { EventObject } from './events.type';
import { GridPosition } from './grid.type';

export type TimeGridDropPreviewSource = 'external' | 'cross-instance';

export type TimeGridDropPreviewStatus = 'allowed' | 'invalid' | 'policy';

export interface TimeGridDropPreview {
  source: TimeGridDropPreviewSource;
  status: TimeGridDropPreviewStatus;
  start: DayjsTZDate;
  end: DayjsTZDate;
  position: GridPosition;
  resourceId?: string;
  resourceName?: string;
  event?: EventObject;
}
