import { addTimeGridPrefix } from '@/constants/timeGrid-const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { LayoutContainerProvider } from '@/contexts/layoutContainer';
import { cls, toPercent } from '@/helpers/css';
import { useDOMNode } from '@/hooks/common/useDOMNode';
import { useEffect, useMemo, useRef } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

function getLayoutStylesFromInfo(width?: number, height?: number) {
  const style: React.CSSProperties = { height: toPercent(100) };

  if (width) {
    style.width = toPercent(width);
  }

  if (height) {
    style.height = toPercent(height);
  }
  return style;
}

const Layout = ({ children, className, width, height, backgroundColor }: LayoutProps) => {
  const [container, setContainer] = useDOMNode<HTMLDivElement>();

  const {
    layout: { updateLayoutHeight },
  } = useCalendarStore();
  const containerClassName = useMemo(
    () => cls(addTimeGridPrefix('layout'), className),
    [className]
  );

  useEffect(() => {
    if (container) {
      const onResizeWindow = () => updateLayoutHeight(container.offsetHeight);

      onResizeWindow();
      window.addEventListener('resize', onResizeWindow);

      return () => window.removeEventListener('resize', onResizeWindow);
    }
  }, [container]);

  return (
    <LayoutContainerProvider value={container}>
      <div
        ref={setContainer}
        className={containerClassName}
        style={{ ...getLayoutStylesFromInfo(width, height), backgroundColor }}
      >
        {container ? children : null}
      </div>
    </LayoutContainerProvider>
  );
};

export default Layout;
