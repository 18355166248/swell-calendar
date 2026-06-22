// ===== App shell: sidebar + topbar =====
// P3: 外围控件已替换为 @react-spectrum/s2 真实组件（Button / ActionButton / SearchField / SegmentedControl）。
// 侧栏导航项保留 CSS 版（S2 无直接等价物，强行替换会偏离像素）。
import { useEffect, useRef, useState, type Key } from 'react';

import {
  ActionButton,
  Button,
  SearchField,
  SegmentedControl,
  SegmentedControlItem,
} from '@react-spectrum/s2';

import { Ic } from './icons';
import { lunarLabelOf } from './lunar';

export type ViewId = 'day' | 'week' | 'month' | 'multiDay' | 'agenda' | 'scheduler' | 'timeline';
export type Sidebar = 'full' | 'rail' | 'hidden';
export type Toolbar = 'segmented' | 'boxed' | 'tabs' | 'minimal';

interface SidebarProps {
  view: ViewId;
  setView: (v: ViewId) => void;
  openCreate: () => void;
  currentDate: Date;
  onDateChange: (d: Date) => void;
}

export function Sidebar({ view, setView, openCreate, currentDate, onDateChange }: SidebarProps) {
  const navMain: { id: ViewId; label: string; icon: () => JSX.Element; badge?: string }[] = [
    { id: 'day', label: '日视图', icon: Ic.day },
    { id: 'week', label: '周视图', icon: Ic.week },
    { id: 'month', label: '月视图', icon: Ic.month },
    { id: 'multiDay', label: '多日', icon: Ic.week },
    { id: 'agenda', label: '列表', icon: Ic.timeline },
    { id: 'scheduler', label: '资源调度', icon: Ic.sched, badge: '10' },
    { id: 'timeline', label: '时间线', icon: Ic.timeline },
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
        <Button variant="accent" onPress={openCreate} UNSAFE_className="s2-seafoam-cta">
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
      </nav>
      <MiniCalendar currentDate={currentDate} onDateChange={onDateChange} />
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

interface MiniCalendarProps {
  /** 主视图当前聚焦日期：高亮其所在周，并随顶栏导航反向联动翻月。 */
  currentDate: Date;
  /** 点击某日 → 主视图跳转到该日。 */
  onDateChange: (d: Date) => void;
}

const MINI_DOW = ['一', '二', '三', '四', '五', '六', '日'];

/** 周一为一周起点：返回 0=周一 … 6=周日。 */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeekMonday(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - mondayIndex(s));
  return s;
}

function getWeekStripMonthLabel(currentDate: Date): string {
  const weekStart = startOfWeekMonday(currentDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startMonth = weekStart.getMonth() + 1;
  const endMonth = weekEnd.getMonth() + 1;

  return startMonth === endMonth ? `${startMonth}月` : `${startMonth}月 / ${endMonth}月`;
}

function MiniCalendar({ currentDate, onDateChange }: MiniCalendarProps) {
  // 显示月份：默认跟随 currentDate 所在月；左右箭头独立翻月。
  // currentDate 跨月变化时（顶栏翻页 / 点日期）useEffect 把 displayMonth 拉回同步。
  const [displayMonth, setDisplayMonth] = useState(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  );
  useEffect(() => {
    setDisplayMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  }, [currentDate]);

  const today = new Date();
  const weekStart = startOfWeekMonday(currentDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // 网格首格：displayMonth 当月 1 号所在周的周一
  const gridStart = startOfWeekMonday(displayMonth);
  const cells: { date: Date; inMonth: boolean; inWeek: boolean; today: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(date.getDate() + i);
    cells.push({
      date,
      inMonth: date.getMonth() === displayMonth.getMonth(),
      inWeek: date >= weekStart && date <= weekEnd,
      today: isSameDay(date, today),
    });
  }

  const shiftMonth = (delta: number) =>
    setDisplayMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <div className="mini">
      <div className="mini-hd">
        <div className="mini-title">
          {displayMonth.getFullYear()}年{displayMonth.getMonth() + 1}月
        </div>
        <div className="mini-nav">
          <button onClick={() => shiftMonth(-1)} aria-label="上个月">
            <Ic.chevL />
          </button>
          <button onClick={() => shiftMonth(1)} aria-label="下个月">
            <Ic.chevR />
          </button>
        </div>
      </div>
      <div className="mini-grid">
        {MINI_DOW.map((d) => (
          <div key={d} className="mini-dow">
            {d}
          </div>
        ))}
        {cells.map((c, i) => (
          <button
            key={i}
            type="button"
            className={
              'mini-day' +
              (c.inMonth ? '' : ' dim') +
              (isSameDay(c.date, currentDate) ? ' today' : c.inWeek ? ' in-week' : '')
            }
            onClick={() => onDateChange(c.date)}
          >
            {c.date.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

interface DayWeekStripProps {
  currentDate: Date;
  onDateChange: (d: Date) => void;
}

export function DayWeekStrip({ currentDate, onDateChange }: DayWeekStripProps) {
  const today = new Date();
  const weekStart = startOfWeekMonday(currentDate);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  return (
    <div className="day-week-strip">
      <div className="day-week-strip__month">{getWeekStripMonthLabel(currentDate)}</div>
      <div className="day-week-strip__days">
        {days.map((date) => {
          const active = isSameDay(date, currentDate);
          const isTodayDate = isSameDay(date, today);

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={
                'day-week-chip' + (active ? ' active' : '') + (isTodayDate ? ' today' : '')
              }
              onClick={() => onDateChange(date)}
              aria-pressed={active}
            >
              <span className="day-week-chip__dow">{MINI_DOW[mondayIndex(date)]}</span>
              {/* blob 包住 数字 + 农历：桌面下为透明壳（视觉不变），移动端样式化为同一圆形 */}
              <span className="day-week-chip__blob">
                <span className="day-week-chip__date">{date.getDate()}</span>
                {(() => {
                  const lunar = lunarLabelOf(date);
                  return (
                    <span className={'day-week-chip__lunar' + (lunar.isTerm ? ' is-term' : '')}>
                      {lunar.text}
                    </span>
                  );
                })()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===== 移动 chrome（M1）=====
// 移动端视图集与桌面不同：日/多日/月/列表（对标 remix 设计稿 segmented）。
// 列表已接 agenda，多日已接 multiDay；触控输入仍留到 M4。
export type MobileViewId = 'day' | 'multi' | 'month' | 'list';

interface MobileTopBarProps {
  view: MobileViewId;
  setView: (v: MobileViewId) => void;
  monthLabel: string;
  onSearch?: () => void;
}

export function MobileTopBar({ view, setView, monthLabel, onSearch }: MobileTopBarProps) {
  const segs: { id: MobileViewId; label: string }[] = [
    { id: 'day', label: '日' },
    { id: 'multi', label: '多日' },
    { id: 'month', label: '月' },
    { id: 'list', label: '列表' },
  ];
  return (
    <div className="m-top">
      <div className="m-top-row">
        <button className="m-back" onClick={() => setView('month')} aria-label="返回月视图">
          <Ic.chevL />
          {view === 'month' ? '日历' : monthLabel}
        </button>
        <div className="m-spacer" />
        <div className="m-seg" role="tablist" aria-label="视图切换">
          {segs.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={view === s.id}
              className={'m-seg-btn' + (view === s.id ? ' active' : '')}
              onClick={() => setView(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button className="m-iconbtn" onClick={onSearch} aria-label="搜索">
          <Ic.search />
        </button>
      </div>
    </div>
  );
}

export function MobilePlaceholder({ view }: { view: MobileViewId }) {
  const label = view === 'multi' ? '多日视图' : '列表视图';
  const phase = view === 'multi' ? 'M3' : 'M2';
  return (
    <div className="m-placeholder" role="status">
      <p className="m-placeholder__title">{label}开发中</p>
      <p className="m-placeholder__sub">该视图将在 {phase} 阶段上线</p>
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
  query: string;
  setQuery: (v: string) => void;
  openSettings: (anchor: HTMLElement) => void;
  onToday: () => void;
  onNavigate: (dir: 'prev' | 'next') => void;
}

export function Topbar({
  view,
  setView,
  toolbar,
  toggleRail,
  title,
  sub,
  query,
  setQuery,
  openSettings,
  onToday,
  onNavigate,
}: TopbarProps) {
  const settingsAnchorRef = useRef<HTMLSpanElement>(null);
  const views: { id: ViewId; label: string; icon: () => JSX.Element }[] = [
    { id: 'day', label: '日', icon: Ic.day },
    { id: 'week', label: '周', icon: Ic.week },
    { id: 'month', label: '月', icon: Ic.month },
    { id: 'multiDay', label: '多日', icon: Ic.week },
    { id: 'agenda', label: '列表', icon: Ic.timeline },
    { id: 'scheduler', label: '调度', icon: Ic.sched },
    { id: 'timeline', label: '时间线', icon: Ic.timeline },
  ];
  return (
    <header className="topbar">
      {/* P3: S2 ActionButton (quiet) */}
      <ActionButton isQuiet onPress={toggleRail} aria-label="切换侧栏" UNSAFE_className="s2-sf">
        <Ic.sidebar />
      </ActionButton>
      <div className="tb-date">
        <div className="tb-title">{title}</div>
        <div className="tb-sub">{sub}</div>
      </div>
      <div className="tb-nav">
        <button className="tb-arrow" onClick={() => onNavigate('prev')} aria-label="上一期">
          <Ic.chevL />
        </button>
        <button className="tb-today" onClick={onToday}>
          今天
        </button>
        <button className="tb-arrow" onClick={() => onNavigate('next')} aria-label="下一期">
          <Ic.chevR />
        </button>
      </div>
      <div className="tb-spacer" />
      {/* P3: S2 SearchField */}
      {toolbar !== 'minimal' && (
        <div className="tb-search-wrap">
          <SearchField
            placeholder="搜索日程、与会人…"
            size="S"
            aria-label="搜索"
            value={query}
            onChange={setQuery}
            UNSAFE_className="s2-sf"
          />
        </div>
      )}
      {/* P3: S2 SegmentedControl */}
      {toolbar !== 'minimal' && (
        <SegmentedControl
          selectedKey={view}
          onSelectionChange={(k: Key) => setView(k as ViewId)}
          aria-label="视图切换"
          UNSAFE_className="s2-ss"
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
        <ActionButton isQuiet aria-label="通知" UNSAFE_className="s2-sf">
          <Ic.bell />
        </ActionButton>
        <span className="s2-dot" />
      </span>
      <span className="tb-icon-wrap" ref={settingsAnchorRef}>
        <ActionButton
          isQuiet
          aria-label="设置"
          UNSAFE_className="s2-sf"
          onPress={() => {
            if (settingsAnchorRef.current) {
              openSettings(settingsAnchorRef.current);
            }
          }}
        >
          <Ic.settings />
        </ActionButton>
      </span>
    </header>
  );
}
