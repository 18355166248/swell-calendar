import { cls, toPercent } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { TimeUnit } from '@/types/events.type';
import { Template } from '../Template';
import { useThemeStore } from '@/contexts/themeStore';

interface NowIndicatorLabelProps {
  unit: TimeUnit;
  top: number;
  now: DayjsTZDate;
  zonedNow: DayjsTZDate;
}

function NowIndicatorLabel({ unit, top, now, zonedNow }: NowIndicatorLabelProps) {
  const color = useThemeStore((state) => state.week.nowIndicatorLabel.color);
  return (
    <div className={cls('now-indicator-label')} style={{ top: toPercent(top), color }}>
      {/* 渲染当前时间的格式化标签 */}
      <Template
        template="timeGridNowIndicatorLabel"
        param={{ unit, time: zonedNow, format: 'HH:mm' }}
      />
    </div>
  );
}

export default NowIndicatorLabel;
