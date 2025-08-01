import { DEFAULT_PANEL_HEIGHT } from '@/constants/style.const';
import { addTimeGridPrefix } from '@/constants/timeGrid-const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { cls } from '@/helpers/css';
import { forwardRef, PropsWithChildren, useLayoutEffect, useMemo } from 'react';

interface PanelProps {
  name: string;
  overFlowX?: boolean;
  overFlowY?: boolean;

  initialWidth?: number;
  initialHeight?: number;
}

function getPanelStyle({ overFlowX, overFlowY, initialWidth, initialHeight }: Partial<PanelProps>) {
  const style: React.CSSProperties = {};

  if (initialWidth) {
    style.width = initialWidth;
    style.height = '100%';
  }

  if (initialHeight) {
    style.width = '100%';
    style.height = initialHeight;
  }

  if (overFlowX) {
    style.overflowX = 'auto';
  }

  if (overFlowY) {
    style.overflowY = 'auto';
  }

  return { ...style };
}

const Panel = forwardRef<HTMLDivElement, PropsWithChildren<PanelProps>>(function Panel(
  {
    name,
    children,
    overFlowX,
    overFlowY,
    initialWidth = DEFAULT_PANEL_HEIGHT,
    initialHeight = DEFAULT_PANEL_HEIGHT,
  },
  ref
) {
  const PanelClassName = useMemo(() => cls(addTimeGridPrefix('panel'), name), [name]);
  const updateDayGridRowHeight = useCalendarStore((state) => state.layout.updateDayGridRowHeight);
  const dayGridRowHeight = useCalendarStore(
    (state) => state.layout.weekViewLayout.dayGridRows[name]?.height
  );

  const height = dayGridRowHeight ?? initialHeight;

  const styles = getPanelStyle({ overFlowX, overFlowY, initialWidth, initialHeight: height });

  useLayoutEffect(() => {
    updateDayGridRowHeight(name, height);
  }, [height, initialHeight, name, updateDayGridRowHeight]);

  return (
    <div className={PanelClassName} style={styles} ref={ref}>
      {children}
    </div>
  );
});

export default Panel;
