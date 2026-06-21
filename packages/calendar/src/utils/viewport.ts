import { DESKTOP_MIN_WIDTH, TABLET_MIN_WIDTH } from '@/constants/viewport.const';
import type { ViewportTier } from '@/types/viewport.type';

/**
 * 根据容器宽度计算视口档位（纯函数，不依赖 React / DOM）
 *
 * 断点语义「下界包含、上界排除」，见 `constants/viewport.const.ts`：
 * - width < 768  → 'mobile'
 * - width < 1024 → 'tablet'
 * - 否则         → 'desktop'
 *
 * 负数 / NaN 等非法宽度按最窄档 'mobile' 兜底，避免上层崩溃。
 *
 * 示例：
 * getViewportTier(375)  // 'mobile'
 * getViewportTier(820)  // 'tablet'
 * getViewportTier(1280) // 'desktop'
 *
 * @param width 容器宽度（px）
 * @returns 对应的视口档位
 */
export function getViewportTier(width: number): ViewportTier {
  if (!Number.isFinite(width) || width < TABLET_MIN_WIDTH) {
    return 'mobile';
  }

  if (width < DESKTOP_MIN_WIDTH) {
    return 'tablet';
  }

  return 'desktop';
}

/**
 * 按视口档位生成视图根类名（桌面零回归）
 *
 * - `desktop`：仅返回基类，与现状完全一致，保证桌面零回归
 * - 其余档位：基类后追加 `${base}--${tier}` 修饰类，供移动 / 平板 CSS 命中
 *
 * 示例：
 * getTierClassName('day-view', 'desktop') // 'day-view'
 * getTierClassName('day-view', 'mobile')  // 'day-view day-view--mobile'
 *
 * @param base 视图基础类名
 * @param tier 当前视口档位
 * @returns 拼接后的根类名
 */
export function getTierClassName(base: string, tier: ViewportTier): string {
  return tier === 'desktop' ? base : `${base} ${base}--${tier}`;
}
