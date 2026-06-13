// ===== swell-calendar 主应用 =====（移植自设计稿 app.jsx）
// 设计稿的 tweaks 面板是 Claude Design 编辑器宿主工具，非真实功能，已剔除；
// 当前把主题/强调色/密度收敛为宿主可持久化配置，其余 card/toolbar/popover 保持设计默认值。
// P4: scheduler / timeline 视图已替换为 swell-calendar 真引擎（拖拽/resize/创建）。
import { Provider } from '@react-spectrum/s2';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { CalendarInstance, EventObject } from 'swell-calendar';
import Calendar from 'swell-calendar';

import {
  calendarCalendars,
  calendarResources,
  dateToDayIndex,
  dayIndexToDate,
  decimalHourToTime,
  engineEventToDraft,
  timeToDecimalHour,
  toCalendarEvents,
  toPickEvent,
} from './calendarData';
import { type Cat, type CalEvent, resources as RESOURCES } from './data';
import { dataSource, type EventDraft } from './dataSource';
import { useCalendarData } from './useCalendarData';
import {
  CreateDialog,
  FILTER_CATS,
  Popover,
  SettingsPanel,
  SubBar,
  type NewEventInput,
  type UiPrefs,
} from './overlays';
import { Sidebar, Topbar, type ViewId } from './shell';
import { type PickEvent } from './views';

// 事件 CRUD（种子 / 用户新建 / 编辑覆盖 / 删除墓碑四层）已收敛到 dataSource + useCalendarData（P6）。
// App 仅持有 UI 偏好的持久化——UI 状态不属于业务数据，不走数据源。
const UI_PREFS_KEY = 'swell-calendar-s2:ui-prefs';

const UI_DEFAULTS = {
  prefs: {
    theme: 'light',
    accent: 'seafoam',
    density: 'regular',
  } as UiPrefs,
  card: 'soft',
  toolbar: 'segmented' as const,
  popover: 'rich' as const,
  sidebar: 'full' as 'full' | 'rail' | 'hidden',
};

const DENSITY_TIMELINE_ROW_HEIGHT: Record<UiPrefs['density'], number> = {
  compact: 56,
  regular: 64,
  comfy: 76,
};

const VIEW_TITLE: Record<ViewId, [string, string]> = {
  day: ['周四 · 3月21日', '2025年 · 第12周'],
  week: ['3月18日 – 24日', '2025年 · 第12周'],
  month: ['2025年 3月', '31天 · 12场会议'],
  scheduler: ['周四 · 3月21日', '3项资源 · 会议室'],
  timeline: ['本周日程', '3月18日 – 24日 · 议程视图'],
};

// 主题值全部指向 CSS 变量。
// 这样 root 上的 data-theme / data-accent 改变后，日历引擎无需维护多份硬编码 theme object。
const CALENDAR_THEME = {
  week: {
    nowIndicatorLabel: { color: 'var(--accent-bg)' },
    gridSelection: { color: 'var(--accent-bg)' },
    today: { color: 'inherit', backgroundColor: 'var(--accent-tint)' },
  },
  common: {
    gridSelection: {
      backgroundColor: 'var(--accent-tint)',
      border: '1px solid var(--accent-bg)',
    },
  },
  timeline: {
    header: {
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--bg-layer)',
      placeholderBackgroundColor: 'var(--bg-layer)',
      monthColor: 'var(--text-2)',
      monthBackgroundColor: 'var(--bg-layer)',
      monthBorderBottom: '1px solid var(--border)',
      dayBorderRight: '1px solid var(--grid-line)',
      weekendBackgroundColor: 'var(--weekend-bg)',
      todayBackgroundColor: 'var(--accent-tint)',
      todayColor: 'var(--accent-text)',
      weekdayColor: 'var(--text-3)',
      dateColor: 'var(--text-1)',
    },
    schedulerHeader: {
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--bg-layer)',
      dayLabelColor: 'var(--text-2)',
      dayLabelBorderRight: '1px solid var(--grid-line)',
      dateRowBackgroundColor: 'var(--bg-layer)',
      dateRowBorderBottom: '1px solid var(--border)',
    },
    schedulerResourceCell: {
      nameColor: 'var(--text-1)',
    },
    resourceList: {
      borderRight: '1px solid var(--border)',
      backgroundColor: 'var(--bg-layer-2)',
    },
    resourceItem: {
      borderBottom: '1px solid var(--grid-line)',
      nameColor: 'var(--text-1)',
    },
    grid: {
      rowBorderBottom: '1px solid var(--grid-line-soft)',
      cellBorderRight: '1px solid var(--grid-line)',
      weekendBackgroundColor: 'var(--weekend-bg)',
      todayBackgroundColor: 'var(--accent-tint)',
      dragGhostBackgroundColor: 'var(--accent-tint-strong)',
      dragGhostBorder: '1px dashed var(--accent-bg)',
    },
    emptyColor: 'var(--text-disabled)',
    tooltip: {
      backgroundColor: 'var(--bg-layer-2)',
      color: 'var(--text-1)',
      border: '1px solid var(--border)',
    },
  },
};

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function loadPrefs(): UiPrefs {
  const raw = loadJSON<Partial<UiPrefs>>(UI_PREFS_KEY, UI_DEFAULTS.prefs);
  return { ...UI_DEFAULTS.prefs, ...raw };
}

