// ===== Overlays: event popover + create dialog + subbar =====

function Popover({ ev, anchor, onClose, style, variant }) {
  if (!ev) return null;
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ top: -999, left: -999, ready: false });
  React.useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const a = anchor.getBoundingClientRect();
    const p = ref.current.getBoundingClientRect();
    let left = a.right + 10, top = a.top;
    if (left + p.width > window.innerWidth - 12) left = a.left - p.width - 10;
    if (left < 12) left = Math.max(12, a.left);
    if (top + p.height > window.innerHeight - 12) top = window.innerHeight - p.height - 12;
    if (top < 12) top = 12;
    setPos({ top, left, ready: true });
  }, [anchor, ev]);

  const people = (ev.who || "").split(/[·+]/).map((s) => s.trim()).filter(Boolean).slice(0, 4);
  const initialsOf = (s) => s.replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, "").slice(0, 1) || "·";

  return (
    <div className="pop-layer" onMouseDown={onClose}>
      <div ref={ref} className="pop" data-cat={ev.cat}
        style={{ top: pos.top, left: pos.left, opacity: pos.top > -900 ? 1 : 0 }}
        onMouseDown={(e) => e.stopPropagation()}>
        {variant !== "minimal" && <div className="pop-accent" />}
        <div className="pop-body">
          <div className="pop-top">
            <div className="pop-title">{ev.title}</div>
            <button className="pop-x" onClick={onClose}>✕</button>
          </div>
          <div className="pop-rows">
            <div className="pop-row"><Ic.clock /><span>3月{21} · {evRange(ev)} <span className="muted">({Math.round((ev.end - ev.start) * 60)} 分钟)</span></span></div>
            <div className="pop-row"><Ic.pin /><span>{ev.loc || "未指定地点"}</span></div>
            {ev.desc && variant === "rich" && <div className="pop-row"><Ic.inbox /><span className="muted">{ev.desc}</span></div>}
            <div className="pop-row">
              <Ic.users />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex" }}>
                  {people.map((p, i) => (
                    <div key={i} className="a" style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid var(--bg-layer-2)", marginLeft: i ? -8 : 0, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "#fff", background: CAT_COLORS[["seafoam", "indigo", "orange", "purple"][i % 4]] }}>{initialsOf(p)}</div>
                  ))}
                </div>
                <span>{ev.who}</span>
              </div>
            </div>
          </div>
          {variant === "rich" && (
            <div className="pop-actions">
              <button className="pbtn"><Ic.video />加入</button>
              <button className="pbtn"><Ic.edit />编辑</button>
              <button className="pbtn primary"><Ic.check />接受</button>
            </div>
          )}
          {variant === "default" && (
            <div className="pop-actions">
              <button className="pbtn"><Ic.edit />编辑</button>
              <button className="pbtn primary"><Ic.check />接受</button>
            </div>
          )}
          {variant === "minimal" && (
            <div className="pop-actions">
              <button className="pbtn primary" onClick={onClose}>知道了</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateDialog({ onClose }) {
  const cats = [
    { c: "seafoam", label: "会议" }, { c: "indigo", label: "规划" }, { c: "magenta", label: "1:1" },
    { c: "orange", label: "对外" }, { c: "green", label: "协作" }, { c: "purple", label: "面试" },
  ];
  const [cat, setCat] = React.useState("seafoam");
  const [rep, setRep] = React.useState("none");
  const [title, setTitle] = React.useState("");
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
            <input className="field-input" autoFocus placeholder="例如：产品双周评审" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <div className="field-label">资源</div>
            <select className="field-select" defaultValue="r1">
              {SWELL.resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <div className="field-label">日期</div>
              <input className="field-input" type="text" defaultValue="2025-03-21" />
            </div>
            <div className="field">
              <div className="field-label">时间</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="field-input" type="text" defaultValue="09:00" />
                <span style={{ color: "var(--text-3)" }}>–</span>
                <input className="field-input" type="text" defaultValue="10:00" />
              </div>
            </div>
          </div>
          <div className="field">
            <div className="field-label">分类</div>
            <div className="cat-picker">
              {cats.map((c) => (
                <div key={c.c} className={"cat-dot" + (cat === c.c ? " sel" : "")} title={c.label}
                  style={{ background: CAT_COLORS[c.c] }} onClick={() => setCat(c.c)}>
                  <Ic.check />
                </div>
              ))}
            </div>
          </div>
          <div className="field">
            <div className="field-label">重复</div>
            <div className="seg-pills">
              {[["none", "不重复"], ["daily", "每天"], ["weekly", "每周"], ["biweekly", "双周"]].map(([k, l]) => (
                <button key={k} className={"seg-pill" + (rep === k ? " on" : "")} onClick={() => setRep(k)}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="dlg-foot">
          <button className="dlg-btn" onClick={onClose}>取消</button>
          <button className="dlg-btn primary" onClick={onClose}>创建日程</button>
        </div>
      </div>
    </div>
  );
}

function SubBar({ resFilter, toggleRes, showWknd, setShowWknd }) {
  const cats = [
    { c: "seafoam", label: "会议·评审" }, { c: "indigo", label: "规划·设计" },
    { c: "orange", label: "客户·对外" }, { c: "green", label: "工程·协作" },
    { c: "purple", label: "面试·招聘" },
  ];
  return (
    <div className="subbar">
      <div className="chips">
        <button className="chip"><Ic.filter />筛选</button>
        {cats.map((c) => (
          <button key={c.c} className={"chip on"}>
            <span className="swatch" style={{ background: CAT_COLORS[c.c] }} />{c.label}
          </button>
        ))}
      </div>
      <div className="tb-spacer" />
      <label className="mini-toggle" onClick={() => setShowWknd(!showWknd)}>
        显示周末 <span className={"switch" + (showWknd ? " on" : "")} />
      </label>
    </div>
  );
}

Object.assign(window, { Popover, CreateDialog, SubBar });
