export type TimeGridLeftTheme = {
  width: string;
};

export type WeekDayNameTheme = {
  borderLeft: string;
  borderTop: string;
  borderBottom: string;
  backgroundColor: string;
};

export type DayGridTheme = {
  borderRight: string;
  backgroundColor: string;
};

export type WeekTheme = {
  dayName: WeekDayNameTheme;
  timeGridLeft: TimeGridLeftTheme;
  pastTime: {
    color: string;
  };
  futureTime: {
    color: string;
  };
  showNowIndicator: boolean; // 是否显示当前时间指示器
  nowIndicatorLabel: {
    color: string;
  };
  timeGridHalfHourLine: {
    borderBottom: string;
  };
  timeGridHourLine: {
    borderBottom: string;
  };
  gridSelection: {
    color: string;
  };
  dayGrid: DayGridTheme; // 日网格主题
  today: { color: string; backgroundColor: string }; // 今天主题
  weekend: { backgroundColor: string }; // 周末主题
  pastDay: { color: string }; // 过去日期主题
};

export type CommonTheme = {
  gridSelection: {
    border: string;
    backgroundColor: string;
  };
  dayName: { color: string };
  holiday: { color: string };
  saturday: { color: string };
  today: { color: string };
};

export type ThemeState = {
  week: WeekTheme;
  common: CommonTheme;
  month: MonthTheme;
  timeline: TimelineTheme;
};

export type MonthDayNameTheme = {
  borderLeft: string;
  backgroundColor: string;
};

export type MonthTheme = {
  dayName: MonthDayNameTheme;
};

// ─── Timeline 主题 ─────────────────────────────────────────────────────────────

export type TimelineResourceListTheme = {
  borderRight: string;
  backgroundColor: string;
};

export type TimelineResourceItemTheme = {
  borderBottom: string;
  nameColor: string;
};

export type TimelineHeaderTheme = {
  borderBottom: string;
  backgroundColor: string;
  placeholderBackgroundColor: string;
  monthColor: string;
  monthBackgroundColor: string;
  monthBorderBottom: string;
  dayBorderRight: string;
  weekendBackgroundColor: string;
  todayBackgroundColor: string;
  todayColor: string;
  weekdayColor: string;
  dateColor: string;
};

export type TimelineGridTheme = {
  rowBorderBottom: string;
  cellBorderRight: string;
  weekendBackgroundColor: string;
  todayBackgroundColor: string;
  dragGhostBackgroundColor: string;
  dragGhostBorder: string;
};

export type TimelineTooltipTheme = {
  backgroundColor: string;
  color: string;
  border: string;
};

export type TimelineTheme = {
  resourceList: TimelineResourceListTheme;
  resourceItem: TimelineResourceItemTheme;
  header: TimelineHeaderTheme;
  schedulerHeader: TimelineSchedulerHeaderTheme;
  schedulerResourceCell: TimelineSchedulerResourceCellTheme;
  grid: TimelineGridTheme;
  emptyColor: string;
  tooltip: TimelineTooltipTheme;
};

export type TimelineSchedulerHeaderTheme = {
  borderBottom: string;
  backgroundColor: string;
  dateRowBackgroundColor: string;
  dateRowBorderBottom: string;
  dayLabelColor: string;
  dayLabelBorderRight: string;
};

export type TimelineSchedulerResourceCellTheme = {
  nameColor: string;
};
