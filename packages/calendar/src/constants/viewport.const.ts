/**
 * 视口档位断点（单位：px，按容器宽度划分）
 *
 * 语义为「下界包含、上界排除」：
 * - `[0, TABLET_MIN_WIDTH)`            → mobile
 * - `[TABLET_MIN_WIDTH, DESKTOP_MIN_WIDTH)` → tablet
 * - `[DESKTOP_MIN_WIDTH, ∞)`          → desktop
 *
 * 桌面下界取 1024，保证现有桌面布局判定为 `desktop`，实现零回归。
 */
export const TABLET_MIN_WIDTH = 768;
export const DESKTOP_MIN_WIDTH = 1024;
