// ===== swell-calendar mobile · app shell =====
const M_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "seafoam",
  "card": "soft",
  "weekStart": "sun"
}/*EDITMODE-END*/;

const WEEK_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

// ---------- event detail bottom sheet ----------
function EventSheet({ ev, onClose }) {
  if (!ev) return null;
  const people = (ev.who || "").split(/[·+]/).map((s) => s.trim()).filter(Boolean).slice(0, 4);
  const initialsOf = (s) => s.replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, "").slice(0, 1) || "·";
  const mins = Math.round((ev.end - ev.start) * 60);
  const palette = ["seafoam", "indigo", "orange", "purple"];
  return (
    <React.Fragment>
      <div className="m-sheet-scrim" onClick={onClose} />
      <div className="m-sheet">
        <div className="m-sheet-grip" />
        <div className="m-sheet-accent" data-cat={ev.cat} />
        <div className="m-sheet-title">{ev.title}</div>
        <div className="m-sheet-rows">
          <div className="m-sheet-row"><Ic.clock /><span>周{["一","二","三","四","五","六","日"][ev.day]} · 3月{18 + ev.day}日 · {ev.allDay ? "全天" : <React.Fragment>{evRange(ev)} <span className="muted">（{mins} 分钟）</span></React.Fragment>}</span></div>
          <div className="m-sheet-row"><Ic.pin /><span>{ev.loc || "未指定地点"}</span></div>
          {ev.desc && <div className="m-sheet-row"><Ic.inbox /><span className="muted">{ev.desc}</span></div>}
          <div className="m-sheet-row">
            <Ic.users />
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div className="m-sheet-people">
                {people.map((p, i) => (
                  <div key={i} className="a" style={{ background: M_CAT[palette[i % 4]] }}>{initialsOf(p)}</div>
                ))}
              </div>
              <span>{ev.who}</span>
            </div>
          </div>
        </div>
        <div className="m-sheet-actions">
          <button className="m-sbtn" onClick={onClose}><Ic.video />加入</button>
          <button className="m-sbtn"><Ic.edit />编辑</button>
          <button className="m-sbtn primary" onClick={onClose}><Ic.check />接受</button>
        </div>
      </div>
    </React.Fragment>
  );
}

// ---------- week strip ----------
function WeekStrip({ day, setDay, view }) {
  const sun = day - sunIdx(day); // Sunday of the week
  const days = Array.from({ length: 7 }, (_, i) => sun + i);
  const selSet = view === "multi" ? [day, day + 1] : [day];
  const cardStart = Math.min(...selSet), cardEnd = Math.max(...selSet);
  return (
    <div className="m-weekstrip">
      {days.map((d, i) => {
        const onCard = view === "multi" && d >= cardStart && d <= cardEnd;
        const cls = "m-ws-cell"
          + (i === 0 || i === 6 ? " wknd" : "")
          + (onCard ? " oncard" : "")
          + (onCard && d === cardStart ? " edge-l" : "")
          + (onCard && d === cardEnd ? " edge-r" : "")
          + (d === day ? " primary" : "")
          + (d === TODAY ? " today" : "");
        return (
          <button key={i} className={cls} onClick={() => setDay(d)}>
            <span className="m-ws-dow">{DOW_SUN[i]}</span>
            <span className="m-ws-blobwrap">
              <span className="m-ws-blob">
                <span className="m-ws-num">{((d - 1) % 31 + 31) % 31 + 1}</span>
                <span className="m-ws-lunar">{lunarFor(d).text}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- top bar ----------
function TopBar({ view, setView, openMonth }) {
  const segs = [["day", "日"], ["multi", "多日"], ["month", "月"], ["list", "列表"]];
  return (
    <div className="m-top">
      <div className="m-top-row">
        <button className="m-back" onClick={openMonth}>
          <Ic.chevL />{view === "month" ? "2025年" : "三月"}
        </button>
        <div className="m-spacer" />
        <div className="m-seg">
          {segs.map(([v, l]) => (
            <button key={v} className={"m-seg-btn" + (view === v ? " active" : "")} onClick={() => setView(v)}>{l}</button>
          ))}
        </div>
        <button className="m-iconbtn"><Ic.search /></button>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(M_TWEAK_DEFAULTS);
  const [view, setView] = React.useState("day");
  const [day, setDay] = React.useState(TODAY);
  const [pick, setPick] = React.useState(null);

  React.useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.theme);
    r.setAttribute("data-accent", t.accent);
  }, [t.theme, t.accent]);

  const dayLabel = `周${["一","二","三","四","五","六","日"][dayIndexOf(day)]}`;
  const lun = lunarFor(day);

  return (
    <IOSDevice dark={t.theme === "dark"}>
      <div className="screen" data-card={t.card}>
        <TopBar view={view} setView={setView} openMonth={() => setView("month")} />

        {(view === "day" || view === "multi") && <WeekStrip day={day} setDay={setDay} view={view} />}
        {view === "day" && (
          <div className="m-dayhd">{dayLabel} · 3月{day}日<span className="sub">{lun.term ? lun.text : "二月" + lun.text}</span></div>
        )}

        {view === "day" && <DayView day={day} onPick={setPick} selId={pick?.id} />}
        {view === "multi" && <MultiDayView day={day} onPick={setPick} selId={pick?.id} />}
        {view === "month" && <MonthView onDay={(d) => { setDay(d); setView("day"); }} />}
        {view === "list" && <AgendaView onPick={setPick} selId={pick?.id} />}

        {pick && <EventSheet ev={pick} onClose={() => setPick(null)} />}
      </div>

      <TweaksPanel>
        <TweakSection label="主题" />
        <TweakRadio label="明暗" value={t.theme} options={[{ value: "light", label: "浅色" }, { value: "dark", label: "深色" }]} onChange={(v) => setTweak("theme", v)} />
        <TweakSelect label="强调色" value={t.accent}
          options={[{ value: "seafoam", label: "青绿" }, { value: "blue", label: "蓝" }, { value: "indigo", label: "靛蓝" }, { value: "magenta", label: "品红" }]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="事件" />
        <TweakSelect label="事件卡片" value={t.card}
          options={[{ value: "soft", label: "柔色填充" }, { value: "bar", label: "左侧色条" }, { value: "solid", label: "实色" }]}
          onChange={(v) => setTweak("card", v)} />
      </TweaksPanel>
    </IOSDevice>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
