// ===== Overlays: 事件弹窗 + 新建对话框 + 子栏 =====（移植自设计稿 overlays.jsx）
import { useLayoutEffect, useRef, useState } from 'react';

import { CAT_COLORS, type Cat, resources } from './data';
import { Ic } from './icons';
import { evRange, type PickEvent } from './views';

export type PopoverVariant = 'rich' | 'default' | 'minimal';

export function Popover({
  ev,
  anchor,
  onClose,
  variant,
}: {
  ev: PickEvent;
  anchor: HTMLElement | null;
  onClose: () => void;
  variant: PopoverVariant;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: -999, left: -999 });
  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const a = anchor.getBoundingClientRect();
    const p = ref.current.getBoundingClientRect();
    let left = a.right + 10;
    let top = a.top;
    if (left + p.width > window.innerWidth - 12) left = a.left - p.width - 10;
    if (left < 12) left = Math.max(12, a.left);
    if (top + p.height > window.innerHeight - 12) top = window.innerHeight - p.height - 12;
    if (top < 12) top = 12;
    setPos({ top, left });
  }, [anchor, ev]);

  const people = (ev.who || '')
    .split(/[·+]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
  const initialsOf = (s: string) => s.replace(/[^一-龥A-Za-z0-9]/g, '').slice(0, 1) || '·';
  const peopleColors: Cat[] = ['seafoam', 'indigo', 'orange', 'purple'];

  return (
    <div className="pop-layer" onMouseDown={onClose}>
      <div
        ref={ref}
        className="pop"
        data-cat={ev.cat}
        style={{ top: pos.top, left: pos.left, opacity: pos.top > -900 ? 1 : 0 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {variant !== 'minimal' && <div className="pop-accent" />}
        <div className="pop-body">
          <div className="pop-top">
            <div className="pop-title">{ev.title}</div>
            <button className="pop-x" onClick={onClose}>
              ✕
            </button>
          </div>
          <div className="pop-rows">
            <div className="pop-row">
              <Ic.clock />
              <span>
                {ev.dateLabel || '3月21'} · {evRange(ev)}{' '}
                <span className="muted">({Math.round((ev.end - ev.start) * 60)} 分钟)</span>
              </span>
            </div>
            <div className="pop-row">
              <Ic.pin />
              <span>{ev.loc || '未指定地点'}</span>
            </div>
            {ev.desc && variant === 'rich' && (
              <div className="pop-row">
                <Ic.inbox />
                <span className="muted">{ev.desc}</span>
              </div>
            )}
            <div className="pop-row">
              <Ic.users />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex' }}>
                  {people.map((p, i) => (
                    <div
                      key={i}
                      className="a"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        border: '2px solid var(--bg-layer-2)',
                        marginLeft: i ? -8 : 0,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#fff',
                        background: CAT_COLORS[peopleColors[i % 4]],
                      }}
                    >
                      {initialsOf(p)}
                    </div>
                  ))}
                </div>
                <span>{ev.who}</span>
              </div>
            </div>
          </div>
          {variant === 'rich' && (
            <div className="pop-actions">
              <button className="pbtn">
                <Ic.video />
                加入
              </button>
              <button className="pbtn">
                <Ic.edit />
                编辑
              </button>
              <button className="pbtn primary">
                <Ic.check />
                接受
              </button>
            </div>
          )}
          {variant === 'default' && (
            <div className="pop-actions">
              <button className="pbtn">
                <Ic.edit />
                编辑
              </button>
              <button className="pbtn primary">
                <Ic.check />
                接受
              </button>
            </div>
          )}
          {variant === 'minimal' && (
            <div className="pop-actions">
              <button className="pbtn primary" onClick={onClose}>
                知道了
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** 新建对话框回填给 App 的原始输入（App 负责转成 CalEvent 落库）。 */
export interface NewEventInput {
  title: string;
  res: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  cat: Cat;
}

export function CreateDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: NewEventInput) => void;
}) {
  const cats: { c: Cat; label: string }[] = [
    { c: 'seafoam', label: '会议' },
    { c: 'indigo', label: '规划' },
    { c: 'magenta', label: '1:1' },
    { c: 'orange', label: '对外' },
    { c: 'green', label: '协作' },
    { c: 'purple', label: '面试' },
  ];
  const [cat, setCat] = useState<Cat>('seafoam');
  const [rep, setRep] = useState('none');
  const [title, setTitle] = useState('');
  const [res, setRes] = useState(resources[0]?.id ?? 'r1');
  const [date, setDate] = useState('2025-03-21');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    if (!title.trim()) {
      setErr('请填写标题');
      return;
    }
    if (end <= start) {
      setErr('结束时间需晚于开始时间');
      return;
    }
    onCreate({ title: title.trim(), res, date, start, end, cat });
    onClose();
  };

  return (
    <div className="scrim" onMouseDown={onClose}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dlg-hd">
          <div className="dlg-title">新建日程</div>
          <div className="dlg-sub">为会议室或成员预定时间段</div>
        </div>
        <div className="dlg-body">
          <div className="field">
            <div className="field-label">标题</div>
            <input
              className="field-input"
              autoFocus
              placeholder="例如：产品双周评审"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <div className="field-label">资源</div>
            <select className="field-select" value={res} onChange={(e) => setRes(e.target.value)}>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <div className="field-label">日期</div>
              <input
                className="field-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="field">
              <div className="field-label">时间</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="field-input"
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
                <span style={{ color: 'var(--text-3)' }}>–</span>
                <input
                  className="field-input"
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="field">
            <div className="field-label">分类</div>
            <div className="cat-picker">
              {cats.map((c) => (
                <div
                  key={c.c}
                  className={'cat-dot' + (cat === c.c ? ' sel' : '')}
                  title={c.label}
                  style={{ background: CAT_COLORS[c.c] }}
                  onClick={() => setCat(c.c)}
                >
                  <Ic.check />
                </div>
              ))}
            </div>
          </div>
          <div className="field">
            <div className="field-label">重复</div>
            <div className="seg-pills">
              {[
                ['none', '不重复'],
                ['daily', '每天'],
                ['weekly', '每周'],
                ['biweekly', '双周'],
              ].map(([k, l]) => (
                <button
                  key={k}
                  className={'seg-pill' + (rep === k ? ' on' : '')}
                  onClick={() => setRep(k)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="dlg-foot">
          {err && (
            <span style={{ color: 'var(--cat-magenta-line)', marginRight: 'auto' }}>{err}</span>
          )}
          <button className="dlg-btn" onClick={onClose}>
            取消
          </button>
          <button className="dlg-btn primary" onClick={submit}>
            创建日程
          </button>
        </div>
      </div>
    </div>
  );
}

/** 子栏分类 chips 控制的分类集合（用于 App 端构造初始过滤态与判定可过滤分类）。 */
export const SUBBAR_CATS: { c: Cat; label: string }[] = [
  { c: 'seafoam', label: '会议·评审' },
  { c: 'indigo', label: '规划·设计' },
  { c: 'orange', label: '客户·对外' },
  { c: 'green', label: '工程·协作' },
  { c: 'purple', label: '面试·招聘' },
];
export const FILTER_CATS: Cat[] = SUBBAR_CATS.map((c) => c.c);

export function SubBar({
  showWknd,
  setShowWknd,
  activeCats,
  onToggleCat,
  onShowAll,
}: {
  showWknd: boolean;
  setShowWknd: (v: boolean) => void;
  activeCats: Set<Cat>;
  onToggleCat: (c: Cat) => void;
  onShowAll: () => void;
}) {
  const allOn = SUBBAR_CATS.every((c) => activeCats.has(c.c));
  return (
    <div className="subbar">
      <div className="chips">
        {/* 已过滤时点「全部」一键恢复显示所有分类 */}
        <button className="chip" onClick={onShowAll} disabled={allOn}>
          <Ic.filter />
          {allOn ? '筛选' : '全部'}
        </button>
        {SUBBAR_CATS.map((c) => (
          <button
            key={c.c}
            className={'chip' + (activeCats.has(c.c) ? ' on' : '')}
            onClick={() => onToggleCat(c.c)}
          >
            <span className="swatch" style={{ background: CAT_COLORS[c.c] }} />
            {c.label}
          </button>
        ))}
      </div>
      <div className="tb-spacer" />
      <label className="mini-toggle" onClick={() => setShowWknd(!showWknd)}>
        显示周末 <span className={'switch' + (showWknd ? ' on' : '')} />
      </label>
    </div>
  );
}
