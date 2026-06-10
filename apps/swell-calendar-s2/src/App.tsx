// ===== swell-calendar 主应用 =====（移植自设计稿 app.jsx）
// 设计稿的 tweaks 面板是 Claude Design 编辑器宿主工具，非真实功能，已剔除；
// 这里固定采用其默认配置（light / seafoam / soft / segmented / rich / full / regular）。
import { useEffect, useState } from 'react';

import { CreateDialog, Popover } from './overlays';
import { Sidebar, Topbar, type ViewId } from './shell';
import { SubBar } from './overlays';
import { DayView, MonthView, type PickEvent, SchedulerView, TimelineView, WeekView } from './views';
import { events as ALL_EVENTS } from './data';

const CONFIG = {
  theme: 'light' as 'light' | 'dark',
  accent: 'seafoam',
  card: 'soft',
  toolbar: 'segmented' as const,
  popover: 'rich' as const,
  sidebar: 'full' as 'full' | 'rail' | 'hidden',
  density: 'regular' as 'compact' | 'regular' | 'comfy',
};

const VIEW_TITLE: Record<ViewId, [string, string]> = {
  day: ['周四 · 3月21日', '2025年 · 第12周'],
  week: ['3月18日 – 24日', '2025年 · 第12周'],
  month: ['2025年 3月', '31天 · 12场会议'],
  scheduler: ['周四 · 3月21日', '6项资源 · 会议室与成员'],
  timeline: ['本周日程', '3月18日 – 24日 · 议程视图'],
};

export default function App() {
  const [view, setView] = useState<ViewId>('scheduler');
  const [pick, setPick] = useState<{ ev: PickEvent; anchor: HTMLElement } | null>(null);
  const [creating, setCreating] = useState(false);
  const [showWknd, setShowWknd] = useState(true);
  const [sidebar, setSidebar] = useState(CONFIG.sidebar);

  // 主题 + 强调色作用到 root
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-theme', CONFIG.theme);
    r.setAttribute('data-accent', CONFIG.accent);
  }, []);

  const hourH = CONFIG.density === 'compact' ? 46 : CONFIG.density === 'comfy' ? 70 : 56;
  const rowH = CONFIG.density === 'compact' ? 62 : CONFIG.density === 'comfy' ? 92 : 76;

  const onPick: (ev: PickEvent, anchor: HTMLElement) => void = (ev, anchor) =>
    setPick({ ev, anchor });
  const closePop = () => setPick(null);

  const [title, sub] = VIEW_TITLE[view];

  return (
    <div className="app" data-sidebar={sidebar} data-card={CONFIG.card}>
      <Sidebar view={view} setView={setView} openCreate={() => setCreating(true)} />
      <div className="main">
        <Topbar
          view={view}
          setView={setView}
          toolbar={CONFIG.toolbar}
          toggleRail={() => setSidebar(sidebar === 'full' ? 'rail' : 'full')}
          title={title}
          sub={sub}
        />
        {(view === 'week' || view === 'day' || view === 'scheduler') && (
          <SubBar showWknd={showWknd} setShowWknd={setShowWknd} />
        )}
        <div className="canvas" key={view}>
          {view === 'day' && (
            <DayView events={ALL_EVENTS} onPick={onPick} selId={pick?.ev.id} hourH={hourH} />
          )}
          {view === 'week' && (
            <WeekView
              events={ALL_EVENTS}
              onPick={onPick}
              selId={pick?.ev.id}
              hourH={hourH}
              showWknd={showWknd}
            />
          )}
          {view === 'month' && <MonthView onPick={onPick} />}
          {view === 'scheduler' && (
            <SchedulerView onPick={onPick} selId={pick?.ev.id} rowH={rowH} />
          )}
          {view === 'timeline' && <TimelineView onPick={onPick} />}
        </div>
      </div>

      {pick && (
        <Popover ev={pick.ev} anchor={pick.anchor} onClose={closePop} variant={CONFIG.popover} />
      )}
      {creating && <CreateDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
