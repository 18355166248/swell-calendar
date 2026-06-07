import { useThemeStore } from '@/contexts/themeStore';
import { cls, toPercent } from '@/helpers/css';

interface NowIndicatorLineProps {
  top: number; // 当前时间在网格中的垂直位置百分比
}

/**
 * 当前时间指示线
 *
 * 在日期列区域内按当前时间百分比渲染一条横跨所有列的水平线，
 * 并在左侧（与时间轴 gutter 交界处）渲染一个圆点，对齐参考样例的
 * “current-time indicator”表现。
 *
 * 参考样例：Mobiscroll React Scheduler Desktop Week View
 * https://demo.mobiscroll.com/react/scheduler/desktop-week-view
 */
function NowIndicatorLine({ top }: NowIndicatorLineProps) {
  const color = useThemeStore((state) => state.week.nowIndicatorLabel.color);

  return (
    <div className={cls('now-indicator-line')} style={{ top: toPercent(top) }}>
      <div className={cls('now-indicator-bullet')} style={{ backgroundColor: color }} />
      <div className={cls('now-indicator-line-bar')} style={{ borderTopColor: color }} />
    </div>
  );
}

export default NowIndicatorLine;
