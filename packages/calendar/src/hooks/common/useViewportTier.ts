import type { RefCallback } from 'react';

import { useContainerWidth } from '@/hooks/common/useContainerWidth';
import type { ViewportTier } from '@/types/viewport.type';
import { getViewportTier } from '@/utils/viewport';

/**
 * 观测根容器宽度并换算成视口档位（M1 响应式基线入口）
 *
 * 组合 `useContainerWidth`（DOM 读取）与 `getViewportTier`（纯函数判定）：
 * 组件只需把返回的 ref 挂到根容器，即可按 `tier` 切换布局类名。
 *
 * @returns `[tier, setRef]` —— 当前视口档位与挂到根容器的 ref 回调
 */
export function useViewportTier(): [ViewportTier, RefCallback<HTMLElement>] {
  const [width, setRef] = useContainerWidth();

  return [getViewportTier(width), setRef];
}
