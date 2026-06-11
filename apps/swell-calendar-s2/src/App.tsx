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
  dayIndexToDate,
  decimalHourToTime,
  timeToDecimalHour,
  toCalendarEvents,
  toPickEvent,
} from './calendarData';
import { CreateDialog, FILTER_CATS, type NewEventInput, Popover } from './overlays';
import { Sidebar, Topbar, type ViewId } from './shell';
import { SubBar } from './overlays';
import { DayView, MonthView, type PickEvent, WeekView } from './views';
import { type Cat, type CalEvent, events as SEED_EVENTS, resources as RESOURCES } from './data';

// 持久化分三层：用户新建事件 / 对种子&新建事件的编辑覆盖 / 删除墓碑。
// 种子数据始终不可变，编辑与删除都以叠加层表达，刷新后可完整还原视图。
const USER_EVENTS_KEY = 'swell-calendar-s2:user-events';
const OVERRIDES_KEY = 'swell-calendar-s2:overrides';
const DELETED_KEY = 'swell-calendar-s2:deleted-ids';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** 把对话框输入转成 CalEvent；编辑时传入原 id 与原事件以保留 who/desc 等对话框不编辑的字段。 */
function inputToCalEvent(input: NewEventInput, base?: CalEvent): CalEvent {
  const resource = RESOURCES.find((r) => r.id === input.res);
  return {
    ...base,
    id: base?.id ?? `u-${Date.now()}`,
    res: input.res,
    day: dateToDayIndex(input.date),
    start: timeToDecimalHour(input.start),
    end: timeToDecimalHour(input.end),
    title: input.title,
    cat: input.cat,
    loc: resource?.short,
  };
}

/** CalEvent → 对话框预填输入（编辑回填用）。 */
function calEventToInput(e: CalEvent): NewEventInput {
  return {
    title: e.title,
    res: e.res,
    date: dayIndexToDate(e.day),
    start: decimalHourToTime(e.start),
    end: decimalHourToTime(e.end),
    cat: e.cat,
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
  const [userEvents, setUserEvents] = useState<CalEvent[]>(() =>
    loadJSON<CalEvent[]>(USER_EVENTS_KEY, [])
  );
  const [overrides, setOverrides] = useState<Record<string, CalEvent>>(() =>
    loadJSON<Record<string, CalEvent>>(OVERRIDES_KEY, {})
  );
  const [deletedIds, setDeletedIds] = useState<string[]>(() => loadJSON<string[]>(DELETED_KEY, []));
  const [query, setQuery] = useState('');
  const [activeCats, setActiveCats] = useState<Set<Cat>>(() => new Set(FILTER_CATS));
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const calRef = useRef<CalendarInstance>(null);

  const toggleCat = (c: Cat) =>
    setActiveCats((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });

  // 种子（不可变）+ 用户新建，再叠加编辑覆盖、剔除已删除，得到完整事件列表
  const allEvents = useMemo(() => {
    const deleted = new Set(deletedIds);
    return [...SEED_EVENTS, ...userEvents]
      .filter((e) => !deleted.has(e.id))
      .map((e) => overrides[e.id] ?? e);
  }, [userEvents, overrides, deletedIds]);
  // 搜索 + 分类过滤后的可见事件
  const visibleEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEvents.filter((e) => {
      // chip 分类被关闭则隐藏；非 chip 分类（如 magenta）始终可见
      if (FILTER_CATS.includes(e.cat) && !activeCats.has(e.cat)) return false;
      if (q && !`${e.title} ${e.who ?? ''} ${e.loc ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allEvents, query, activeCats]);
  // 引擎 events prop 需新数组引用才会重渲，useMemo 在 visibleEvents 变化时给出新引用
  const calendarEvents = useMemo(() => toCalendarEvents(visibleEvents), [visibleEvents]);

  // 持久化三层叠加状态
  useEffect(() => {
    localStorage.setItem(USER_EVENTS_KEY, JSON.stringify(userEvents));
  }, [userEvents]);
  useEffect(() => {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  }, [overrides]);
  useEffect(() => {
    localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
  }, [deletedIds]);

  // 新建 / 编辑共用同一对话框：editing 为空走新建，否则把编辑结果写入覆盖层
  const handleSubmit = (input: NewEventInput) => {
    if (editing) {
      const updated = inputToCalEvent(input, editing);
      setOverrides((prev) => ({ ...prev, [editing.id]: updated }));
    } else {
      setUserEvents((prev) => [...prev, inputToCalEvent(input)]);
    }
  };

  const openEdit = () => {
    const original = allEvents.find((e) => e.id === pick?.ev.id);
    if (original) {
      setEditing(original);
      setPick(null);
    }
  };

  const handleDelete = () => {
    const id = pick?.ev.id;
    if (id) {
      setDeletedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setPick(null);
    }
  };

  const closeDialog = () => {
    setCreating(false);
    setEditing(null);
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
          query={query}
          setQuery={setQuery}
        />
        {(view === 'week' || view === 'day' || view === 'scheduler') && (
          <SubBar
            showWknd={showWknd}
            setShowWknd={setShowWknd}
            activeCats={activeCats}
            onToggleCat={toggleCat}
            onShowAll={() => setActiveCats(new Set(FILTER_CATS))}
          />
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
                <DayView events={visibleEvents} onPick={onPick} selId={pick?.ev.id} hourH={hourH} />
              )}
              {view === 'week' && (
                <WeekView
                  events={visibleEvents}
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
        <Popover
          ev={pick.ev}
          anchor={pick.anchor}
          onClose={closePop}
          variant={CONFIG.popover}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}
      {(creating || editing) && (
        <CreateDialog
          onClose={closeDialog}
          onCreate={handleSubmit}
          initial={editing ? calEventToInput(editing) : undefined}
        />
      )}
    </div>
  );
}
