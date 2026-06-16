// ===== swell-calendar 主应用 =====（移植自设计稿 app.jsx）
// 设计稿的 tweaks 面板是 Claude Design 编辑器宿主工具，非真实功能，已剔除；
// 当前把主题/强调色/密度收敛为宿主可持久化配置，其余 card/toolbar/popover 保持设计默认值。
// P4: scheduler / timeline 视图已替换为 swell-calendar 真引擎（拖拽/resize/创建）。
import { Provider, ToastContainer, ToastQueue } from '@react-spectrum/s2';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { CalendarInstance, EventObject } from 'swell-calendar';
import Calendar, { useCalendarDataSource } from 'swell-calendar';

import {
  calEventToInput,
  calendarCalendars,
  calendarResources,
  engineEventToCreateInput,
  engineEventToDraft,
  inputToDraft,
  toCalendarEvents,
  toPickEvent,
} from './calendarData';
import { type Cat, type CalEvent, type PickEvent } from './data';
import { dataSource } from './dataSource';
import {
  CreateDialog,
  FILTER_CATS,
  Popover,
  SettingsPanel,
  SubBar,
  type NewEventInput,
  type UiPrefs,
} from './overlays';
import { DayWeekStrip, Sidebar, Topbar, type ViewId } from './shell';

// 事件 CRUD（种子 / 用户新建 / 编辑覆盖 / 删除墓碑四层）已收敛到 dataSource + useCalendarDataSource（P6）。
// useCalendarDataSource 与 CalendarDataSource 契约已下沉到 swell-calendar 包（宿主侧可选装配件）。
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

// dayjs 初始化
dayjs.extend(weekOfYear);
dayjs.locale('zh-cn');

const DOW_SHORT = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 根据 view + currentDate 动态生成顶栏标题和副标题 */
function computeViewTitle(view: ViewId, d: Date): [string, string] {
  const dj = dayjs(d);
  const year = dj.year();
  const week = dj.week();
  const month = dj.month() + 1;
  const date = dj.date();
  const dow = DOW_SHORT[dj.day()];
  const weekSub = `${year}年 · 第${week}周`;

  switch (view) {
    case 'day':
      return [`${dow} · ${month}月${date}日`, weekSub];
    case 'week': {
      // dayjs zh-cn locale: startOf('week') = 周一
      const start = dj.startOf('week');
      const end = start.add(6, 'day');
      const sMonth = start.month() + 1;
      const sDate = start.date();
      const eDate = end.date();
      return [`${sMonth}月${sDate}日 – ${eDate}日`, weekSub];
    }
    case 'month': {
      const daysInMonth = dj.daysInMonth();
      return [`${year}年 ${month}月`, `${daysInMonth}天`];
    }
    case 'scheduler':
      return [`${dow} · ${month}月${date}日`, `${calendarResources.length}项资源`];
    case 'timeline': {
      const start = dj.startOf('week');
      const end = start.add(6, 'day');
      const sMonth = start.month() + 1;
      const sDate = start.date();
      const eDate = end.date();
      return ['本周日程', `${sMonth}月${sDate}日 – ${eDate}日 · 议程视图`];
    }
    default:
      return [`${month}月${date}日`, weekSub];
  }
}

