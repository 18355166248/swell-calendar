// ===== App shell: sidebar + topbar =====
// P3: 外围控件已替换为 @react-spectrum/s2 真实组件（Button / ActionButton / SearchField / SegmentedControl）。
// 侧栏导航项保留 CSS 版（S2 无直接等价物，强行替换会偏离像素）。
import {
  ActionButton,
  Button,
  SearchField,
  SegmentedControl,
  SegmentedControlItem,
} from '@react-spectrum/s2';
import type { Key } from 'react';

import { CAT_COLORS, type Cat } from './data';
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
      {/* P3: S2 Button variant="accent" 替换原生 button */}
      <div className="side-cta-wrap">
        <Button variant="accent" onPress={openCreate} UNSAFE_className={'s2-seafoam-cta' as any}>
          <Ic.plus />
          <span className="lbl">新建日程</span>
        </Button>
      </div>
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
  return (
    <header className="topbar">
      {/* P3: S2 ActionButton (quiet) */}
      <ActionButton
        isQuiet
        onPress={toggleRail}
        aria-label="切换侧栏"
        UNSAFE_className={'s2-sf' as any}
      >
        <Ic.sidebar />
      </ActionButton>
      <div className="tb-date">
        <div className="tb-title">{title}</div>
        <div className="tb-sub">{sub}</div>
      </div>
      <div className="tb-nav">
        {/* P3: S2 Button (outline) */}
        <Button variant="secondary" fillStyle="outline" size="S">
          今天
        </Button>
        {/* P3: S2 ActionButton (quiet) */}
        <ActionButton isQuiet aria-label="上一期" UNSAFE_className={'s2-sf' as any}>
          <Ic.chevL />
        </ActionButton>
        <ActionButton isQuiet aria-label="下一期" UNSAFE_className={'s2-sf' as any}>
          <Ic.chevR />
        </ActionButton>
      </div>
      <div className="tb-spacer" />
      {/* P3: S2 SearchField */}
      {toolbar !== 'minimal' && (
        <div className="tb-search-wrap">
          <SearchField
            placeholder="搜索日程、与会人…"
            size="S"
            aria-label="搜索"
            UNSAFE_className={'s2-sf' as any}
          />
        </div>
      )}
      {/* P3: S2 SegmentedControl */}
      {toolbar !== 'minimal' && (
        <SegmentedControl
          selectedKey={view}
          onSelectionChange={(k: Key) => setView(k as ViewId)}
          aria-label="视图切换"
          UNSAFE_className={'s2-ss' as any}
        >
          {views.map((v) => (
            <SegmentedControlItem key={v.id} id={v.id}>
              <v.icon />
              <span>{v.label}</span>
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      )}
      {/* P3: S2 ActionButton (quiet) + notification dot */}
      <span className="tb-icon-wrap">
        <ActionButton isQuiet aria-label="通知" UNSAFE_className={'s2-sf' as any}>
          <Ic.bell />
        </ActionButton>
        <span className="s2-dot" />
      </span>
      <ActionButton isQuiet aria-label="设置" UNSAFE_className={'s2-sf' as any}>
        <Ic.settings />
      </ActionButton>
    </header>
  );
}
