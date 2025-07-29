import { cls, toPercent } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { TimeUnit } from '@/types/events.type';
import { Template } from '../Template';
import { useThemeStore } from '@/contexts/themeStore';
import { useMemo } from 'react';

interface NowIndicatorLabelProps {
  unit: TimeUnit;
  top: number;
  now: DayjsTZDate;
  zonedNow: DayjsTZDate;
}

function NowIndicatorLabel({ unit, top, now, zonedNow }: NowIndicatorLabelProps) {
  // 直接使用选择器函数，不需要 useMemo 包装
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