// 主题值全部指向 CSS 变量。
// 这样 root 上的 data-theme / data-accent 改变后，日历引擎无需维护多份硬编码 theme object。
const CALENDAR_THEME = {
  week: {
    nowIndicatorLabel: { color: 'var(--accent-bg)' },
    gridSelection: { color: 'var(--accent-bg)' },
    today: { color: 'inherit', backgroundColor: 'transparent' },
  },
  common: {
    gridSelection: {
      backgroundColor: 'color-mix(in oklch, var(--accent-tint) 58%, transparent)',
      border: '1px solid color-mix(in oklch, var(--accent-bg) 70%, transparent)',
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
      todayBackgroundColor: 'transparent',
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
      todayBackgroundColor: 'transparent',
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

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// 引擎不向 onEventClick 回传被点卡片的 DOM 节点，但各视图都给事件卡打了带 id 的 data-testid。
// 据此按 id 定位真实卡片元素，供详情弹层锚定（替代不可靠的 document.activeElement）。
const EVENT_CARD_TESTID_PREFIXES = ['event-card', 'month-event', 'timeline-event'];
function findEventAnchor(id: string): HTMLElement | null {
  for (const prefix of EVENT_CARD_TESTID_PREFIXES) {
    const el = document.querySelector<HTMLElement>(`[data-testid="${prefix}-${id}"]`);
    if (el) return el;
  }
  return null;
}

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

interface AppProps {
  /** 当前视图，由路由参数派生（唯一真源是 URL）。 */
  view: ViewId;
}

export default function App({ view }: AppProps) {
  // view 的真源是 URL（router.tsx）；currentDate 由 App 内部管理 + 引擎 onPageChange 回填。
  // 刷新回到今天。
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
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
  } = useCalendarDataSource(dataSource);
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

  // ===== 日期 / 视图导航 =====
  // view 的真源是 URL（router.tsx），切视图直接写 URL。
  // currentDate 由 App 内部管理：用户操作 → calRef 命令式驱动引擎 → onPageChange 回填 state。

  /** 切视图：写到 URL，日期不变。 */
  const goToRoute = (nextView: ViewId) => {
    navigate(`/app/calendar/${nextView}`);
  };

  /** MiniCalendar 点日期 → 同步 state + 引擎 setDate（引擎回填的 onPageChange 同日，不会成环）。 */
  const goToDate = (d: Date) => {
    setCurrentDate(d);
    calRef.current?.setDate(d);
  };

  /** 顶栏「今天」：引擎回到今天，日期由 onPageChange 回填 currentDate。 */
  const goToToday = () => {
    calRef.current?.goToToday();
  };

  /** 顶栏左右箭头：引擎翻页，日期由 onPageChange 回填 currentDate。 */
  const goToDir = (dir: 'prev' | 'next') => {
    calRef.current?.navigate(dir);
  };

  /** 反向：引擎翻页 / setDate / goToToday → 回填 currentDate，仅在跨日时更新避免重渲抖动。 */
  const handlePageChange = (info: { date: { toDate: () => Date } }) => {
    const next = info.date.toDate();
    setCurrentDate((prev) => (isSameDay(prev, next) ? prev : next));
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

  const [title, sub] = useMemo(() => computeViewTitle(view, currentDate), [view, currentDate]);

  // 引擎 options 稳定化：引擎有 effect 监听 options.defaultView/initialDate 的引用变化
  // （packages/calendar Calendar.tsx:60-68），内联对象每次 render 新引用会让它与 onPageChange 成环。
  // useMemo 让引用仅在 view / currentDate / 周末开关 / 密度变化时改变，其余 render 复用旧引用。
  const calendarOptions = useMemo(
    () => ({
      defaultView: view,
      // 动态兜底：即便发生重挂载也落在当前导航日期
      initialDate: currentDate,
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
    }),
    [view, currentDate, showWknd, timelineRowHeight]
  );

  return (
    <Provider colorScheme={prefs.theme}>
      <ToastContainer />
      <div
        className="app"
        data-sidebar={sidebar}
        data-card={UI_DEFAULTS.card}
        data-density={prefs.density}
      >
        <Sidebar
          view={view}
          setView={goToRoute}
          openCreate={() => setCreating(true)}
          currentDate={currentDate}
          onDateChange={goToDate}
        />
        <div className="main">
          <Topbar
            view={view}
            setView={goToRoute}
            toolbar={UI_DEFAULTS.toolbar}
            toggleRail={() => setSidebar(sidebar === 'full' ? 'rail' : 'full')}
            title={title}
            sub={sub}
            query={query}
            setQuery={setQuery}
            openSettings={openSettings}
            onToday={goToToday}
            onNavigate={goToDir}
          />
          {view === 'day' && <DayWeekStrip currentDate={currentDate} onDateChange={goToDate} />}
          {(view === 'week' || view === 'day' || view === 'scheduler' || view === 'month') && (
            <SubBar
              showWknd={showWknd}
              setShowWknd={setShowWknd}
              // 仅周视图 / 资源调度真正支持隐藏周末列（引擎 week.workweek）；日/月视图下无意义
              showWeekendToggle={view === 'week' || view === 'scheduler'}
              activeCats={activeCats}
              onToggleCat={toggleCat}
              onShowAll={() => setActiveCats(new Set(FILTER_CATS))}
            />
          )}
          {/* P8b: 去掉 key={view}，改纯 setView 驱动，避免切视图重挂载重置已导航日期 */}
          <div className="canvas">
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
                options={calendarOptions}
                callbacks={{
                  onEventClick: ({ event }) => {
                    // 锚定到真实被点卡片；极少数找不到时退回 activeElement，避免弹层不可见
                    const anchor =
                      findEventAnchor(event.id) ?? (document.activeElement as HTMLElement);
                    setPick({
                      ev: toPickEvent(event),
                      anchor,
                    });
                  },
                  // P7b: 滑动新建 / 单元格点击 → 预填对话框
                  onEventCreate: handleEngineCreate,
                  // P7b: 拖拽移动 / resize → 基于 raw 合并写回数据源
                  onEventUpdate: handleEngineUpdate,
                  // P7b: 创建 / 更新被引擎策略拒绝（overlap / invalid / policy）时 toast 提示
                  onEventCreateFailed: () => {
                    ToastQueue.negative('无法创建日程：与现有安排冲突或时段不合法', {
                      timeout: 5000,
                    });
                  },
                  onEventUpdateFailed: () => {
                    ToastQueue.negative('无法更新日程：与现有安排冲突或时段不合法', {
                      timeout: 5000,
                    });
                  },
                  // P8b: 引擎翻页 → 回填 currentDate，联动 MiniCalendar 高亮
                  onPageChange: handlePageChange,
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
