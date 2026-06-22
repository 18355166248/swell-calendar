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
  buildCalendarOptions,
  computeViewTitle,
  DEFAULT_CALENDAR_TUNING,
  sanitizeCalendarTuning,
  type CalendarHostTuning,
} from './appCalendarConfig';
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
  MobileEventSheet,
  MoreEventsPopover,
  Popover,
  SettingsPanel,
  SubBar,
  type NewEventInput,
  type UiPrefs,
} from './overlays';
import {
  DayWeekStrip,
  MobilePlaceholder,
  MobileTopBar,
  Sidebar,
  Topbar,
  type MobileViewId,
  type ViewId,
} from './shell';
import { useIsMobile } from './useIsMobile';

// 事件 CRUD（种子 / 用户新建 / 编辑覆盖 / 删除墓碑四层）已收敛到 dataSource + useCalendarDataSource（P6）。
// useCalendarDataSource 与 CalendarDataSource 契约已下沉到 swell-calendar 包（宿主侧可选装配件）。
// App 仅持有 UI 偏好的持久化——UI 状态不属于业务数据，不走数据源。
const UI_PREFS_KEY = 'swell-calendar-s2:ui-prefs';
const CALENDAR_TUNING_KEY = 'swell-calendar-s2:calendar-tuning';

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

