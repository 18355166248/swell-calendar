// ===== Calendar views =====（移植自设计稿 views.jsx）
import {
  CAT_COLORS,
  type Cat,
  type CalEvent,
  events as ALL_EVENTS,
  monthEvents,
  resources,
  weekDates,
  weekDays,
} from './data';
import { Ic } from './icons';

export interface PickEvent {
  id?: string;
  title: string;
  cat: Cat;
  dateLabel?: string;
  who?: string;
  loc?: string;
  desc?: string;
  start: number;
  end: number;
}
export type OnPick = (ev: PickEvent, anchor: HTMLElement) => void;

const HOUR_START = 8;
const HOUR_END = 20; // 8:00 – 20:00
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const NOW = 14.55; // 14:33 "now"

export const fmtH = (h: number) => {
  const hr = Math.floor(h);
  const m = Math.round((h - hr) * 60);
  return `${hr}:${String(m).padStart(2, '0')}`;
};
export const evRange = (e: { start: number; end: number }) => `${fmtH(e.start)} – ${fmtH(e.end)}`;

interface LaidEvent extends CalEvent {
  _col: number;
  _l: number;
  _w: number;
}

// 简单重叠布局 → 给每个事件分配 _l (左偏移比) 与 _w (宽度比)
function layout(evts: CalEvent[]): LaidEvent[] {
  const sorted = [...evts].sort((a, b) => a.start - b.start || b.end - a.end) as LaidEvent[];
  const cols: LaidEvent[][] = [];
  sorted.forEach((e) => {
    let placed = false;
    for (let c = 0; c < cols.length; c++) {
      if (cols[c][cols[c].length - 1].end <= e.start) {
        cols[c].push(e);
        e._col = c;
        placed = true;
        break;
      }
    }
    if (!placed) {
      e._col = cols.length;
      cols.push([e]);
    }
  });
  const groups = clusters(sorted);
  sorted.forEach((e) => {
    const g = groups.find((gr) => gr.includes(e))!;
    const maxCol = Math.max(...g.map((x) => x._col)) + 1;
    e._w = 1 / maxCol;
    e._l = e._col / maxCol;
  });
  return sorted;
}
function clusters(sorted: LaidEvent[]): LaidEvent[][] {
  const res: LaidEvent[][] = [];
  let cur: LaidEvent[] = [];
  let curEnd = -1;
  sorted.forEach((e) => {
    if (cur.length && e.start >= curEnd) {
      res.push(cur);
      cur = [];
      curEnd = -1;
    }
    cur.push(e);
    curEnd = Math.max(curEnd, e.end);
  });
  if (cur.length) res.push(cur);
  return res;
}

interface DayMeta {
  dow: string;
  date: number;
  today: boolean;
  wknd: boolean;
  dayIndex: number;
}

