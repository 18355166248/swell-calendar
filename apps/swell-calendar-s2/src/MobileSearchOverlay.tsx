// 移动端搜索浮层（独立文件）：依赖 @react-spectrum/s2 SearchField，会引入 S2 的 .css。
// 单独成文件，避免 overlays.tsx 引入 S2 后污染纯 node 环境下的单测（calendarData.spec 等
// 经 `import type` 触达 overlays，S2 的 .css 在 node 测试环境无法解析）。
import { SearchField } from '@react-spectrum/s2';

import { CAT_COLORS, type Cat } from './data';

export interface MobileSearchHit {
  id: string;
  title: string;
  cat: Cat;
  dateLabel: string;
  timeLabel: string;
  meta: string;
}

/**
 * 从顶部下滑的搜索浮层：自带输入框与命中结果列表，覆盖在当前视图之上，
 * 不切视图、不挤动底层布局。点结果转发到事件详情，取消 / 点击遮罩关闭。
 */
export function MobileSearchOverlay({
  query,
  onQueryChange,
  hits,
  onPick,
  onClose,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  hits: MobileSearchHit[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const trimmed = query.trim();
  return (
    <div className="m-search-layer" onMouseDown={onClose}>
      <section
        className="m-search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="搜索日程"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="m-search-bar">
          <SearchField
            autoFocus
            size="S"
            aria-label="搜索日程"
            placeholder="搜索日程、地点、与会人…"
            value={query}
            onChange={onQueryChange}
            UNSAFE_className="s2-sf m-search-field"
          />
          <button type="button" className="m-search-cancel" onClick={onClose}>
            取消
          </button>
        </div>
        <div className="m-search-results">
          {trimmed === '' ? (
            <p className="m-search-empty">输入关键词搜索日程</p>
          ) : hits.length === 0 ? (
            <p className="m-search-empty">没有匹配「{trimmed}」的日程</p>
          ) : (
            hits.map((hit) => (
              <button
                key={hit.id}
                type="button"
                className="m-search-hit"
                onClick={() => onPick(hit.id)}
              >
                <span
                  className="m-search-hit__rail"
                  style={{ background: CAT_COLORS[hit.cat] }}
                  aria-hidden
                />
                <span className="m-search-hit__body">
                  <span className="m-search-hit__title">{hit.title}</span>
                  {hit.meta && <span className="m-search-hit__meta">{hit.meta}</span>}
                </span>
                <span className="m-search-hit__when">
                  <span className="m-search-hit__date">{hit.dateLabel}</span>
                  <span className="m-search-hit__time">{hit.timeLabel}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
