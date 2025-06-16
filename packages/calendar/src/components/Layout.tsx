import { addTimeGridPrefix } from '@/constants/timeGrid-const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { LayoutContainerProvider } from '@/contexts/layoutContainer';
import { cls, toPercent } from '@/helpers/css';
import { useDOMNode } from '@/hooks/common/useDOMNode';
import { isNil, isNumber, isString } from 'lodash-es';
import { Children, ReactElement, useEffect, useMemo } from 'react';

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
    layout: { updateLayoutHeight, setLastPanelType },
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

  useEffect(() => {
    if (container) {
      const childArray = Children.toArray(children);
      const lastChild = childArray[childArray.length - 1];

      if (lastChild && !isString(lastChild) && !isNumber(lastChild) && !isNil(lastChild)) {
        setLastPanelType((lastChild as unknown as ReactElement<any, string>).props.name);
      }
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
