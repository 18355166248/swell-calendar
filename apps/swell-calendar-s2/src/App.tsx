// ===== swell-calendar 主应用 =====（移植自设计稿 app.jsx）
// 设计稿的 tweaks 面板是 Claude Design 编辑器宿主工具，非真实功能，已剔除；
// 这里固定采用其默认配置（light / seafoam / soft / segmented / rich / full / regular）。
// P4: scheduler / timeline 视图已替换为 swell-calendar 真引擎（拖拽/resize/创建）。
import { useEffect, useMemo, useRef, useState } from 'react';

import type { CalendarInstance } from 'swell-calendar';
import Calendar from 'swell-calendar';

import {
  calendarCalendars,
  calendarResources,
  dateToDayIndex,
  timeToDecimalHour,
  toCalendarEvents,
  toPickEvent,
} from './calendarData';
import { CreateDialog, type NewEventInput, Popover } from './overlays';
import { Sidebar, Topbar, type ViewId } from './shell';
import { SubBar } from './overlays';
import { DayView, MonthView, type PickEvent, WeekView } from './views';
import { type CalEvent, events as SEED_EVENTS, resources as RESOURCES } from './data';

// 仅持久化「用户新建」的事件，种子数据保持不可变、可随代码更新。
const USER_EVENTS_KEY = 'swell-calendar-s2:user-events';

function loadUserEvents(): CalEvent[] {
  try {
    const raw = localStorage.getItem(USER_EVENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CalEvent[]) : [];
  } catch {
    return [];
  }
}

/** 把新建对话框的输入转成 CalEvent（loc 取资源短名，便于 popover 展示）。 */
function inputToCalEvent(input: NewEventInput): CalEvent {
  const resource = RESOURCES.find((r) => r.id === input.res);
  return {
    id: `u-${Date.now()}`,
    res: input.res,
    day: dateToDayIndex(input.date),
    start: timeToDecimalHour(input.start),
    end: timeToDecimalHour(input.end),
    title: input.title,
    cat: input.cat,
    loc: resource?.short,
  };
}

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

// seafoam 设计 token — 将日历库默认的 indigo 色系替换为 seafoam 色系
const SEAFOAM_THEME = {
  week: {
    nowIndicatorLabel: { color: 'oklch(0.62 0.09 192)' },
    gridSelection: { color: 'oklch(0.62 0.09 192)' },
    today: { color: 'inherit', backgroundColor: 'oklch(0.93 0.04 192 / 0.5)' },
  },
  common: {
    gridSelection: {
      backgroundColor: 'oklch(0.62 0.09 192 / 0.15)',
      border: '1px solid oklch(0.62 0.09 192 / 0.4)',
    },
  },
  timeline: {
    header: {
      todayBackgroundColor: 'oklch(0.62 0.09 192 / 0.1)',
      todayColor: 'oklch(0.52 0.09 192)',
    },
    schedulerHeader: {
      dayLabelColor: 'oklch(0.43 0.03 210)',
      dayLabelBorderRight: '1px solid oklch(0.9 0.01 210)',
      dateRowBackgroundColor: 'oklch(0.98 0.01 192)',
      dateRowBorderBottom: '1px solid oklch(0.91 0.02 192)',
    },
    schedulerResourceCell: {
      nameColor: 'oklch(0.32 0.03 210)',
    },
    grid: {
      todayBackgroundColor: 'oklch(0.62 0.09 192 / 0.06)',
      dragGhostBackgroundColor: 'oklch(0.62 0.09 192 / 0.22)',
      dragGhostBorder: '1px dashed oklch(0.52 0.09 192 / 0.9)',
    },
  },
};

export default function App() {
  const [view, setView] = useState<ViewId>('scheduler');
  const [pick, setPick] = useState<{ ev: PickEvent; anchor: HTMLElement } | null>(null);
  const [creating, setCreating] = useState(false);
  const [showWknd, setShowWknd] = useState(true);
  const [sidebar, setSidebar] = useState(CONFIG.sidebar);
  const [userEvents, setUserEvents] = useState<CalEvent[]>(loadUserEvents);
  const calRef = useRef<CalendarInstance>(null);

  // 种子（不可变）+ 用户新建，合并为完整事件列表
  const allEvents = useMemo(() => [...SEED_EVENTS, ...userEvents], [userEvents]);
  // 引擎 events prop 需新数组引用才会重渲，useMemo 在 allEvents 变化时给出新引用
  const calendarEvents = useMemo(() => toCalendarEvents(allEvents), [allEvents]);

  // 持久化用户新建的事件
  useEffect(() => {
    localStorage.setItem(USER_EVENTS_KEY, JSON.stringify(userEvents));
  }, [userEvents]);

  const handleCreate = (input: NewEventInput) => {
    setUserEvents((prev) => [...prev, inputToCalEvent(input)]);
  };

  // 主题 + 强调色作用到 root
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-theme', CONFIG.theme);
    r.setAttribute('data-accent', CONFIG.accent);
  }, []);

  // 当视图切换时，同步 Calendar 内部视图
  useEffect(() => {
    if (
      calRef.current &&
      (view === 'scheduler' ||
        view === 'timeline' ||
        view === 'day' ||
        view === 'week' ||
        view === 'month')
    ) {
      try {
        calRef.current.setView(view);
      } catch {
        // 视图名不匹配时忽略
      }
    }
  }, [view]);

  const hourH = CONFIG.density === 'compact' ? 46 : CONFIG.density === 'comfy' ? 70 : 56;

  const onPick: (ev: PickEvent, anchor: HTMLElement) => void = (ev, anchor) =>
    setPick({ ev, anchor });
  const closePop = () => setPick(null);

  const [title, sub] = VIEW_TITLE[view];

  // 是否使用真引擎（Calendar 组件）
  const useEngine = view === 'scheduler' || view === 'timeline';

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
          {useEngine ? (
            <Calendar
              ref={calRef}
              events={calendarEvents}
              calendars={calendarCalendars}
              theme={SEAFOAM_THEME}
              options={{
                defaultView: view,
                initialDate: '2025-03-21',
                week: {
                  startDayOfWeek: 1,
                  hourStart: 8,
                  hourEnd: 20,
                  workweek: !showWknd,
                },
                scheduler: {
                  resources: calendarResources,
                  hourStart: 8,
                  hourEnd: 20,
                },
                timeline: {
                  resources: calendarResources,
                },
              }}
              callbacks={{
                onEventClick: ({ event }) => {
                  setPick({
                    ev: toPickEvent(event),
                    anchor: document.activeElement as HTMLElement,
                  });
                },
              }}
            />
          ) : (
            <>
              {view === 'day' && (
                <DayView events={allEvents} onPick={onPick} selId={pick?.ev.id} hourH={hourH} />
              )}
              {view === 'week' && (
                <WeekView
                  events={allEvents}
                  onPick={onPick}
                  selId={pick?.ev.id}
                  hourH={hourH}
                  showWknd={showWknd}
                />
              )}
              {view === 'month' && <MonthView onPick={onPick} />}
            </>
          )}
        </div>
      </div>

      {pick && (
        <Popover ev={pick.ev} anchor={pick.anchor} onClose={closePop} variant={CONFIG.popover} />
      )}
      {creating && <CreateDialog onClose={() => setCreating(false)} onCreate={handleCreate} />}
    </div>
  );
}
