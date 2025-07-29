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
};

export type MonthDayNameTheme = {
  borderLeft: string;
  backgroundColor: string;
};

export type MonthTheme = {
  dayName: MonthDayNameTheme;
};
