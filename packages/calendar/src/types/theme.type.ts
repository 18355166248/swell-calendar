export type TimeGridLeftTheme = {
  width: string;
};

export type WeekTheme = {
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
};

export type CommonTheme = {
  gridSelection: {
    border: string;
    backgroundColor: string;
  };
};
export type ThemeState = {
  week: WeekTheme;
  common: CommonTheme;
};
