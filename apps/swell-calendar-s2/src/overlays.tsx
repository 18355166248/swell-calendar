// ===== Overlays: 事件弹窗 + 新建对话框 + 设置面板 + 子栏 =====（移植自设计稿 overlays.jsx）
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { EventObject } from 'swell-calendar';

import type { CalendarHostTuning } from './appCalendarConfig';
import { CAT_COLORS, type Cat, type PickEvent, resources } from './data';
import { Ic } from './icons';

/** 十进制小时 → `H:mm`，如 9.5 → 9:30。 */
const fmtH = (h: number) => {
  const hr = Math.floor(h);
  const m = Math.round((h - hr) * 60);
  return `${hr}:${String(m).padStart(2, '0')}`;
};
/** 事件时间区间标签，如 `9:00 – 10:30`。 */
const evRange = (e: { start: number; end: number }) => `${fmtH(e.start)} – ${fmtH(e.end)}`;
const peopleColors: Cat[] = ['seafoam', 'indigo', 'orange', 'purple'];
const initialsOf = (s: string) => s.replace(/[^一-龥A-Za-z0-9]/g, '').slice(0, 1) || '·';
const getPeople = (value?: string) =>
  (value || '')
    .split(/[·+]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

/**
 * 取折叠事件（月视图 `+N 更多` 浮层）的参与人 / 地点摘要。
 * 优先读引擎透传的 `meta.pickMeta`，回退到原始宿主事件 `raw`。
 */
export function pickEventMeta(event: EventObject): { who?: string; loc?: string } {
  const raw =
    typeof event.raw === 'object' && event.raw !== null
      ? (event.raw as { who?: string; loc?: string })
      : undefined;
  const pickMeta =
    typeof event.meta === 'object' && event.meta && 'pickMeta' in event.meta
      ? (event.meta.pickMeta as { who?: string; loc?: string } | undefined)
      : undefined;

  return {
    who: pickMeta?.who || raw?.who,
    loc: pickMeta?.loc || raw?.loc,
  };
}

/**
 * 折叠事件的时间标签：全天 → 「全天」，否则 `H:mm - H:mm`。
 */
export function formatEventTimeLabel(event: EventObject): string {
  if (event.allDay) {
    return '全天';
  }

  const start = event.start as Date;
  const end = event.end as Date;
  const startLabel = `${start.getHours()}:${String(start.getMinutes()).padStart(2, '0')}`;
  const endLabel = `${end.getHours()}:${String(end.getMinutes()).padStart(2, '0')}`;
  return `${startLabel} - ${endLabel}`;
}

export type PopoverVariant = 'rich' | 'default' | 'minimal';
export type ThemeMode = 'light' | 'dark';
export type AccentPreset = 'seafoam' | 'blue' | 'indigo' | 'magenta';
export type DensityPreset = 'compact' | 'regular' | 'comfy';

export interface UiPrefs {
  theme: ThemeMode;
  accent: AccentPreset;
  density: DensityPreset;
}

const MONTH_STACK_OPTIONS = [2, 3, 4, 5];
const RANGE_OPTIONS = [3, 5, 7, 10];

export function Popover({
  ev,
  anchor,
  onClose,
  variant,
  onEdit,
  onDelete,
}: {
  ev: PickEvent;
  anchor: HTMLElement | null;
  onClose: () => void;
  variant: PopoverVariant;
  onEdit: () => void;
  onDelete: () => void;
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

  const people = getPeople(ev.who);

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
              <button className="pbtn" onClick={onDelete}>
                <Ic.trash />
                删除
              </button>
              <button className="pbtn primary" onClick={onEdit}>
                <Ic.edit />
                编辑
              </button>
            </div>
          )}
          {variant === 'default' && (
            <div className="pop-actions">
              <button className="pbtn" onClick={onDelete}>
                <Ic.trash />
                删除
              </button>
              <button className="pbtn primary" onClick={onEdit}>
                <Ic.edit />
                编辑
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

export function MobileEventSheet({
  ev,
  onClose,
  onEdit,
  onDelete,
}: {
  ev: PickEvent;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const people = getPeople(ev.who);

  return (
    <div className="m-sheet-layer" onMouseDown={onClose}>
      <section
        className="m-sheet"
        data-cat={ev.cat}
        role="dialog"
        aria-modal="true"
        aria-label="日程详情"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="m-sheet__grabber" aria-hidden />
        <div className="m-sheet__head">
          <div className="m-sheet__accent" aria-hidden />
          <div className="m-sheet__title-wrap">
            <div className="m-sheet__title">{ev.title}</div>
            <div className="m-sheet__meta">
              {ev.dateLabel || '未指定日期'} · {evRange(ev)}
            </div>
          </div>
          <button type="button" className="m-sheet__close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="m-sheet__rows">
          <div className="m-sheet__row">
            <Ic.clock />
            <span>
              {ev.dateLabel || '未指定日期'} · {evRange(ev)}
              <span className="m-sheet__muted">
                （{Math.round((ev.end - ev.start) * 60)} 分钟）
              </span>
            </span>
          </div>
          <div className="m-sheet__row">
            <Ic.pin />
            <span>{ev.loc || '未指定地点'}</span>
          </div>
          {ev.desc && (
            <div className="m-sheet__row">
              <Ic.inbox />
              <span className="m-sheet__muted">{ev.desc}</span>
            </div>
          )}
          <div className="m-sheet__row m-sheet__row--people">
            <Ic.users />
            <div className="m-sheet__people">
              {people.length > 0 && (
                <div className="m-sheet__avatars" aria-hidden>
                  {people.map((person, index) => (
                    <span
                      key={`${person}-${index}`}
                      className="m-sheet__avatar"
                      style={{ background: CAT_COLORS[peopleColors[index % peopleColors.length]] }}
                    >
                      {initialsOf(person)}
                    </span>
                  ))}
                </div>
              )}
              <span>{ev.who || '未指定参与人'}</span>
            </div>
          </div>
        </div>

        <div className="m-sheet__actions">
          <button type="button" className="m-sheet__btn" onClick={onDelete}>
            <Ic.trash />
            删除
          </button>
          <button type="button" className="m-sheet__btn m-sheet__btn--primary" onClick={onEdit}>
            <Ic.edit />
            编辑
          </button>
        </div>
      </section>
    </div>
  );
}

/** 「+N 更多」浮层：列出某日所有事件，点击单个事件可转发到详情 Popover。 */
export function MoreEventsPopover({
  date,
  events,
  anchor,
  onClose,
  onEventClick,
  onEventEdit,
  onEventDelete,
  variant = 'popover',
}: {
  date: Date;
  events: EventObject[];
  anchor: HTMLElement | null;
  onClose: () => void;
  onEventClick?: (eventId: string, anchor: HTMLElement | null) => void;
  onEventEdit?: (eventId: string) => void;
  onEventDelete?: (event: EventObject) => void;
  /** 'sheet' 在移动端改为底部全宽 sheet；'popover' 桌面锚定弹层。 */
  variant?: 'popover' | 'sheet';
}) {
  const isSheet = variant === 'sheet';
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: -999, left: -999 });
  useLayoutEffect(() => {
    if (isSheet || !anchor || !ref.current) return;
    const a = anchor.getBoundingClientRect();
    const p = ref.current.getBoundingClientRect();
    let left = a.left;
    let top = a.bottom + 6;
    if (left + p.width > window.innerWidth - 12) left = window.innerWidth - p.width - 12;
    if (left < 12) left = 12;
    if (top + p.height > window.innerHeight - 12) top = a.top - p.height - 6;
    if (top < 12) top = 12;
    setPos({ top, left });
  }, [anchor, date, isSheet]);

  const dateLabel = `${date.getMonth() + 1}月${date.getDate()}日`;

  const getEventMeta = pickEventMeta;
  const getTimeLabel = formatEventTimeLabel;

  return (
    <div className={'pop-layer' + (isSheet ? ' pop-layer--sheet' : '')} onMouseDown={onClose}>
      <div
        ref={ref}
        className={'pop more-events-pop' + (isSheet ? ' more-events-pop--sheet' : '')}
        style={
          isSheet ? undefined : { top: pos.top, left: pos.left, opacity: pos.top > -900 ? 1 : 0 }
        }
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isSheet && <div className="dialog__grabber" aria-hidden />}
        <div className="pop-body">
          <div className="pop-top">
            <div className="pop-title">{dateLabel}</div>
            <button className="pop-x" onClick={onClose}>
              ✕
            </button>
          </div>
          <div className="more-events-list">
            {events.map((ev) =>
              (() => {
                const meta = getEventMeta(ev);
                return (
                  <div
                    key={ev.id ?? ev.title}
                    className="more-event-row"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => ev.id && onEventClick?.(ev.id, e.currentTarget as HTMLElement)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        ev.id && onEventClick?.(ev.id, e.currentTarget as HTMLElement);
                      }
                    }}
                  >
                    <span
                      className="more-event-bar"
                      style={{
                        backgroundColor: (ev.backgroundColor as string) || 'var(--accent-bg)',
                      }}
                    />
                    <div className="more-event-main">
                      <div className="more-event-summary">
                        <span className="more-event-title">{ev.title}</span>
                        <span className="more-event-time muted">{getTimeLabel(ev)}</span>
                      </div>
                      {(meta.who || meta.loc) && (
                        <div
                          className="muted"
                          style={{
                            marginTop: 4,
                            display: 'flex',
                            gap: 10,
                            flexWrap: 'wrap',
                            fontSize: 12,
                          }}
                        >
                          {meta.who && <span>{meta.who}</span>}
                          {meta.loc && <span>{meta.loc}</span>}
                        </div>
                      )}
                    </div>
                    <div className="more-event-actions">
                      {onEventDelete && (
                        <button
                          type="button"
                          className="pbtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventDelete(ev);
                          }}
                        >
                          删除
                        </button>
                      )}
                      {ev.id && onEventEdit && (
                        <button
                          type="button"
                          className="pbtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventEdit(ev.id as string);
                          }}
                        >
                          编辑
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 新建对话框回填给 App 的原始输入（App 负责转成 CalEvent 落库）。 */
export interface NewEventInput {
  title: string;
  res: string;
  date: string; // YYYY-MM-DD（开始日）
  endDate: string; // YYYY-MM-DD（结束日；单日事件与 date 相同）
  start: string; // HH:mm
  end: string; // HH:mm
  cat: Cat;
  allDay?: boolean;
  /** 'none' | 'daily' | 'weekly' | 'biweekly' */
  recurrence?: string;
}

export function CreateDialog({
  onClose,
  onCreate,
  onDelete,
  initial,
  isEdit = false,
  variant = 'dialog',
}: {
  onClose: () => void;
  onCreate: (input: NewEventInput) => void;
  onDelete?: () => void;
  /** 预填字段：编辑既有事件、或新建时由网格选区/单元格点击预填的时间。 */
  initial?: NewEventInput;
  /**
   * 是否为编辑既有事件。区分「编辑」与「带预填的新建」——
   * 二者都会传 `initial`，不能再用 `!!initial` 推断模式，否则拖拽创建会误显示「编辑日程」。
   */
  isEdit?: boolean;
  /**
   * 'sheet' 底部全宽 sheet；'page' 移动端全屏页面（iOS 风格，顶部导航栏 + 可滚动表单，
   * 避免软键盘把底部 sheet 顶出屏幕）；桌面默认居中对话框。
   */
  variant?: 'dialog' | 'sheet' | 'page';
}) {
  const isSheet = variant === 'sheet';
  const isPage = variant === 'page';
  const cats: { c: Cat; label: string }[] = [
    { c: 'seafoam', label: '会议' },
    { c: 'indigo', label: '规划' },
    { c: 'magenta', label: '1:1' },
    { c: 'orange', label: '对外' },
    { c: 'green', label: '协作' },
    { c: 'purple', label: '面试' },
  ];
  const [cat, setCat] = useState<Cat>(initial?.cat ?? 'seafoam');
  const [rep, setRep] = useState(initial?.recurrence ?? 'none');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [res, setRes] = useState(initial?.res ?? resources[0]?.id ?? 'r1');
  const [date, setDate] = useState(initial?.date ?? '2025-03-21');
  const [endDate, setEndDate] = useState(initial?.endDate ?? initial?.date ?? '2025-03-21');
  const [start, setStart] = useState(initial?.start ?? '09:00');
  const [end, setEnd] = useState(initial?.end ?? '10:00');
  const [err, setErr] = useState<string | null>(null);

  // 全屏页：iOS Safari 软键盘会把 position:fixed 整页随焦点上推、顶部导航栏被顶出屏幕。
  // 用 VisualViewport 把整页锁到「可视视口」——键盘弹出时页面只占键盘上方可见区、
  // 顶部导航栏始终钉在可见区顶部，表单在内部滚动；键盘收起后还原。
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isPage) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      const el = pageRef.current;
      if (!el) return;
      el.style.height = `${vv.height}px`;
      el.style.transform = `translateY(${vv.offsetTop}px)`;
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, [isPage]);

  const submit = () => {
    if (!title.trim()) {
      setErr('请填写标题');
      return;
    }
    // 跨天比较完整的「日期+时间」时间戳，而非仅比较时间——
    // 否则周一 14:00 → 周二 10:00 这类跨天事件会被误判为结束早于开始
    if (`${endDate}T${end}` <= `${date}T${start}`) {
      setErr('结束时间需晚于开始时间');
      return;
    }
    onCreate({
      title: title.trim(),
      res,
      date,
      endDate,
      start,
      end,
      cat,
      allDay: initial?.allDay,
      recurrence: rep,
    });
    onClose();
  };

  const formBody = (
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
          <div className="field-label">开始</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="field-input"
              type="date"
              value={date}
              onChange={(e) => {
                const next = e.target.value;
                setDate(next);
                // 开始日晚于结束日时，把结束日跟着前移，避免出现负跨度
                if (endDate < next) setEndDate(next);
              }}
            />
            <input
              className="field-input"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <div className="field-label">结束</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="field-input"
              type="date"
              value={endDate}
              min={date}
              onChange={(e) => setEndDate(e.target.value)}
            />
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
  );

  // iOS 风格全屏编辑页：顶部导航栏固定，表单区独立滚动；不盖半透明遮罩、不点击外部关闭。
  if (isPage) {
    return (
      <div className="dialog dialog--page" role="dialog" aria-modal="true" ref={pageRef}>
        <div className="page-nav">
          <button type="button" className="page-nav__btn" onClick={onClose}>
            取消
          </button>
          <div className="page-nav__title">{isEdit ? '编辑日程' : '新建日程'}</div>
          <button type="button" className="page-nav__btn page-nav__btn--primary" onClick={submit}>
            {isEdit ? '保存' : '完成'}
          </button>
        </div>
        {err && <div className="page-err">{err}</div>}
        {formBody}
        {isEdit && onDelete && (
          <div className="page-delete-section">
            <button type="button" className="dlg-btn page-delete-btn" onClick={onDelete}>
              删除日程
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={'scrim' + (isSheet ? ' scrim--sheet' : '')} onMouseDown={onClose}>
      <div
        className={'dialog' + (isSheet ? ' dialog--sheet' : '')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isSheet && <div className="dialog__grabber" aria-hidden />}
        <div className="dlg-hd">
          <div className="dlg-title">{isEdit ? '编辑日程' : '新建日程'}</div>
          <div className="dlg-sub">
            {isEdit ? '修改已有日程的安排' : '为会议室或成员预定时间段'}
          </div>
        </div>
        {formBody}
        <div className="dlg-foot">
          {err && (
            <span style={{ color: 'var(--cat-magenta-line)', marginRight: 'auto' }}>{err}</span>
          )}
          <button className="dlg-btn" onClick={onClose}>
            取消
          </button>
          {isEdit && onDelete && (
            <button className="dlg-btn" onClick={onDelete}>
              删除
            </button>
          )}
          <button className="dlg-btn primary" onClick={submit}>
            {isEdit ? '保存' : '创建日程'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsPanel({
  anchor,
  value,
  tuning,
  onChange,
  onTuningChange,
  onClose,
}: {
  anchor: HTMLElement | null;
  value: UiPrefs;
  tuning: CalendarHostTuning;
  onChange: (next: UiPrefs) => void;
  onTuningChange: (next: CalendarHostTuning) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: -999, left: -999 });

  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const a = anchor.getBoundingClientRect();
    const p = ref.current.getBoundingClientRect();
    let left = a.right - p.width;
    let top = a.bottom + 10;
    if (left < 12) left = 12;
    if (left + p.width > window.innerWidth - 12) left = window.innerWidth - p.width - 12;
    if (top + p.height > window.innerHeight - 12) top = a.top - p.height - 10;
    if (top < 12) top = 12;
    setPos({ top, left });
  }, [anchor, value]);

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: '浅色' },
    { value: 'dark', label: '深色' },
  ];
  const accentOptions: { value: AccentPreset; label: string }[] = [
    { value: 'seafoam', label: 'Seafoam' },
    { value: 'blue', label: 'Blue' },
    { value: 'indigo', label: 'Indigo' },
    { value: 'magenta', label: 'Magenta' },
  ];
  const densityOptions: { value: DensityPreset; label: string }[] = [
    { value: 'compact', label: '紧凑' },
    { value: 'regular', label: '常规' },
    { value: 'comfy', label: '舒展' },
  ];

  return (
    <div className="pop-layer" onMouseDown={onClose}>
      <div
        ref={ref}
        className="settings-panel"
        style={{ top: pos.top, left: pos.left, opacity: pos.top > -900 ? 1 : 0 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="settings-hd">
          <div>
            <div className="settings-title">界面设置</div>
            <div className="settings-sub">实时切换外壳主题与日历密度</div>
          </div>
          <button className="pop-x" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-group">
          <div className="settings-label">明暗模式</div>
          <div className="settings-row">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                className={'settings-pill' + (value.theme === option.value ? ' active' : '')}
                onClick={() => onChange({ ...value, theme: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-label">强调色</div>
          <div className="settings-accent-grid">
            {accentOptions.map((option) => (
              <button
                key={option.value}
                className={'settings-accent' + (value.accent === option.value ? ' active' : '')}
                onClick={() => onChange({ ...value, accent: option.value })}
              >
                <span className="settings-accent-swatch" data-accent={option.value} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-label">信息密度</div>
          <div className="settings-row">
            {densityOptions.map((option) => (
              <button
                key={option.value}
                className={'settings-pill' + (value.density === option.value ? ' active' : '')}
                onClick={() => onChange({ ...value, density: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-label">日历布局</div>
          <div className="settings-stack">
            <div className="settings-control">
              <div className="settings-control__meta">
                <div className="settings-control__title">月视图堆叠</div>
                <div className="settings-control__sub">每个日期格默认直接展示的事件条数</div>
              </div>
              <div className="settings-row">
                {MONTH_STACK_OPTIONS.map((option) => (
                  <button
                    key={option}
                    className={
                      'settings-pill' + (tuning.monthMaxEventStack === option ? ' active' : '')
                    }
                    onClick={() => onTuningChange({ ...tuning, monthMaxEventStack: option })}
                  >
                    {option} 条
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-control">
              <div className="settings-control__meta">
                <div className="settings-control__title">资源调度窗口</div>
                <div className="settings-control__sub">控制 scheduler 连续显示多少天</div>
              </div>
              <div className="settings-row">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    className={
                      'settings-pill' + (tuning.schedulerRange === option ? ' active' : '')
                    }
                    onClick={() => onTuningChange({ ...tuning, schedulerRange: option })}
                  >
                    {option} 天
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-control">
              <div className="settings-control__meta">
                <div className="settings-control__title">时间线窗口</div>
                <div className="settings-control__sub">控制 timeline 连续显示多少天</div>
              </div>
              <div className="settings-row">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    className={'settings-pill' + (tuning.timelineRange === option ? ' active' : '')}
                    onClick={() => onTuningChange({ ...tuning, timelineRange: option })}
                  >
                    {option} 天
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export type RecurrenceScopeAction = 'single' | 'following' | 'all';

/** 重复事件操作范围弹框：此次 / 此后 / 全部。 */
export function RecurrenceScopeDialog({
  mode,
  onConfirm,
  onCancel,
}: {
  mode: 'edit' | 'delete';
  onConfirm: (scope: RecurrenceScopeAction) => void | Promise<void>;
  onCancel: () => void;
}) {
  return (
    <div className="scrim" onMouseDown={onCancel}>
      <div className="dialog" style={{ maxWidth: 340 }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="dlg-hd">
          <div className="dlg-title">{mode === 'delete' ? '删除重复日程' : '编辑重复日程'}</div>
          <div className="dlg-sub">
            {mode === 'delete' ? '要删除哪些日程？' : '要修改哪些日程？'}
          </div>
        </div>
        <div className="dlg-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(
            [
              ['single', '仅此次', '只影响本次发生'],
              ['following', '此次及之后', '本次及之后的所有发生'],
              ['all', '全部', '所有发生（包括过去的）'],
            ] as [RecurrenceScopeAction, string, string][]
          ).map(([scope, label, sub]) => (
            <button
              key={scope}
              className="dlg-btn"
              style={{ textAlign: 'left', display: 'block', padding: '10px 14px' }}
              onClick={() => onConfirm(scope)}
            >
              <div style={{ fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{sub}</div>
            </button>
          ))}
        </div>
        <div className="dlg-foot">
          <button className="dlg-btn" onClick={onCancel}>
            取消
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
  showWeekendToggle,
  showMonthNarrowWeekendToggle,
  monthNarrowWeekend,
  setMonthNarrowWeekend,
  activeCats,
  onToggleCat,
  onShowAll,
}: {
  showWknd: boolean;
  setShowWknd: (v: boolean) => void;
  /** 仅在能切换周末列的视图显示「显示周末」开关。 */
  showWeekendToggle: boolean;
  /** 月视图专用：窄周末列宽。 */
  showMonthNarrowWeekendToggle: boolean;
  monthNarrowWeekend: boolean;
  setMonthNarrowWeekend: (v: boolean) => void;
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
      {showWeekendToggle && (
        <label className="mini-toggle" onClick={() => setShowWknd(!showWknd)}>
          显示周末 <span className={'switch' + (showWknd ? ' on' : '')} />
        </label>
      )}
      {showMonthNarrowWeekendToggle && (
        <label className="mini-toggle" onClick={() => setMonthNarrowWeekend(!monthNarrowWeekend)}>
          窄周末 <span className={'switch' + (monthNarrowWeekend ? ' on' : '')} />
        </label>
      )}
    </div>
  );
}
