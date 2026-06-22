// 农历 / 节气标签（移动端 chrome 用）
//
// 边界：引擎（packages/calendar）不内建农历概念，由宿主 s2 计算后注入视图 chrome。
// 这样既满足移动设计稿的农历/节气展示，又不污染引擎分层。
//
// 选型：chinese-days（MIT、零依赖、~9.5KB gzip），覆盖农历日 + 节气（+ 后续可扩休/班、节日）。
import { getLunarDate, getSolarTerms } from 'chinese-days';

export interface LunarLabel {
  /** 展示文本：节气日优先显示节气名（如「春分」），否则显示农历日（如「初二」）。 */
  text: string;
  /** 是否为节气日（用于设计稿里的绿色星标样式）。 */
  isTerm: boolean;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 单日农历/节气标签。节气名优先于农历日（与移动设计稿一致）。 */
export function lunarLabelOf(date: Date): LunarLabel {
  const iso = toISODate(date);
  // getSolarTerms 同一天至多一个节气，按当日范围查询命中即用其名。
  const term = getSolarTerms(iso, iso)[0];
  if (term) {
    return { text: term.name, isTerm: true };
  }
  const lunar = getLunarDate(iso);
  return { text: lunar.lunarDayCN, isTerm: false };
}
