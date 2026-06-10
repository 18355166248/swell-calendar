// ===== App shell: sidebar + topbar =====（移植自设计稿 shell.jsx）
import { CAT_COLORS, resources, type Cat } from './data';
import { Ic } from './icons';

export type ViewId = 'day' | 'week' | 'month' | 'scheduler' | 'timeline';
export type Sidebar = 'full' | 'rail' | 'hidden';
export type Toolbar = 'segmented' | 'boxed' | 'tabs' | 'minimal';

interface SidebarProps {
  view: ViewId;
  setView: (v: ViewId) => void;
  openCreate: () => void;
}

export function Sidebar({ view, setView, openCreate }: SidebarProps) {
  const navMain: { id: ViewId; label: string; icon: () => JSX.Element; badge?: string }[] = [
    { id: 'day', label: '日视图', icon: Ic.day },
    { id: 'week', label: '周视图', icon: Ic.week },
    { id: 'month', label: '月视图', icon: Ic.month },
    { id: 'scheduler', label: '资源调度', icon: Ic.sched, badge: '6' },
    { id: 'timeline', label: '时间线', icon: Ic.timeline },
  ];
  const navCal: { c: Cat; label: string }[] = [
    { c: 'seafoam', label: '会议·评审' },
    { c: 'indigo', label: '规划·设计' },
    { c: 'orange', label: '客户·对外' },
    { c: 'green', label: '工程·协作' },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Ic.swell />
        </div>
        <div className="brand-text">
          <div className="brand-name">swell</div>
          <div className="brand-sub">日程调度</div>
        </div>
      </div>
      <button className="side-cta" onClick={openCreate}>
        <Ic.plus />
        <span className="lbl">新建日程</span>
      </button>
      <nav className="nav">
        <div className="nav-label">视图</div>
        {navMain.map((n) => (
          <button
            key={n.id}
            className={'nav-item' + (view === n.id ? ' active' : '')}
            onClick={() => setView(n.id)}
          >
            <n.icon />
            <span className="lbl">{n.label}</span>
            {n.badge && <span className="badge">{n.badge}</span>}
          </button>
        ))}
        <div className="nav-label">我的日历</div>
        {navCal.map((n) => (
          <button key={n.c} className="nav-item">
            <span style={{ width: 18, display: 'grid', placeItems: 'center' }}>
              <span
                style={{ width: 11, height: 11, borderRadius: 4, background: CAT_COLORS[n.c] }}
              />
            </span>
            <span className="lbl">{n.label}</span>
          </button>
        ))}
      </nav>
      <MiniCalendar />
      <div className="side-foot">
        <div className="user-chip">
          <div className="avatar" style={{ background: 'var(--cat-magenta-line)' }}>
            陈
          </div>
          <div className="user-meta">
            <div className="user-name">陈伊一</div>
            <div className="user-role">运营 · 管理员</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MiniCalendar() {
  // 2025年3月；高亮 18-24 当周，21 为今天
  const dow = ['一', '二', '三', '四', '五', '六', '日'];
  const firstOffset = 5; // 当月从周六开始
  const cells: { dnum: number; inMonth: boolean; inWeek: boolean; today: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const dnum = i - firstOffset + 1;
    cells.push({
      dnum,
      inMonth: dnum >= 1 && dnum <= 31,
      inWeek: dnum >= 18 && dnum <= 24,
      today: dnum === 21,
    });
  }
  return (
    <div className="mini">
      <div className="mini-hd">
        <div className="mini-title">2025年3月</div>
        <div className="mini-nav">
          <button>
            <Ic.chevL />
          </button>
          <button>
            <Ic.chevR />
          </button>
        </div>
      </div>
      <div className="mini-grid">
        {dow.map((d) => (
          <div key={d} className="mini-dow">
            {d}
          </div>
        ))}
        {cells.map((c, i) => (
          <div
            key={i}
            className={
              'mini-day' +
              (c.inMonth ? '' : ' dim') +
              (c.today ? ' today' : c.inWeek ? ' in-week' : '')
            }
          >
            {c.inMonth ? c.dnum : c.dnum < 1 ? 23 + c.dnum + 5 : c.dnum - 31}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TopbarProps {
  view: ViewId;
  setView: (v: ViewId) => void;
  toolbar: Toolbar;
  toggleRail: () => void;
  title: string;
  sub: string;
}

export function Topbar({ view, setView, toolbar, toggleRail, title, sub }: TopbarProps) {
  const views: { id: ViewId; label: string; icon: () => JSX.Element }[] = [
    { id: 'day', label: '日', icon: Ic.day },
    { id: 'week', label: '周', icon: Ic.week },
    { id: 'month', label: '月', icon: Ic.month },
    { id: 'scheduler', label: '调度', icon: Ic.sched },
    { id: 'timeline', label: '时间线', icon: Ic.timeline },
  ];
  const segClass = 'seg' + (toolbar === 'boxed' ? ' boxed' : toolbar === 'tabs' ? ' tabs' : '');
  return (
    <header className="topbar">
      <button className="tb-rail-toggle" onClick={toggleRail} title="切换侧栏">
        <Ic.sidebar />
      </button>
      <div className="tb-date">
        <div className="tb-title">{title}</div>
        <div className="tb-sub">{sub}</div>
      </div>
      <div className="tb-nav">
        <button className="tb-today">今天</button>
        <button className="tb-arrow">
          <Ic.chevL />
        </button>
        <button className="tb-arrow">
          <Ic.chevR />
        </button>
      </div>
      <div className="tb-spacer" />
      {toolbar !== 'minimal' && (
        <div className="tb-search">
          <Ic.search />
          <input placeholder="搜索日程、与会人…" />
        </div>
      )}
      <div className={segClass}>
        {views.map((v) => (
          <button
            key={v.id}
            className={'seg-btn' + (view === v.id ? ' active' : '')}
            onClick={() => setView(v.id)}
          >
            <v.icon />
            {toolbar !== 'minimal' && <span>{v.label}</span>}
          </button>
        ))}
      </div>
      <button className="tb-icon-btn">
        <span className="dot" />
        <Ic.bell />
      </button>
      <button className="tb-icon-btn">
        <Ic.settings />
      </button>
    </header>
  );
}
