// ===== Main app =====
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "seafoam",
  "card": "soft",
  "toolbar": "segmented",
  "popover": "rich",
  "sidebar": "full",
  "density": "regular"
}/*EDITMODE-END*/;

const VIEW_TITLE = {
  day: ["周四 · 3月21日", "2025年 · 第12周"],
  week: ["3月18日 – 24日", "2025年 · 第12周"],
  month: ["2025年 3月", "31天 · 12场会议"],
  scheduler: ["周四 · 3月21日", "6项资源 · 会议室与成员"],
  timeline: ["本周日程", "3月18日 – 24日 · 议程视图"],
};

function AccentRow({ value, onChange }) {
  const opts = [
    { v: "seafoam", c: "#1c8a86", label: "青绿" },
    { v: "blue", c: "#2563cf", label: "蓝" },
    { v: "indigo", c: "#5b4bd6", label: "靛蓝" },
    { v: "magenta", c: "#c43a86", label: "品红" },
  ];
  return (
    <TweakRow label="强调色">
      <div style={{ display: "flex", gap: 8 }}>
        {opts.map((o) => (
          <button key={o.v} type="button" title={o.label} onClick={() => onChange(o.v)}
            style={{
              width: 30, height: 26, borderRadius: 8, cursor: "pointer", background: o.c,
              border: value === o.v ? "2px solid rgba(41,38,27,.85)" : "2px solid transparent",
              boxShadow: value === o.v ? "0 0 0 2px #fff inset" : "none",
            }} />
        ))}
      </div>
    </TweakRow>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState("scheduler");
  const [pick, setPick] = React.useState(null); // {ev, anchor}
  const [creating, setCreating] = React.useState(false);
  const [showWknd, setShowWknd] = React.useState(true);

  // apply theme + accent to root
  React.useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.theme);
    r.setAttribute("data-accent", t.accent);
  }, [t.theme, t.accent]);

  const hourH = t.density === "compact" ? 46 : t.density === "comfy" ? 70 : 56;
  const rowH = t.density === "compact" ? 62 : t.density === "comfy" ? 92 : 76;

  const onPick = (ev, anchor) => setPick({ ev, anchor });
  const closePop = () => setPick(null);

  let events = SWELL.events;
  const weekEvents = events;

  const [title, sub] = VIEW_TITLE[view];

  return (
    <div className="app" data-sidebar={t.sidebar} data-card={t.card}>
      <Sidebar view={view} setView={setView} openCreate={() => setCreating(true)} sidebar={t.sidebar} />
      <div className="main">
        <Topbar view={view} setView={setView} toolbar={t.toolbar}
          toggleRail={() => setTweak("sidebar", t.sidebar === "full" ? "rail" : "full")}
          title={title} sub={sub} />
        {(view === "week" || view === "day" || view === "scheduler") &&
          <SubBar showWknd={showWknd} setShowWknd={setShowWknd} />}
        <div className="canvas" key={view}>
          {view === "day" && <DayView events={weekEvents} onPick={onPick} selId={pick?.ev.id} hourH={hourH} />}
          {view === "week" && <WeekView events={weekEvents} onPick={onPick} selId={pick?.ev.id} hourH={hourH} />}
          {view === "month" && <MonthView onPick={onPick} />}
          {view === "scheduler" && <SchedulerView onPick={onPick} selId={pick?.ev.id} rowH={rowH} />}
          {view === "timeline" && <TimelineView onPick={onPick} />}
        </div>
      </div>

      {pick && <Popover ev={pick.ev} anchor={pick.anchor} onClose={closePop} variant={t.popover} />}
      {creating && <CreateDialog onClose={() => setCreating(false)} />}

      <TweaksPanel>
        <TweakSection label="主题" />
        <TweakRadio label="明暗" value={t.theme} options={[{ value: "light", label: "浅色" }, { value: "dark", label: "深色" }]} onChange={(v) => setTweak("theme", v)} />
        <AccentRow value={t.accent} onChange={(v) => setTweak("accent", v)} />

        <TweakSection label="布局" />
        <TweakSelect label="工具栏样式" value={t.toolbar}
          options={[{ value: "segmented", label: "分段控件" }, { value: "boxed", label: "方角分段" }, { value: "tabs", label: "下划线标签" }, { value: "minimal", label: "极简(仅图标)" }]}
          onChange={(v) => setTweak("toolbar", v)} />
        <TweakSelect label="侧边栏" value={t.sidebar}
          options={[{ value: "full", label: "完整" }, { value: "rail", label: "导轨(窄)" }, { value: "hidden", label: "隐藏" }]}
          onChange={(v) => setTweak("sidebar", v)} />
        <TweakRadio label="密度" value={t.density} options={[{ value: "compact", label: "紧凑" }, { value: "regular", label: "标准" }, { value: "comfy", label: "宽松" }]} onChange={(v) => setTweak("density", v)} />

        <TweakSection label="事件" />
        <TweakSelect label="事件卡片" value={t.card}
          options={[{ value: "soft", label: "柔色填充" }, { value: "bar", label: "左侧色条" }, { value: "solid", label: "实色" }, { value: "outline", label: "描边" }]}
          onChange={(v) => setTweak("card", v)} />
        <TweakSelect label="详情弹窗" value={t.popover}
          options={[{ value: "rich", label: "丰富(含操作)" }, { value: "default", label: "标准" }, { value: "minimal", label: "极简" }]}
          onChange={(v) => setTweak("popover", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
