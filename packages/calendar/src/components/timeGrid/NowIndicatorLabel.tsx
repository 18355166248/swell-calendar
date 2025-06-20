import DayjsTZDate from '@/time/dayjs-tzdate';
import { TimeUnit } from '@/types/events.type';

interface NowIndicatorLabelProps {
  unit: TimeUnit;
  top: number;
  now: DayjsTZDate;
  zonedNow: DayjsTZDate;
}

function NowIndicatorLabel({ unit, top, now, zonedNow }: NowIndicatorLabelProps) {
  return <div>NowIndicatorLabel</div>;
}

export default NowIndicatorLabel;
