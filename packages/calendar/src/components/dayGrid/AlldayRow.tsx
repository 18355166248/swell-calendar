import { useThemeStore } from '@/contexts/themeStore';
import { cls } from '@/helpers/css';
import { EventUIModel } from '@/model/eventUIModel';
import { ThemeState } from '@/types/theme.type';

import { AlldayEvent } from './AlldayEvent';

const ALLDAY_EVENT_HEIGHT = 24;
const ALLDAY_MIN_HEIGHT = ALLDAY_EVENT_HEIGHT;

interface AlldayRowProps {
  uiModels: EventUIModel[];
  marginLeft?: string;
}

export function AlldayRow({ uiModels, marginLeft = '0' }: AlldayRowProps) {
  const alldayTheme = useThemeStore((theme: ThemeState) => theme.week.allday);

  if (uiModels.length === 0) return null;

  const maxSlot = Math.max(0, ...uiModels.map((m) => m.top));
  const containerHeight = Math.max(ALLDAY_MIN_HEIGHT, (maxSlot + 1) * ALLDAY_EVENT_HEIGHT);

  // 仅在存在真实左侧 gutter（day / week 视图）时渲染「全天」标签；
  // scheduler 视图由 SchedulerAllDayLane 自带标签，marginLeft 为 '0'，避免重复且文字被挤成两行。
  const hasGutter = marginLeft !== '0' && marginLeft !== '0px' && marginLeft !== '';

  return (
    <div
      className={cls('allday-row')}
      style={{
        position: 'relative',
        height: containerHeight,
        backgroundColor: alldayTheme.backgroundColor,
        borderBottom: alldayTheme.borderBottom,
      }}
    >
      {hasGutter && (
        <div
          className={cls('allday-row-label')}
          style={{
            width: marginLeft,
            color: alldayTheme.labelColor,
            backgroundColor: alldayTheme.backgroundColor,
            borderRight: alldayTheme.labelBorderRight,
          }}
        >
          全天
        </div>
      )}
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
