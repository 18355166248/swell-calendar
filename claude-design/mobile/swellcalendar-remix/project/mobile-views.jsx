// ===== swell-calendar mobile · views =====
const M_CAT = {
  seafoam: "var(--cat-seafoam-line)", indigo: "var(--cat-indigo-line)", magenta: "var(--cat-magenta-line)",
  orange: "var(--cat-orange-line)", green: "var(--cat-green-line)", purple: "var(--cat-purple-line)",
};
const HSTART = 0, HEND = 24, HOUR_H = 52, NOW = 14.55, TODAY = 21;
const ROOM = SWELL.events.filter((e) => e.res.startsWith("r"));
const WK = ["一", "二", "三", "四", "五", "六", "日"];
// all-day items keyed by month-day (solar terms / company-wide)
const ALLDAY = {
  20: [{ title: "春分", cat: "green", term: true }],
  21: [{ title: "全员战略对齐", cat: "seafoam" }],
};
const allDayFor = (d) => ALLDAY[d] || [];

const pad2 = (n) => String(n).padStart(2, "0");
const fmtH = (h) => { const hr = Math.floor(h), m = Math.round((h - hr) * 60); return `${hr}:${pad2(m)}`; };
const evRange = (e) => `${fmtH(e.start)} – ${fmtH(e.end)}`;
const dayIndexOf = (d) => ((d - 18) % 7 + 7) % 7;          // 0=Mon..6=Sun
const sunIdx = (d) => ((d - 18) % 7 + 1 + 7) % 7;          // 0=Sun..6=Sat
const DOW_SUN = ["日", "一", "二", "三", "四", "五", "六"];

// fictional lunar labels (二月 of a 丙午-style year) — anchored so 21 = 廿二
function lunarCN(n) {
  const u = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (n === 10) return "初十"; if (n === 20) return "二十"; if (n === 30) return "三十";
  if (n < 10) return "初" + u[n];
  if (n < 20) return "十" + u[n - 10];
  return "廿" + u[n - 20];
}
function lunarFor(d) {
  if (d === 20) return { text: "春分", term: true };
  const n = d + 1;
  if (n <= 30) return { text: lunarCN(n) };
  const m = n - 30;
  return m === 1 ? { text: "三月", term: true } : { text: lunarCN(m) };
}

// overlap layout → _l (left frac), _w (width frac)
function layout(evts) {
  const sorted = [...evts].sort((a, b) => a.start - b.start || b.end - a.end);
  const cols = [];
  sorted.forEach((e) => {
    let placed = false;
    for (let c = 0; c < cols.length; c++) {
      if (cols[c][cols[c].length - 1].end <= e.start) { cols[c].push(e); e._col = c; placed = true; break; }
    }
    if (!placed) { e._col = cols.length; cols.push([e]); }
  });
  const groups = []; let cur = []; let curEnd = -1;
  sorted.forEach((e) => { if (cur.length && e.start >= curEnd) { groups.push(cur); cur = []; curEnd = -1; } cur.push(e); curEnd = Math.max(curEnd, e.end); });
  if (cur.length) groups.push(cur);
  sorted.forEach((e) => { const g = groups.find((gr) => gr.includes(e)); const mc = Math.max(...g.map((x) => x._col)) + 1; e._w = 1 / mc; e._l = e._col / mc; });
  return sorted;
}