// 主题值全部指向 CSS 变量。
// 这样 root 上的 data-theme / data-accent 改变后，日历引擎无需维护多份硬编码 theme object。
const CALENDAR_THEME = {
  week: {
    nowIndicatorLabel: { color: 'var(--accent-bg)' },
    gridSelection: { color: 'var(--accent-bg)' },
    today: { color: 'inherit', backgroundColor: 'transparent' },
    allday: {
      backgroundColor: 'var(--bg-sunken)',
      borderBottom: '1px solid var(--border)',
      labelColor: 'var(--text-3)',
      labelBorderRight: '1px solid var(--grid-line)',
    },
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
      rowBorderBottom: '1px solid var(--grid-line)',
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

function loadCalendarTuning(): CalendarHostTuning {
  return sanitizeCalendarTuning(
    loadJSON<Partial<CalendarHostTuning>>(CALENDAR_TUNING_KEY, DEFAULT_CALENDAR_TUNING)
  );
}

interface AppProps {
  /** 当前视图，由路由参数派生（唯一真源是 URL）。 */
  view: ViewId;
}

export default function App({ view }: AppProps) {
  // view 的真源是 URL（router.tsx）；currentDate 由 App 内部管理 + 引擎 onPageChange 回填。
  // 刷新回到今天。
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  // 移动端视图状态独立于 URL（桌面 view 仍以路由为真源）；多日/列表分别映射到 multiDay/agenda。
  const [mobileView, setMobileView] = useState<MobileViewId>('day');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  // 引擎实际视图：桌面跟随路由；移动端 segmented 映射到包内真实视图。
  const engineView: ViewId = isMobile
    ? mobileView === 'month'
      ? 'month'
      : mobileView === 'multi'
        ? 'multiDay'
        : mobileView === 'list'
          ? 'agenda'
          : 'day'
    : view;
  const [pick, setPick] = useState<{ ev: PickEvent; anchor: HTMLElement } | null>(null);
  const [morePick, setMorePick] = useState<{
    date: Date;
    events: EventObject[];
    anchor: HTMLElement;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [showWknd, setShowWknd] = useState(true);
  const [monthNarrowWeekend, setMonthNarrowWeekend] = useState(false);
  const [sidebar, setSidebar] = useState(UI_DEFAULTS.sidebar);
  const [prefs, setPrefs] = useState<UiPrefs>(loadPrefs);
  const [calendarTuning, setCalendarTuning] = useState<CalendarHostTuning>(loadCalendarTuning);
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
  const monthMoreAnchorRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    localStorage.setItem(CALENDAR_TUNING_KEY, JSON.stringify(calendarTuning));
  }, [calendarTuning]);

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

  /**
   * 月视图的 overflow 行没有真实事件卡片 DOM，详情弹层需要允许锚定到浮层内点击的行，
   * 否则只能退回 document.activeElement，位置会漂移。
   */
  const openEventDetails = (event: EventObject, anchor?: HTMLElement | null) => {
    const fallbackAnchor = event.id ? findEventAnchor(event.id) : null;
    setPick({
      ev: toPickEvent(event),
      anchor: anchor ?? fallbackAnchor ?? (document.activeElement as HTMLElement),
    });
  };

  /** 从任意入口（含 +N 更多 浮层）直接进入编辑。 */
  const openEventEditById = (eventId: string) => {
    const original = allEvents.find((event) => event.id === eventId);
    if (!original) {
      return;
    }

    setMorePick(null);
    setPick(null);
    setEditing(original);
  };

  /** 月视图 `+N 更多` 不会把触发元素透传给宿主，需在捕获阶段记住真实按钮节点作为浮层锚点。 */
  const rememberMonthMoreAnchor = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const trigger = target.closest('.swell-calendar-month-more');
    monthMoreAnchorRef.current = trigger instanceof HTMLElement ? trigger : null;
  };

  // 视图切换 → 同步 Calendar 内部视图（桌面路由 / 移动 segmented 统一走 engineView）
  useEffect(() => {
    try {
      calRef.current?.setView(engineView);
    } catch {
      // 视图名不匹配 / 占位视图未挂载引擎时忽略
    }
  }, [engineView]);

  const closePop = () => setPick(null);

  const [title, sub] = useMemo(
    () =>
      computeViewTitle(engineView, currentDate, {
        resourceCount: calendarResources.length,
        showWeekend: showWknd,
        tuning: calendarTuning,
      }),
    [engineView, currentDate, showWknd, calendarTuning]
  );

  // 引擎 options 稳定化：引擎有 effect 监听 options.defaultView/initialDate 的引用变化
  // （packages/calendar Calendar.tsx:60-68），内联对象每次 render 新引用会让它与 onPageChange 成环。
  // useMemo 让引用仅在 view / currentDate / 周末开关 / 密度变化时改变，其余 render 复用旧引用。
  const calendarOptions = useMemo(() => {
    const options = buildCalendarOptions({
      view: engineView,
      currentDate,
      showWeekend: showWknd,
      monthNarrowWeekend,
      timelineRowHeight,
      resourceCount: calendarResources.length,
      tuning: calendarTuning,
    });

    return {
      ...options,
      scheduler: {
        ...options.scheduler,
        resources: calendarResources,
      },
      timeline: {
        ...options.timeline,
        resources: calendarResources,
      },
    };
  }, [engineView, currentDate, showWknd, monthNarrowWeekend, timelineRowHeight, calendarTuning]);

  // 桌面 / 移动两套外壳共享同一引擎画布与浮层，避免 Calendar 接线分叉。
  const calendarNode =
    status === 'loading' ? (
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
        className={
          isMobile
            ? `s2-calendar s2-calendar--mobile${mobileView === 'month' ? ' s2-calendar--mobile-month' : ''}`
            : 's2-calendar'
        }
        events={calendarEvents}
        calendars={calendarCalendars}
        theme={CALENDAR_THEME}
        options={calendarOptions}
        callbacks={{
          onEventClick: ({ event }) => {
            openEventDetails(event);
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
          // 月视图「+N 更多」点击 → 弹出该日所有事件列表
          onMoreEventsClick: ({ date, events }) => {
            const anchor = monthMoreAnchorRef.current ?? (document.activeElement as HTMLElement);
            setMorePick({ date: date as unknown as Date, events, anchor });
          },
        }}
      />
    );

  const overlays = (
    <>
      {pick && isMobile && (
        <MobileEventSheet
          ev={pick.ev}
          onClose={closePop}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}
      {pick && !isMobile && (
        <Popover
          ev={pick.ev}
          anchor={pick.anchor}
          onClose={closePop}
          variant={UI_DEFAULTS.popover}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}
      {morePick && (
        <MoreEventsPopover
          date={morePick.date}
          events={morePick.events}
          anchor={morePick.anchor}
          onClose={() => setMorePick(null)}
          onEventClick={(eventId, anchor) => {
            const ev = morePick.events.find((e) => e.id === eventId);
            if (ev) {
              openEventDetails(ev as EventObject, anchor);
            }
            setMorePick(null);
          }}
          onEventEdit={openEventEditById}
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
          tuning={calendarTuning}
          onChange={setPrefs}
          onTuningChange={setCalendarTuning}
          onClose={() => setSettingsAnchor(null)}
        />
      )}
    </>
  );

  // ===== 移动外壳（M1）=====
  if (isMobile) {
    const monthLabel = `${currentDate.getMonth() + 1}月`;
    return (
      <Provider colorScheme={prefs.theme}>
        <ToastContainer />
        <div className="app app--mobile" data-card={UI_DEFAULTS.card} data-density={prefs.density}>
          <MobileTopBar view={mobileView} setView={setMobileView} monthLabel={monthLabel} />
          {(mobileView === 'day' || mobileView === 'multi') && (
            <DayWeekStrip
              currentDate={currentDate}
              onDateChange={goToDate}
              spanDays={mobileView === 'multi' ? 2 : 1}
            />
          )}
          {mobileView === 'month' && <div className="m-month-title">{monthLabel}</div>}
          {mobileView === 'month' && (
            <div className="m-month-dow" aria-hidden>
              {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, index) => (
                <div key={day} className={index >= 5 ? 'wknd' : undefined}>
                  {day}
                </div>
              ))}
            </div>
          )}
          <div
            className="canvas canvas--mobile"
            onMouseDownCapture={(e) => rememberMonthMoreAnchor(e.target)}
            onKeyDownCapture={(e) => rememberMonthMoreAnchor(e.target)}
          >
            {calendarNode}
          </div>
          {overlays}
        </div>
      </Provider>
    );
  }

  // ===== 桌面外壳 =====
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
          {(view === 'week' ||
            view === 'day' ||
            view === 'multiDay' ||
            view === 'scheduler' ||
            view === 'month') && (
            <SubBar
              showWknd={showWknd}
              setShowWknd={setShowWknd}
              // 周 / 月 / 资源调度都支持按宿主开关控制周末显隐。
              showWeekendToggle={
                view === 'week' || view === 'multiDay' || view === 'scheduler' || view === 'month'
              }
              showMonthNarrowWeekendToggle={view === 'month'}
              monthNarrowWeekend={monthNarrowWeekend}
              setMonthNarrowWeekend={setMonthNarrowWeekend}
              activeCats={activeCats}
              onToggleCat={toggleCat}
              onShowAll={() => setActiveCats(new Set(FILTER_CATS))}
            />
          )}
          {/* P8b: 去掉 key={view}，改纯 setView 驱动，避免切视图重挂载重置已导航日期 */}
          <div
            className="canvas"
            onMouseDownCapture={(e) => rememberMonthMoreAnchor(e.target)}
            onKeyDownCapture={(e) => rememberMonthMoreAnchor(e.target)}
          >
            {calendarNode}
          </div>
        </div>
        {overlays}
      </div>
    </Provider>
  );
}
