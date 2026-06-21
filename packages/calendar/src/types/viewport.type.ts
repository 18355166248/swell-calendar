/**
 * 视口档位（viewport tier）
 *
 * 仅按容器宽度划分布局档位，不感知具体设备：
 * - `mobile`：窄屏单列移动布局（对标 iOS 苹果日历 Day/Agenda）
 * - `tablet`：中等宽度，可并排展示多日列（Multi-day）
 * - `desktop`：宽屏桌面布局，保持现状零回归
 */
export type ViewportTier = 'mobile' | 'tablet' | 'desktop';