// ---------- TIMELINE (day / multi-day) ----------
function Timeline({ cols, onPick, selId }) {
  const bodyRef = React.useRef(null);
  React.useEffect(() => {
    const el = bodyRef.current;
    if (el) setTimeout(() => { el.scrollTop = (8 - HSTART) * HOUR_H - 12; }, 60);
  }, []);
  const hours = Array.from({ length: HEND - HSTART }, (_, i) => HSTART + i);
  const topOf = (h) => (h - HSTART) * HOUR_H;
  const multi = cols.length > 1;
  const gridCols = `52px repeat(${cols.length}, 1fr)`;
  const anyAllDay = cols.some((c) => allDayFor(c.day).length);
  const showBand = multi || anyAllDay;
  const mkAllDay = (e, col) => ({ ...e, day: dayIndexOf(col.day), start: 0, end: 24, loc: "全天", who: e.term ? "节气" : "全体成员", allDay: true });
  return (
    <div className="m-body" ref={bodyRef}>
      {(multi || showBand) && (
        <div className="m-tl-header" style={{ gridTemplateColumns: gridCols }}>
          {multi && (
            <React.Fragment>
              <div className="m-tl-gutter" />
              {cols.map((col, ci) => (
                <div key={ci} className={"m-tl-colhd" + (col.day === TODAY ? " today" : "")}>
                  周{WK[dayIndexOf(col.day)]} <span className="sub">3月{col.day}日</span>
                </div>
              ))}
            </React.Fragment>
          )}
          {showBand && (
            <React.Fragment>
              <div className="m-tl-gutter allday">全天</div>
              {cols.map((col, ci) => (
                <div key={ci} className="m-allday-cell">
                  {allDayFor(col.day).map((e, j) => (
                    <div key={j} className={"m-allday-chip" + (e.term ? " term" : "")} data-cat={e.cat} onClick={() => onPick(mkAllDay(e, col))}>
                      {e.term && <span className="star"><Ic.star /></span>}{e.title}
                    </div>
                  ))}
                </div>
              ))}
            </React.Fragment>
          )}
        </div>
      )}
      <div className="m-timeline" style={{ "--hour-h": HOUR_H + "px", gridTemplateColumns: gridCols }}>
        <div className="m-tl-times">
          {hours.map((h) => <div key={h} className="m-tl-hourlbl"><span>{pad2(h) + ":00"}</span></div>)}
          <div className="m-tl-hourlbl" style={{ height: 0 }}><span>00:00</span></div>
        </div>
        {cols.map((col, ci) => {
          const evs = layout(ROOM.filter((e) => e.day === col.dayIndex));
          return (
            <div key={ci} className="m-tl-col">
              <div style={{ position: "relative" }}>
                {hours.map((h) => <div key={h} className="m-tl-hourline" />)}
                <div className="m-tl-hourline" style={{ height: 0 }} />
                {col.day === TODAY && (
                  <div className="m-now" style={{ top: topOf(NOW) }}>
                    {ci === 0 && <div className="m-now-flag">{fmtH(NOW)}</div>}
                  </div>
                )}
                {evs.map((e) => (
                  <div key={e.id} className={"m-ev" + (selId === e.id ? " sel" : "")} data-cat={e.cat}
                    style={{ top: topOf(e.start) + 1, height: (e.end - e.start) * HOUR_H - 3, left: `calc(${e._l * 100}% + 2px)`, width: `calc(${e._w * 100}% - 4px)` }}
                    onClick={() => onPick(e)}>
                    <div className="m-ev-title">{e.title}</div>
                    {(e.end - e.start) >= 0.75 && <div className="m-ev-time">{fmtH(e.start)}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ day, onPick, selId }) {
  return <Timeline cols={[{ day, dayIndex: dayIndexOf(day) }]} onPick={onPick} selId={selId} />;
}
function MultiDayView({ day, onPick, selId }) {
  const cols = [{ day, dayIndex: dayIndexOf(day) }, { day: day + 1, dayIndex: dayIndexOf(day + 1) }];
  return <Timeline cols={cols} onPick={onPick} selId={selId} />;
}

// ---------- MONTH ----------
const M_TERMS = { 20: "春分" };                                          // solar terms → green star chips
const M_SPANS = [{ start: 13, end: 14, title: "季度规划工作坊", cat: "indigo" }]; // multi-day spanning bars
const M_BADGE = {};                                                       // { day: "休" | "班" }
function lunarRawFor(d) {
  const n = d + 1;
  if (n <= 30) return lunarCN(n);
  const m = n - 30;
  return m === 1 ? "三月" : lunarCN(m);
}
function MonthView({ onDay }) {
  const me = SWELL.monthEvents;
  const lead = sunIdx(1); // leading cells from prev month
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = i - lead + 1;
    const inMonth = d >= 1 && d <= 31;
    const wknd = i % 7 === 0 || i % 7 === 6;
    const num = inMonth ? d : (d < 1 ? 28 + d : d - 31);
    const chips = [];
    if (inMonth) {
      M_SPANS.forEach((s) => {
        if (d >= s.start && d <= s.end)
          chips.push({ kind: "span", title: s.title, cat: s.cat, edgeL: d === s.start, edgeR: d === s.end });
      });
      if (M_TERMS[d]) chips.push({ kind: "term", title: M_TERMS[d], cat: "green" });
      (me[d] || []).forEach((e) => {
        if (!M_SPANS.some((s) => s.title === e.title && d >= s.start && d <= s.end))
          chips.push({ kind: "ev", title: e.title, cat: e.cat });
      });
    }
    cells.push({ d, num, inMonth, wknd, today: d === TODAY, chips, lunar: inMonth ? lunarRawFor(d) : null, badge: M_BADGE[d] });
  }
  return (
    <div className="m-body">
      <div className="m-month-title">三月</div>
      <div className="m-month-dow">{DOW_SUN.map((d, i) => <div key={d} className={i === 0 || i === 6 ? "wknd" : ""}>{d}</div>)}</div>
      <div className="m-month-grid">
        {cells.map((c, i) => {
          const shown = c.chips.slice(0, 2);
          const extra = c.chips.length - shown.length;
          return (
            <button key={i} className={"m-mcell" + (c.wknd ? " wknd" : "") + (!c.inMonth ? " dim" : "") + (c.today ? " today" : "")}
              onClick={() => c.inMonth && onDay(c.d)}>
              {c.badge && <span className={"m-mc-badge " + (c.badge === "休" ? "rest" : "work")}>{c.badge}</span>}
              <span className="m-mc-blob">
                <span className="m-mc-num">{c.num}</span>
                {c.lunar && <span className="m-mc-lunar">{c.lunar}</span>}
              </span>
              <div className="m-mc-evs">
                {shown.map((e, j) => (
                  <div key={j}
                    className={"m-mc-ev" + (e.kind === "span" ? " span" + (e.edgeL ? " edge-l" : "") + (e.edgeR ? " edge-r" : "") : "")}
                    data-cat={e.cat}>
                    {e.kind === "term" && <span className="m-mc-starbox"><Ic.star /></span>}
                    <span className="m-mc-evlbl">{(e.kind === "span" && !e.edgeL) ? "\u00A0" : e.title}</span>
                  </div>
                ))}
                {extra > 0 && <div className="m-mc-more">+{extra}</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- AGENDA / LIST ----------
function AgendaView({ onPick, selId }) {
  const days = [18, 19, 20, 21, 22]; // Mon–Fri with bookings
  return (
    <div className="m-body">
      <div className="m-agenda">
        {days.map((d) => {
          const evs = ROOM.filter((e) => e.day === dayIndexOf(d)).sort((a, b) => a.start - b.start);
          const term = lunarFor(d);
          return (
            <div key={d}>
              <div className={"m-ag-day" + (d === TODAY ? " today" : "")}>
                <span className="m-ag-dow">星期{DOW_SUN[sunIdx(d)]}</span>
                <span className="m-ag-dnum">3月{d}日</span>
                <span className="m-ag-lunar">{term.text}</span>
              </div>
              <div className="m-ag-list">
                {allDayFor(d).map((e, j) => (
                  <div key={"ad" + j} className="m-ag-allday" onClick={() => onPick({ ...e, day: dayIndexOf(d), start: 0, end: 24, loc: "全天", who: e.term ? "节气" : "全体成员", allDay: true })}>
                    <span className="star" style={{ background: M_CAT[e.cat] }}><Ic.star /></span>
                    <span className="lbl">{e.title}</span>
                    <span className="at">全天</span>
                  </div>
                ))}
                {evs.map((e) => (
                  <div key={e.id} className="m-ag-row" onClick={() => onPick(e)}>
                    <div className="m-ag-main">
                      <span className="m-ag-rail" data-cat={e.cat} />
                      <div className="m-ag-txt">
                        <div className="m-ag-title">{e.title}</div>
                        <div className="m-ag-loc">{e.loc} · {e.who}</div>
                      </div>
                    </div>
                    <div className="m-ag-time">{fmtH(e.start)}<span className="end">{fmtH(e.end)}</span></div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { DayView, MultiDayView, MonthView, AgendaView, fmtH, evRange, M_CAT, dayIndexOf, sunIdx, DOW_SUN, lunarFor, TODAY });
