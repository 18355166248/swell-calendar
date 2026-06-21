import type { RefCallback } from 'react';
import { useEffect, useState } from 'react';

import { DESKTOP_MIN_WIDTH } from '@/constants/viewport.const';
import { useDOMNode } from '@/hooks/common/useDOMNode';

/**
 * 通过 `ResizeObserver` 观测根容器宽度（DOM 读取集中在 hooks 层，不污染纯函数）
 *
 * 兜底策略：初始宽度默认取桌面下界，保证 SSR / 无 `ResizeObserver` 环境 /
 * 首帧未测量时落在桌面档，符合「桌面零回归」基线；挂载后由观测值修正。
 *
 * @param initialWidth 测量前的初始宽度，默认桌面下界
 * @returns `[width, setRef]` —— 当前宽度与挂到根容器的 ref 回调
 */
export function useContainerWidth(
  initialWidth: number = DESKTOP_MIN_WIDTH
): [number, RefCallback<HTMLElement>] {
  const [node, setRef] = useDOMNode<HTMLElement>();
  const [width, setWidth] = useState(initialWidth);

  useEffect(() => {
    if (!node) return;

    const measure = () => setWidth(node.clientWidth);

    measure();

    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(measure);
    ro.observe(node);

    return () => ro.disconnect();
  }, [node]);

  return [width, setRef];
}
