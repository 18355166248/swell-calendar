/**
 * 触发一次轻量触觉反馈（Web Vibration API）。
 *
 * 用于「长按进入编辑态」等需要即时手感确认的交互。
 *
 * 平台支持：
 * - Android Chrome / 多数安卓 WebView 支持 `navigator.vibrate`，会产生一次短震动。
 * - iOS Safari **不支持** `navigator.vibrate`（Taptic 引擎未对 Web 开放），此处静默降级、
 *   无任何副作用与报错。
 *
 * @param durationMs 震动时长（毫秒），默认 15ms 的轻微一下。
 */
export function triggerHapticFeedback(durationMs = 15): void {
  if (typeof navigator === 'undefined') return;

  const vibrate = navigator.vibrate?.bind(navigator);
  if (typeof vibrate !== 'function') return;

  try {
    vibrate(durationMs);
  } catch {
    // 个别环境（无激活手势 / 受限 WebView）调用会抛错，忽略即可。
  }
}