/** 把对话框输入转成事件草稿（无 id，由数据源分配）；编辑时传入原事件以保留 who/desc 等对话框不编辑的字段。 */
function inputToDraft(input: NewEventInput, base?: CalEvent): EventDraft {
  const resource = RESOURCES.find((r) => r.id === input.res);
  return {
    ...base,
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

export default function App() {
  const [view, setView] = useState<ViewId>('scheduler');
  const [pick, setPick] = useState<{ ev: PickEvent; anchor: HTMLElement } | null>(null);
  const [creating, setCreating] = useState(false);
  const [showWknd, setShowWknd] = useState(true);
  const [sidebar, setSidebar] = useState(UI_DEFAULTS.sidebar);
  const [prefs, setPrefs] = useState<UiPrefs>(loadPrefs);
  const {
    events: allEvents,
    status,
    error,
    reload,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useCalendarData(dataSource);
  const [query, setQuery] = useState('');
  const [activeCats, setActiveCats] = useState<Set<Cat>>(() => new Set(FILTER_CATS));
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  // 引擎滑动新建 / 单元格点击预填的新建对话框初始值（P7b）
  const [createInitial, setCreateInitial] = useState<NewEventInput | null>(null);
  const calRef = useRef<CalendarInstance>(null);

  const toggleCat = (c: Cat) =>
    setActiveCats((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });

  // allEvents 由数据源解析（四层叠加在 LocalStorageDataSource 内部完成）。
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
  const timelineRowHeight = DENSITY_TIMELINE_ROW_HEIGHT[prefs.density];

  // UI 偏好放在 localStorage，保证 demo 刷新后还能复现当前外观上下文。
  useEffect(() => {
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  // 根节点 data-* 是整套设计 CSS 的总开关；同时 calendar theme 也读取同名 CSS 变量。
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-theme', prefs.theme);
    r.setAttribute('data-accent', prefs.accent);
    r.setAttribute('data-density', prefs.density);
  }, [prefs]);

  // 新建 / 编辑共用同一对话框：editing 为空走新建，否则把编辑结果写入数据源（内部落 override 层）
  const handleSubmit = (input: NewEventInput) => {
    if (editing) {
      updateEvent(editing.id, inputToDraft(input, editing));
    } else {
      createEvent(inputToDraft(input));
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
      deleteEvent(id);
      setPick(null);
    }
  };

  const closeDialog = () => {
    setCreating(false);
    setEditing(null);
    setCreateInitial(null);
  };

  const openSettings = (anchor: HTMLElement) => {
    setSettingsAnchor((prev) => (prev === anchor ? null : anchor));
  };

  // ===== P7b: 引擎回调接线 =====

  /** 把引擎事件对象转为新建对话框的预填值（NewEventInput）。 */
  const engineEventToCreateInput = (event: EventObject): NewEventInput => {
    const draft = engineEventToDraft(event);
    return {
      title: draft.title,
      res: draft.res,
      date: dayIndexToDate(draft.day),
      start: decimalHourToTime(draft.start),
      end: decimalHourToTime(draft.end),
      cat: draft.cat,
    };
  };

  /** 滑动新建 / 单元格点击 → 弹出新建对话框并预填时间、资源。 */
  const handleEngineCreate = (info: { event: EventObject }) => {
    setCreateInitial(engineEventToCreateInput(info.event));
    setCreating(true);
  };

  /** 拖拽移动 / resize → 基于原事件合并后写回数据源（防止丢失 title/cat/who/desc）。 */
  const handleEngineUpdate = (info: { event: EventObject }) => {
    if (!info.event.id) return;
    const draft = engineEventToDraft(info.event);
    updateEvent(info.event.id, draft);
  };

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

  const closePop = () => setPick(null);

  const [title, sub] = VIEW_TITLE[view];

  return (
    <Provider colorScheme={prefs.theme}>
      <div
        className="app"
        data-sidebar={sidebar}
        data-card={UI_DEFAULTS.card}
        data-density={prefs.density}
      >
        <Sidebar view={view} setView={setView} openCreate={() => setCreating(true)} />
        <div className="main">
          <Topbar
            view={view}
            setView={setView}
            toolbar={UI_DEFAULTS.toolbar}
            toggleRail={() => setSidebar(sidebar === 'full' ? 'rail' : 'full')}
            title={title}
            sub={sub}
            query={query}
            setQuery={setQuery}
            openSettings={openSettings}
          />
          {(view === 'week' || view === 'day' || view === 'scheduler' || view === 'month') && (
            <SubBar
              showWknd={showWknd}
              setShowWknd={setShowWknd}
              activeCats={activeCats}
              onToggleCat={toggleCat}
              onShowAll={() => setActiveCats(new Set(FILTER_CATS))}
            />
          )}
          <div className="canvas" key={view}>
            {status === 'loading' ? (
              <div className="data-state" role="status" aria-live="polite">
                <div className="data-state-spinner" aria-hidden />
                <p className="data-state-msg">正在加载日程…</p>
              </div>
            ) : status === 'error' ? (
              <div className="data-state data-state--error" role="alert">
                <p className="data-state-msg">日程加载失败{error ? `：${error}` : ''}</p>
                <button type="button" className="data-state-btn" onClick={reload}>
                  重试
                </button>
              </div>
            ) : allEvents.length === 0 ? (
              <div className="data-state">
                <p className="data-state-msg">还没有任何日程</p>
                <button type="button" className="data-state-btn" onClick={() => setCreating(true)}>
                  新建日程
                </button>
              </div>
            ) : (
              <Calendar
                ref={calRef}
                events={calendarEvents}
                calendars={calendarCalendars}
                theme={CALENDAR_THEME}
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
                    rowHeight: timelineRowHeight,
                  },
                }}
                callbacks={{
                  onEventClick: ({ event }) => {
                    setPick({
                      ev: toPickEvent(event),
                      anchor: document.activeElement as HTMLElement,
                    });
                  },
                  // P7b: 滑动新建 / 单元格点击 → 预填对话框
                  onEventCreate: handleEngineCreate,
                  // P7b: 拖拽移动 / resize → 基于 raw 合并写回数据源
                  onEventUpdate: handleEngineUpdate,
                  // P7b: 创建 / 更新被引擎策略拒绝时静默忽略
                  // TODO: toast 提示用户 overlap / invalid / policy 拒绝原因
                  onEventCreateFailed: () => {},
                  onEventUpdateFailed: () => {},
                }}
              />
            )}
          </div>
        </div>

        {pick && (
          <Popover
            ev={pick.ev}
            anchor={pick.anchor}
            onClose={closePop}
            variant={UI_DEFAULTS.popover}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
        {(creating || editing) && (
          <CreateDialog
            onClose={closeDialog}
            onCreate={handleSubmit}
            initial={editing ? calEventToInput(editing) : createInitial ?? undefined}
          />
        )}
        {settingsAnchor && (
          <SettingsPanel
            anchor={settingsAnchor}
            value={prefs}
            onChange={setPrefs}
            onClose={() => setSettingsAnchor(null)}
          />
        )}
      </div>
    </Provider>
  );
}
