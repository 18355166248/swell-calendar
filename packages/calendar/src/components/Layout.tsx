import { isNil, isNumber, isString } from 'lodash-es';
import type { RefCallback } from 'react';
import { Children, ReactElement, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';

import { useCalendarStore } from '@/contexts/calendarStore';
import { LayoutContainerProvider } from '@/contexts/layoutContainer';
import { cls, toPercent } from '@/helpers/css';
import { useDOMNode } from '@/hooks/common/useDOMNode';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  /**
   * 透传到根容器的额外 ref，与内部测量 ref 合并。
   * 供视图层挂 viewport 观测 ref（`useViewportTier`）按容器宽度切档。
   */
  rootRef?: RefCallback<HTMLDivElement>;
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

const Layout = ({ children, className, width, height, backgroundColor, rootRef }: LayoutProps) => {
  const [container, setContainer] = useDOMNode<HTMLDivElement>();

  // 合并内部测量 ref 与外部透传 ref，挂到同一根 div
  const setRootRef = useCallback<RefCallback<HTMLDivElement>>(
    (node) => {
      setContainer(node);
      rootRef?.(node);
    },
    [setContainer, rootRef]
  );

  const {
    layout: { updateLayoutHeight, setLastPanelType, pruneDayGridRows },
  } = useCalendarStore();
  const containerClassName = useMemo(() => cls('layout', className), [className]);

  useEffect(() => {
    if (container) {
      const onResizeWindow = () => updateLayoutHeight(container.offsetHeight);

      onResizeWindow();
      window.addEventListener('resize', onResizeWindow);

      return () => window.removeEventListener('resize', onResizeWindow);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]);

  useLayoutEffect(() => {
    if (container) {
      const childArray = Children.toArray(children);

      // 先按当前视图实际渲染的面板裁剪掉切换视图后残留的陈旧面板高度，
      // 否则 getRestPanelHeight 会把上一个视图的面板高度从 time 面板里扣掉，导致网格塌缩。
      const panelNames = childArray
        .filter(
          (child): child is ReactElement<{ name?: string }, string> =>
            !isString(child) && !isNumber(child) && !isNil(child)
        )
        .map((child) => child.props.name)
        .filter((name): name is string => Boolean(name));
      pruneDayGridRows(panelNames);

      const lastChild = childArray[childArray.length - 1];

      if (lastChild && !isString(lastChild) && !isNumber(lastChild) && !isNil(lastChild)) {
        // time / scheduler 等多 panel 视图依赖最后一个 panel 吃掉剩余高度。
        // 这里要等子 panel 完成注册后再同步写入 store，避免最后一行退回默认 72px。
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setLastPanelType((lastChild as unknown as ReactElement<any, string>).props.name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, children]);

  return (
    <LayoutContainerProvider value={container}>
      <div
        ref={setRootRef}
        className={containerClassName}
        style={{ ...getLayoutStylesFromInfo(width, height), backgroundColor }}
      >
        {container ? children : null}
      </div>
    </LayoutContainerProvider>
  );
};

export default Layout;
