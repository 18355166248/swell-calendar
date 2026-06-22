// 移动 tier 检测（宿主侧）
//
// 包内 viewport 原语（getViewportTier / useViewportTier）未公开导出，宿主自带一个轻量等价物。
// 断点与包内 constants/viewport.const.ts 对齐：< TABLET_MIN_WIDTH(768) 视为移动。
import { useEffect, useState } from 'react';

const MOBILE_MAX_WIDTH = 767; // = TABLET_MIN_WIDTH - 1

function query(): string {
  return `(max-width: ${MOBILE_MAX_WIDTH}px)`;
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false; // SSR / 无 matchMedia → 桌面兜底，零回归
    return window.matchMedia(query()).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query());
    // matchMedia('change') 是主信号；个别环境（含部分无头/模拟器）不派发 change，
    // 再挂 window.resize 兜底，统一以 matchMedia 结果为准，保证旋屏 / 改窗实时切换。
    const sync = () => setIsMobile(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    window.addEventListener('resize', sync);
    return () => {
      mql.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  return isMobile;
}