// ---------- TIME GRID 共享 (Day / Week) ----------
function TimeGrid({
  days,
  events,
  onPick,
  selId,
  hourH,
}: {
  days: DayMeta[];
  events: CalEvent[];
  onPick: OnPick;
  selId?: string;
  hourH: number;
}) {
  const colCount = days.length;
  const topOf = (h: number) => (h - HOUR_START) * hourH;
  const heightOf = (e: CalEvent) => (e.end - e.start) * hourH;
  return (
    <div
      className="timegrid"
      style={{ ['--hour-h' as string]: hourH + 'px', gridTemplateColumns: '64px 1fr' }}
    >
      <div className="tg-corner" />
      <div className="tg-head" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
        {days.map((d, i) => (
          <div
            key={i}
            className={'tg-col-head' + (d.today ? ' today' : '') + (d.wknd ? ' wknd' : '')}
          >
            <div className="tg-dow">{d.dow}</div>
            <div className="tg-date">{d.date}</div>
          </div>
        ))}
      </div>
      <div className="tg-times">
        {HOURS.slice(0, -1).map((h) => (
          <div key={h} className="tg-time-cell" style={{ height: hourH }}>
            <span>{h}:00</span>
          </div>
        ))}
      </div>
      <div className="tg-body" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
        {days.map((d, ci) => {
          const colEvents = events.filter((e) => e.day === d.dayIndex);
          return (
            <div key={ci} className={'tg-col' + (d.wknd ? ' wknd' : '')}>
              {HOURS.slice(0, -1).map((h) => (
                <div key={h} className="tg-hour-line" />
              ))}
              {d.today && (
                <div className="now-line" style={{ top: topOf(NOW) }}>
                  <div className="now-flag">{fmtH(NOW)}</div>
                </div>
              )}
              {layout(colEvents).map((e) => (
                <div
                  key={e.id}
                  className={'ev' + (selId === e.id ? ' sel' : '')}
                  data-cat={e.cat}
                  style={{
                    top: topOf(e.start),
                    height: heightOf(e) - 3,
                    left: `calc(${e._l * 100}% + 3px)`,
                    width: `calc(${e._w * 100}% - 6px)`,
                  }}
                  onClick={(ev) => onPick(e, ev.currentTarget)}
                >
                  <div className="ev-title">{e.title}</div>
                  {e.end - e.start >= 0.75 && <div className="ev-time">{evRange(e)}</div>}
                  {e.end - e.start >= 1.25 && e.who && <div className="ev-who">{e.who}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DayView({
  events,
  onPick,
  selId,
  hourH,
}: {
  events: CalEvent[];
  onPick: OnPick;
  selId?: string;
  hourH: number;
}) {
  const days: DayMeta[] = [{ dow: '周四', date: 21, today: true, wknd: false, dayIndex: 3 }];
  const uniq = events.filter((e) => e.res.startsWith('r'));
  return <TimeGrid days={days} events={uniq} onPick={onPick} selId={selId} hourH={hourH} />;
}

export function WeekView({
  events,
  onPick,
  selId,
  hourH,
  showWknd,
}: {
  events: CalEvent[];
  onPick: OnPick;
  selId?: string;
  hourH: number;
  showWknd: boolean;
}) {
  const days: DayMeta[] = weekDays
    .map((dow, i) => ({ dow, date: weekDates[i], today: i === 3, wknd: i >= 5, dayIndex: i }))
    .filter((d) => showWknd || !d.wknd);
  const uniq = events.filter((e) => e.res.startsWith('r'));
  return <TimeGrid days={days} events={uniq} onPick={onPick} selId={selId} hourH={hourH} />;
}

// ---------- MONTH ----------
export function MonthView({ onPick }: { onPick: OnPick }) {
  const dow = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const firstOffset = 5; // 3月从周六开始 → 周一索引 5
  const cells: {
    dnum: number;
    inMonth: boolean;
    wknd: boolean;
    today: boolean;
    evs: { title: string; cat: Cat }[];
  }[] = [];
  for (let i = 0; i < 35; i++) {
    const dnum = i - firstOffset + 1;
    const inMonth = dnum >= 1 && dnum <= 31;
    cells.push({
      dnum,
      inMonth,
      wknd: i % 7 >= 5,
      today: dnum === 21,
      evs: (inMonth && monthEvents[dnum]) || [],
    });
  }
  return (
    <div className="month">
      <div className="month-dow">
        {dow.map((d, i) => (
          <div key={d} className={i >= 5 ? 'wknd' : ''}>
            {d}
          </div>
        ))}
      </div>
      <div className="month-grid">
        {cells.map((c, i) => (
          <div
            key={i}
            className={
              'mcell' +
              (c.wknd ? ' wknd' : '') +
              (!c.inMonth ? ' dim' : '') +
              (c.today ? ' today' : '')
            }
          >
            <div className="mc-num">
              {c.inMonth ? c.dnum : c.dnum < 1 ? 23 + c.dnum + 5 : c.dnum - 31}
            </div>
            <div className="mc-events">
              {c.evs.slice(0, 3).map((e, j) => (
                <div
                  key={j}
                  className="mc-ev"
                  data-cat={e.cat}
                  onClick={(ev) =>
                    onPick(
                      { title: e.title, cat: e.cat, who: '团队', loc: '—', start: 9, end: 10 },
                      ev.currentTarget
                    )
                  }
                >
                  <span className="mc-dot" />
                  {e.title}
                </div>
              ))}
              {c.evs.length > 3 && <div className="mc-more">+{c.evs.length - 3} 更多</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- SCHEDULER ----------
export function SchedulerView({
  onPick,
  selId,
  rowH,
}: {
  onPick: OnPick;
  selId?: string;
  rowH: number;
}) {
  const dayEvents = ALL_EVENTS.filter((e) => e.day === 3); // 周四切片
  const colW = 92;
  const total = HOURS.length - 1;
  const xOf = (h: number) => (h - HOUR_START) * colW;
  return (
    <div
      className="sched"
      style={{ ['--row-h' as string]: rowH + 'px', gridTemplateColumns: `200px ${total * colW}px` }}
    >
      <div className="sched-corner">资源 / 时间</div>
      <div className="sched-times" style={{ gridTemplateColumns: `repeat(${total}, ${colW}px)` }}>
        {HOURS.slice(0, -1).map((h) => (
          <div key={h} className="sched-time">
            {h}:00
          </div>
        ))}
      </div>
      <div className="sched-left">
        {resources.map((r) => (
          <div key={r.id} className={'sched-res ' + r.type}>
            <div className="sched-res-ava" style={{ background: CAT_COLORS[r.color] }}>
              {r.type === 'person' ? r.initials : <Ic.door />}
            </div>
            <div className="sched-res-meta">
              <div className="sched-res-name">{r.short}</div>
              <div className="sched-res-sub">
                {r.cap}
                {r.floor ? ' · ' + r.floor : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="sched-rows">
        {resources.map((r) => {
          const rEvents = dayEvents.filter((e) => e.res === r.id);
          return (
            <div key={r.id} className="sched-row">
              {HOURS.slice(1, -1).map((h) => (
                <div key={h} className="vline" style={{ left: xOf(h) }} />
              ))}
              {rEvents.map((e) => (
                <div
                  key={e.id}
                  className={'sched-ev' + (selId === e.id ? ' sel' : '')}
                  data-cat={e.cat}
                  style={{ left: xOf(e.start) + 3, width: (e.end - e.start) * colW - 6 }}
                  onClick={(ev) => onPick(e, ev.currentTarget)}
                >
                  <div className="sched-ev-title">{e.title}</div>
                  <div className="sched-ev-time">{evRange(e)}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- TIMELINE ----------
export function TimelineView({ onPick }: { onPick: OnPick }) {
  const byDay: Record<number, CalEvent[]> = {};
  ALL_EVENTS.filter((e) => e.res.startsWith('r')).forEach((e) => {
    (byDay[e.day] = byDay[e.day] || []).push(e);
  });
  const days = [0, 1, 2, 3, 4].filter((d) => byDay[d]);
  const initials: Record<string, string> = { 海景厅: '海', 静思室: '静', 协作区: '协' };
  return (
    <div className="timeline">
      {days.map((d) => {
        const evs = byDay[d].sort((a, b) => a.start - b.start);
        return (
          <div key={d} className="tl-day">
            <div className="tl-day-hd">
              <div className={'tl-day-num' + (d === 3 ? ' today' : '')}>{weekDates[d]}</div>
              <div className="tl-day-dow">
                {weekDays[d]}
                {d === 3 ? ' · 今天' : ''}
              </div>
              <div className="tl-day-meta">{evs.length} 场预定</div>
            </div>
            {evs.map((e) => (
              <div key={e.id} className="tl-item">
                <div className="tl-time">
                  <b>{fmtH(e.start)}</b>
                  {fmtH(e.end)}
                </div>
                <div
                  className="tl-card"
                  data-cat={e.cat}
                  onClick={(ev) => onPick(e, ev.currentTarget)}
                >
                  <div className="tl-rail" />
                  <div className="tl-body">
                    <div className="tl-title">{e.title}</div>
                    <div className="tl-meta">
                      <span>
                        <Ic.pin />
                        {e.loc}
                      </span>
                      <span>
                        <Ic.clock />
                        {Math.round((e.end - e.start) * 60)} 分钟
                      </span>
                      <span>
                        <Ic.users />
                        {e.who}
                      </span>
                    </div>
                  </div>
                  <div className="tl-avatars">
                    <div className="a" style={{ background: CAT_COLORS[e.cat] }}>
                      {(e.loc && initials[e.loc]) || '·'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
