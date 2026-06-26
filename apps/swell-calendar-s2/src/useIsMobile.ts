// 移动端外壳检测（宿主侧）
//
// 外壳负责响应式布局切换：小屏 viewport 应进入移动端壳，便于浏览器设备模拟与真实手机一致。
// 桌面预览里具体事件卡片的鼠标/长按差异由 calendar 包内 pointer 类型判定兜底。
import { useEffect, useState } from 'react';

const MOBILE_MAX_WIDTH = 767; // = TABLET_MIN_WIDTH - 1

function widthQuery(): string {
  return `(max-width: ${MOBILE_MAX_WIDTH}px)`;
}

export function detectMobileShell(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(widthQuery()).matches;
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => detectMobileShell());

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const widthMql = window.matchMedia(widthQuery());
    // matchMedia('change') 是主信号；个别环境（含部分无头/模拟器）不派发 change，
    // 再挂 window.resize 兜底，统一以宽度结果为准，保证旋屏 / 改窗实时切换。
    const sync = () => setIsMobile(widthMql.matches);
    sync();
    widthMql.addEventListener('change', sync);
    window.addEventListener('resize', sync);
    return () => {
      widthMql.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  return isMobile;
}
